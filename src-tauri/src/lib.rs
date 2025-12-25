// ==================== 模块声明 ====================

mod command_runner;
mod commands;
mod db;
mod monitor;
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
    tauri::Builder::default()
        .setup(|app| {
            // 初始化数据库
            let database = Database::init(app.handle())
                .map_err(|e| format!("初始化数据库失败: {}", e))?;
            app.manage(database);

            // 设置主窗口
            let window = setup_main_window(app)?;

            // 设置系统托盘
            setup_tray(app, window)?;

            // 注册全局状态
            app.manage(MonitorState::default());
            app.manage(DiskMonitorState::default());

            // 初始化命令运行器
            let command_runner = CommandRunner::new(app.handle().clone());
            app.manage(command_runner);

            // 启动监控后台线程
            start_high_frequency_monitor(app.handle().clone());
            start_low_frequency_monitor(app.handle().clone());

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
            open_log_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
