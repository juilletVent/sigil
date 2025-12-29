// ==================== 模块声明 ====================

mod autostart;
mod command_runner;
mod commands;
mod config;
mod constants;
mod db;
#[cfg(test)]
mod db_test;
mod error;
mod i18n;
mod logger;
mod monitor;
mod single_instance;
mod window;

// ==================== 引入依赖 ====================

use command_runner::CommandRunner;
use commands::*;
use db::Database;
use monitor::{start_high_frequency_monitor, start_low_frequency_monitor};
use monitor::{DiskMonitorState, MonitorState};
use tauri::Manager;
use window::{setup_main_window, setup_tray};

// ==================== 应用入口 ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 检查单实例
    let (is_existing, mutex_handle) = single_instance::check_single_instance();
    
    if is_existing {
        // 已有实例在运行，尝试通过 IPC 激活它
        eprintln!("检测到已有实例在运行，正在激活...");
        if single_instance::activate_existing_instance() {
            eprintln!("已发送激活请求，退出当前启动");
        } else {
            eprintln!("无法连接到现有实例");
        }
        // 退出当前实例
        std::process::exit(0);
    }
    
    // 保存互斥体句柄，在应用退出时释放
    let mutex_handle_for_exit = mutex_handle;
    
    tauri::Builder::default()
        .setup(|app| {
            // 首先尝试初始化日志系统（如果失败，至少尝试记录到文件）
            if let Err(e) = logger::init_logger(app.handle()) {
                // 如果日志初始化失败，尝试使用默认日志
                eprintln!("警告：日志系统初始化失败: {}", e);
                let _ = env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).try_init();
            }
            
            log::info!("应用启动中...");
            
            // 初始化数据库
            log::debug!("初始化数据库");
            let database = match Database::init(app.handle()) {
                Ok(db) => {
            log::info!("数据库初始化成功");
                    db
                }
                Err(e) => {
                    let error_msg = format!("数据库初始化失败: {}", e);
                    log::error!("{}", error_msg);
                    eprintln!("错误: {}", error_msg);
                    
                    // 尝试显示错误对话框（Windows平台）
                    #[cfg(target_os = "windows")]
                    {
                        use windows::Win32::UI::WindowsAndMessaging::{
                            MessageBoxW, MB_ICONERROR, MB_OK,
                        };
                        use windows::core::PCWSTR;
                        use std::ffi::OsStr;
                        use std::os::windows::ffi::OsStrExt;
                        
                        // 获取应用数据目录路径用于显示
                        let app_data_dir = app
                            .handle()
                            .path()
                            .resolve("", tauri::path::BaseDirectory::AppLocalData)
                            .ok()
                            .map(|p| p.join(crate::constants::APP_NAME))
                            .map(|p| format!("{:?}", p))
                            .unwrap_or_else(|| "未知".to_string());
                        
                        let msg_text = format!(
                            "{}\n\n应用将无法正常使用。\n\n请检查：\n1. 是否有足够的磁盘空间\n2. 是否有文件系统权限\n3. 应用数据目录是否可写\n\n应用数据目录: {}\n\n错误详情已记录到日志文件。",
                            error_msg, app_data_dir
                        );
                        
                        let msg: Vec<u16> = OsStr::new(&msg_text)
                            .encode_wide()
                            .chain(std::iter::once(0))
                            .collect();
                        
                        let title: Vec<u16> = OsStr::new("Sigil - 初始化失败")
                            .encode_wide()
                            .chain(std::iter::once(0))
                            .collect();
                        
                        unsafe {
                            MessageBoxW(
                                None,
                                PCWSTR(msg.as_ptr()),
                                PCWSTR(title.as_ptr()),
                                MB_OK | MB_ICONERROR,
                            );
                        }
                    }
                    
                    // 返回错误，这会导致应用无法启动
                    // 但至少用户能看到错误信息
                    return Err(error_msg.into());
                }
            };
            app.manage(database);

            // 设置主窗口
            let window = setup_main_window(app)?;

            // 设置系统托盘
            setup_tray(app, window.clone())?;

            // 启动 IPC 服务器，用于接收来自其他实例的激活请求
            #[cfg(target_os = "windows")]
            {
                use std::net::TcpListener;
                use std::io::{Read, Write};
                use std::thread;
                
                let app_handle = app.handle().clone();
                
                thread::spawn(move || {
                    // 启动 TCP 服务器
                    if let Ok(listener) = TcpListener::bind("127.0.0.1:14201") {
                        log::info!("IPC 服务器已启动，监听端口 14201");
                        for stream in listener.incoming() {
                            match stream {
                                Ok(mut stream) => {
                                    let mut buffer = [0u8; 8];
                                    if let Ok(_) = stream.read_exact(&mut buffer) {
                                        if &buffer == b"activate" {
                                            // 收到激活请求，使用 Tauri API 激活窗口
                                            log::info!("收到激活请求，激活主窗口");
                                            if let Some(window) = app_handle.get_webview_window("main") {
                                                // 检查窗口是否最小化
                                                if window.is_minimized().unwrap_or(false) {
                                                    // 如果窗口最小化，先恢复窗口
                                                    log::info!("窗口已最小化，正在恢复...");
                                                    let _ = window.unminimize();
                                                }
                                                
                                                // 如果窗口不可见，先显示
                                                if !window.is_visible().unwrap_or(true) {
                                                    let _ = window.show();
                                                }
                                                
                                                // 激活窗口
                                                let _ = window.set_focus();
                                            }
                                            // 发送响应
                                            let _ = stream.write_all(b"ok");
                                        }
                                    }
                                }
                                Err(e) => {
                                    log::warn!("IPC 连接错误: {}", e);
                                }
                            }
                        }
                    } else {
                        log::warn!("无法启动 IPC 服务器，端口可能已被占用");
                    }
                });
            }

            // 注册全局状态
            app.manage(MonitorState::default());
            app.manage(DiskMonitorState::default());

            // 初始化命令运行器
            let command_runner = CommandRunner::new(app.handle().clone());
            app.manage(command_runner);

            // 启动监控后台线程
            start_high_frequency_monitor(app.handle().clone());
            start_low_frequency_monitor(app.handle().clone());

            // 同步开机自启动状态
            #[cfg(target_os = "windows")]
            {
                use constants::APP_NAME;
                let database = app.state::<Database>();
                if let Ok(Some(auto_start_value)) = database.get_config(constants::config_keys::AUTO_START) {
                    let should_enable = auto_start_value == "true";
                    
                    match autostart::is_autostart_enabled(APP_NAME) {
                        Ok(is_enabled) => {
                            if should_enable && !is_enabled {
                                // 数据库配置为启用，但注册表未设置，则设置注册表
                                if let Ok(app_path) = app
                                    .path()
                                    .resolve("sigil.exe", tauri::path::BaseDirectory::Executable)
                                    .or_else(|_| std::env::current_exe())
                                {
                                    let _ = autostart::enable_autostart(
                                        APP_NAME,
                                        &app_path.to_string_lossy(),
                                    );
                                }
                            } else if !should_enable && is_enabled {
                                // 数据库配置为禁用，但注册表已设置，则清除注册表
                                let _ = autostart::disable_autostart(APP_NAME);
                            }
                        }
                        Err(_) => {
                            // 检查失败，忽略
                        }
                    }
                }
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            // 系统监控命令
            get_system_info,
            get_disk_info,
            // 数据库命令
            create_command,
            get_all_commands,
            get_command_by_id,
            update_command,
            delete_command,
            update_sort_orders,
            get_system_config,
            set_system_config,
            get_all_system_configs,
            // 命令执行命令
            execute_command,
            stop_command,
            get_command_state,
            get_all_command_states,
            // 导入导出命令
            export_commands,
            import_commands,
            write_export_file,
            read_import_file,
            // 日志相关命令
            get_command_logs,
            clear_command_logs,
            open_log_window,
            update_log_window_title,
            // 开机自启动命令
            enable_autostart,
            disable_autostart,
            check_autostart_status,
            // 开发者工具命令
            open_devtools,
            close_devtools,
            toggle_devtools
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    
    // 应用退出时释放互斥体
    if let Some(handle) = mutex_handle_for_exit {
        single_instance::release_mutex(handle);
    }
}
