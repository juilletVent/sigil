use image::GenericImageView;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::{Disks, System};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::GetSystemMenu;

// ==================== 数据结构定义 ====================

/// 系统信息（CPU + 内存）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_usage: f32,       // CPU 占用百分比
    pub memory_used: u64,     // 内存使用量（字节）
    pub memory_total: u64,    // 内存总量（字节）
    pub memory_percent: f32,  // 内存占用百分比
}

/// 磁盘信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub disk_used: u64,       // 磁盘使用量（字节）
    pub disk_total: u64,      // 磁盘总量（字节）
    pub disk_percent: f32,    // 磁盘占用百分比
}

// ==================== 监控状态管理 ====================

/// 高频监控状态（CPU + 内存）- 1Hz 更新
struct MonitorState {
    system_info: Arc<Mutex<SystemInfo>>,
    monitoring_thread: Arc<AtomicBool>,
}

impl Default for MonitorState {
    fn default() -> Self {
        Self {
            system_info: Arc::new(Mutex::new(SystemInfo {
                cpu_usage: 0.0,
                memory_used: 0,
                memory_total: 0,
                memory_percent: 0.0,
            })),
            monitoring_thread: Arc::new(AtomicBool::new(false)),
        }
    }
}

/// 低频监控状态（磁盘）- 每分钟更新
struct DiskMonitorState {
    disk_info: Arc<Mutex<DiskInfo>>,
    monitoring_thread: Arc<AtomicBool>,
}

impl Default for DiskMonitorState {
    fn default() -> Self {
        Self {
            disk_info: Arc::new(Mutex::new(DiskInfo {
                disk_used: 0,
                disk_total: 0,
                disk_percent: 0.0,
            })),
            monitoring_thread: Arc::new(AtomicBool::new(false)),
        }
    }
}

// ==================== Tauri 命令函数 ====================

/// 获取系统信息（CPU + 内存）
#[tauri::command]
fn get_system_info(app: AppHandle) -> Result<SystemInfo, String> {
    let state = app.state::<MonitorState>();
    let system_info = state
        .system_info
        .lock()
        .map_err(|e| format!("获取系统信息失败: {}", e))?;

    Ok(system_info.clone())
}

/// 获取磁盘信息
#[tauri::command]
fn get_disk_info(app: AppHandle) -> Result<DiskInfo, String> {
    let state = app.state::<DiskMonitorState>();
    let disk_info = state
        .disk_info
        .lock()
        .map_err(|e| format!("获取磁盘信息失败: {}", e))?;

    Ok(disk_info.clone())
}

// ==================== 后台监控线程 ====================

/// 启动高频监控线程（CPU + 内存）- 1Hz
fn start_high_frequency_monitor(app: AppHandle) {
    let state = app.state::<MonitorState>();

    // 如果已经在监控，直接返回
    if state.monitoring_thread.load(Ordering::Relaxed) {
        return;
    }

    state.monitoring_thread.store(true, Ordering::Relaxed);

    let system_info_arc = state.system_info.clone();
    let monitoring_flag = state.monitoring_thread.clone();

    thread::spawn(move || {
        let mut system = System::new_all();

        // 第一次刷新
        system.refresh_all();
        thread::sleep(Duration::from_millis(200));

        while monitoring_flag.load(Ordering::Relaxed) {
            // 刷新 CPU 和内存信息
            system.refresh_cpu();
            system.refresh_memory();

            // 获取 CPU 使用率
            let cpu_usage = system.global_cpu_info().cpu_usage();

            // 获取内存信息
            let memory_used = system.used_memory();
            let memory_total = system.total_memory();
            let memory_percent = if memory_total > 0 {
                (memory_used as f32 / memory_total as f32) * 100.0
            } else {
                0.0
            };

            // 更新共享状态
            if let Ok(mut info) = system_info_arc.lock() {
                info.cpu_usage = cpu_usage;
                info.memory_used = memory_used;
                info.memory_total = memory_total;
                info.memory_percent = memory_percent;
            }

            // 每 1000ms 更新一次（1Hz）
            thread::sleep(Duration::from_millis(1000));
        }
    });
}

/// 启动低频监控线程（磁盘）- 每分钟
fn start_low_frequency_monitor(app: AppHandle) {
    let state = app.state::<DiskMonitorState>();

    // 如果已经在监控，直接返回
    if state.monitoring_thread.load(Ordering::Relaxed) {
        return;
    }

    state.monitoring_thread.store(true, Ordering::Relaxed);

    let disk_info_arc = state.disk_info.clone();
    let monitoring_flag = state.monitoring_thread.clone();

    thread::spawn(move || {
        let mut disks = Disks::new_with_refreshed_list();

        while monitoring_flag.load(Ordering::Relaxed) {
            // 刷新磁盘信息
            disks.refresh();

            // 汇总所有磁盘的总量和使用量
            let mut disk_total: u64 = 0;
            let mut disk_used: u64 = 0;

            for disk in disks.list() {
                disk_total += disk.total_space();
                disk_used += disk.total_space() - disk.available_space();
            }

            let disk_percent = if disk_total > 0 {
                (disk_used as f32 / disk_total as f32) * 100.0
            } else {
                0.0
            };

            // 更新共享状态
            if let Ok(mut info) = disk_info_arc.lock() {
                info.disk_used = disk_used;
                info.disk_total = disk_total;
                info.disk_percent = disk_percent;
            }

            // 每 60000ms 更新一次（1分钟）
            thread::sleep(Duration::from_millis(60000));
        }
    });
}

// ==================== 工具函数 ====================

/// 从文件加载图标
fn load_icon_from_file(path: &str) -> Result<tauri::image::Image<'static>, String> {
    let img = image::open(path).map_err(|e| format!("打开图标失败: {}", e))?;
    let (width, height) = img.dimensions();
    let rgba = img.to_rgba8().into_raw();
    Ok(tauri::image::Image::new_owned(rgba, width, height))
}

/// 禁用窗口系统菜单（Windows平台）
#[cfg(target_os = "windows")]
fn disable_system_menu(window: &tauri::WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let hwnd = HWND(hwnd.0 as *mut std::ffi::c_void);
            // 使用 true 参数完全删除系统菜单
            let _ = GetSystemMenu(hwnd, true);
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn disable_system_menu(_window: &tauri::WebviewWindow) {
    // 非 Windows 平台不需要处理
}

// ==================== 应用入口 ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取主窗口
            let window = app.get_webview_window("main").unwrap();

            // 禁用系统菜单
            disable_system_menu(&window);

            // 监听窗口关闭事件
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // 阻止窗口关闭
                    api.prevent_close();
                    // 隐藏窗口而不是退出
                    let _ = window_clone.hide();
                }
            });

            // 创建托盘菜单
            let show_item = MenuItem::with_id(app, "show", "显示/隐藏", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // 初始化托盘图标
            let window_for_tray = window.clone();
            let icon = load_icon_from_file("icons/128x128.png")
                .or_else(|_| load_icon_from_file("icons/icon.png"))
                .or_else(|_| load_icon_from_file("../icons/128x128.png"))
                .map_err(|e| format!("无法加载图标: {}", e))?;
            
            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(icon)
                .tooltip("Display CPU - 系统监控")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            // 切换窗口显示/隐藏
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "quit" => {
                            // 退出应用程序
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(move |_tray, event| {
                    match event {
                        tauri::tray::TrayIconEvent::Click {
                            button: tauri::tray::MouseButton::Left,
                            ..
                        } => {
                            // 左键单击：显示并激活窗口
                            if !window_for_tray.is_visible().unwrap_or(false) {
                                let _ = window_for_tray.show();
                            }
                            let _ = window_for_tray.set_focus();
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // 注册全局状态
            app.manage(MonitorState::default());
            app.manage(DiskMonitorState::default());

            // 启动监控后台线程
            start_high_frequency_monitor(app.handle().clone());
            start_low_frequency_monitor(app.handle().clone());

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_info, get_disk_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
