// ==================== 日志初始化 ====================

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

// 全局日志文件句柄
static LOG_FILE: Mutex<Option<std::fs::File>> = Mutex::new(None);

/// 获取应用数据目录（LocalAppData下的应用子目录）
fn get_app_data_dir(app_handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    // 获取LocalAppData目录下的应用子目录
    let app_data_dir = app_handle
        .path()
        .resolve("", tauri::path::BaseDirectory::AppLocalData)
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    
    // 创建应用特定的子目录
    let app_dir = app_data_dir.join(crate::constants::APP_NAME);
    
    Ok(app_dir)
}

/// 初始化日志系统
pub fn init_logger(app_handle: &AppHandle) -> Result<(), String> {
    // 获取应用数据目录（LocalAppData下的应用子目录）
    let app_dir = get_app_data_dir(app_handle)?;

    // 确保目录存在
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("创建应用数据目录失败: {}", e))?;

    // 日志文件路径
    // 规范化路径（如果可能），确保带空格的路径被正确处理
    let log_file_path = if let Ok(canonical_dir) = app_dir.canonicalize() {
        canonical_dir.join("sigil.log")
    } else {
        // 如果无法规范化（例如目录不存在），使用原始路径
        // PathBuf 本身就能正确处理带空格的路径
        app_dir.join("sigil.log")
    };

    // 打开日志文件
    // OpenOptions::open 接受 AsRef<Path>，PathBuf 实现了这个 trait，能正确处理带空格的路径
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .map_err(|e| format!("打开日志文件失败: {}。路径: {:?}", e, log_file_path))?;

    // 保存文件句柄
    {
        let mut file_handle = LOG_FILE.lock().unwrap();
        *file_handle = Some(log_file);
    }

    // 初始化 env_logger
    let log_level = if cfg!(debug_assertions) {
        "debug".to_string()
    } else {
        std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string())
    };

    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(log_level.as_str()))
        .format(move |buf, record| {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
            let level = record.level();
            let target = record.target();
            let args = record.args();
            
            // 输出到控制台
            let _ = writeln!(
                buf,
                "[{}] {} [{}] {}",
                timestamp, level, target, args
            );

            // 同时写入文件
            if let Ok(mut file_handle) = LOG_FILE.lock() {
                if let Some(ref mut file) = *file_handle {
                    let _ = writeln!(
                        file,
                        "[{}] {} [{}] {}",
                        timestamp, level, target, args
                    );
                    let _ = file.flush();
                }
            }

            Ok(())
        })
        .try_init()
        .map_err(|e| format!("初始化日志系统失败: {}", e))?;

    log::info!("日志系统初始化成功，日志文件: {:?}", log_file_path);

    Ok(())
}

/// 记录错误到日志文件（用于在日志系统初始化之前记录错误）
pub fn log_error_to_file(app_dir: &PathBuf, error: &str) {
    // 规范化路径（如果可能），确保带空格的路径被正确处理
    let log_file_path = if let Ok(canonical_dir) = app_dir.canonicalize() {
        canonical_dir.join("sigil.log")
    } else {
        // 如果无法规范化，使用原始路径
        app_dir.join("sigil.log")
    };
    
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
    {
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let _ = writeln!(file, "[{}] ERROR [init] {}", timestamp, error);
    }
}

