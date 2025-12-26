// ==================== 日志初始化 ====================

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

// 全局日志文件句柄
static LOG_FILE: Mutex<Option<std::fs::File>> = Mutex::new(None);

/// 获取程序运行目录（可执行文件所在目录）
fn get_app_dir(app_handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    // 策略1: 尝试从Tauri的Executable目录获取
    if let Ok(exe_path) = app_handle
        .path()
        .resolve("sigil.exe", tauri::path::BaseDirectory::Executable)
    {
        if let Some(parent) = exe_path.parent() {
            return Ok(parent.to_path_buf());
        }
    }

    // 策略2: 尝试从当前可执行文件获取
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            return Ok(parent.to_path_buf());
        }
    }

    // 策略3: 尝试从Tauri的Resource目录获取（分发场景）
    if let Ok(resource_path) = app_handle
        .path()
        .resolve("sigil.exe", tauri::path::BaseDirectory::Resource)
    {
        if let Some(parent) = resource_path.parent() {
            return Ok(parent.to_path_buf());
        }
    }

    Err("无法获取程序运行目录".to_string())
}

/// 初始化日志系统
pub fn init_logger(app_handle: &AppHandle) -> Result<(), String> {
    // 获取程序运行目录（可执行文件所在目录）
    let app_dir = get_app_dir(app_handle)?;

    // 确保目录存在
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("创建程序运行目录失败: {}", e))?;

    // 日志文件路径
    let log_file_path = app_dir.join("sigil.log");

    // 打开日志文件
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .map_err(|e| format!("打开日志文件失败: {}", e))?;

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
    let log_file_path = app_dir.join("sigil.log");
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
    {
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let _ = writeln!(file, "[{}] ERROR [init] {}", timestamp, error);
    }
}

