use crate::autostart;
use crate::command_runner::{CommandRunner, CommandState, ExecuteCommandParams};
use crate::constants;
use crate::db::{self, CreateCommandInput, Database, UpdateCommandInput};
use crate::i18n::{get_language_from_db, Translations};
use crate::monitor::{DiskInfo, DiskMonitorState, MonitorState, SystemInfo};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, EventTarget, Manager, State};

// ==================== 系统监控命令 ====================

/// 获取系统信息（CPU + 内存）
#[tauri::command]
pub fn get_system_info(app: AppHandle) -> Result<SystemInfo, String> {
    let state = app.state::<MonitorState>();
    let system_info = state
        .system_info
        .lock()
        .map_err(|e| format!("获取系统信息失败: {}", e))?;

    Ok(system_info.clone())
}

/// 获取磁盘信息
#[tauri::command]
pub fn get_disk_info(app: AppHandle) -> Result<DiskInfo, String> {
    let state = app.state::<DiskMonitorState>();
    let disk_info = state
        .disk_info
        .lock()
        .map_err(|e| format!("获取磁盘信息失败: {}", e))?;

    Ok(disk_info.clone())
}

// ==================== 数据库命令 ====================

/// 创建命令
#[tauri::command]
pub fn create_command(
    database: State<Database>,
    name: String,
    command: String,
    sudo: bool,
    working_directory: Option<String>,
    url: Option<String>,
    notification_when_finished: bool,
) -> Result<db::Command, String> {
    let input = CreateCommandInput {
        name,
        command,
        sudo,
        working_directory,
        url,
        notification_when_finished,
    };
    database.create_command(input)
}

/// 获取所有命令
#[tauri::command]
pub fn get_all_commands(database: State<Database>) -> Result<Vec<db::Command>, String> {
    database.get_all_commands()
}

/// 根据ID获取命令
#[tauri::command]
pub fn get_command_by_id(database: State<Database>, id: i64) -> Result<db::Command, String> {
    database.get_command_by_id(id)
}

/// 更新命令
#[tauri::command]
pub fn update_command(
    database: State<Database>,
    id: i64,
    name: Option<String>,
    command: Option<String>,
    sudo: Option<bool>,
    working_directory: Option<String>,
    url: Option<String>,
    notification_when_finished: Option<bool>,
) -> Result<(), String> {
    let input = UpdateCommandInput {
        name,
        command,
        sudo,
        working_directory,
        url,
        notification_when_finished,
    };
    database.update_command(id, input)
}

/// 删除命令
#[tauri::command]
pub fn delete_command(database: State<Database>, id: i64) -> Result<(), String> {
    database.delete_command(id)
}

/// 更新命令排序
#[tauri::command]
pub fn update_sort_orders(database: State<Database>, command_ids: Vec<i64>) -> Result<(), String> {
    database.update_sort_orders(command_ids)
}

/// 获取系统配置
#[tauri::command]
pub fn get_system_config(database: State<Database>, key: String) -> Result<Option<String>, String> {
    database.get_config(&key)
}

/// 设置系统配置
#[tauri::command]
pub fn set_system_config(
    app: AppHandle,
    database: State<Database>,
    key: String,
    value: String,
) -> Result<(), String> {
    database.set_config(&key, &value)?;
    
    // 如果设置的是语言配置，广播语言变化事件到所有窗口
    if key == constants::config_keys::LANGUAGE {
        let _ = app.emit_to(EventTarget::Any, "language-changed", value);
    }
    
    Ok(())
}

/// 获取所有系统配置
#[tauri::command]
pub fn get_all_system_configs(
    database: State<Database>,
) -> Result<std::collections::HashMap<String, String>, String> {
    database.get_all_configs()
}

// ==================== 命令执行相关命令 ====================

/// 执行命令
#[tauri::command]
pub async fn execute_command(
    command_id: i64,
    db: State<'_, Database>,
    runner: State<'_, CommandRunner>,
) -> Result<(), String> {
    // 从数据库获取命令详情
    let command = db.get_command_by_id(command_id)?;

    // 构建执行参数
    let params = ExecuteCommandParams {
        command_id,
        command_name: command.name,
        command: command.command,
        sudo: command.sudo,
        working_directory: command.working_directory,
        notification_when_finished: command.notification_when_finished,
    };

    // 执行命令
    runner.execute(params)
}

/// 停止命令
#[tauri::command]
pub async fn stop_command(
    command_id: i64,
    runner: State<'_, CommandRunner>,
) -> Result<(), String> {
    runner.stop(command_id)
}

/// 获取单个命令的状态
#[tauri::command]
pub async fn get_command_state(
    command_id: i64,
    runner: State<'_, CommandRunner>,
) -> Result<Option<CommandState>, String> {
    Ok(runner.get_state(command_id))
}

/// 获取所有命令的状态
#[tauri::command]
pub async fn get_all_command_states(
    runner: State<'_, CommandRunner>,
) -> Result<std::collections::HashMap<i64, CommandState>, String> {
    Ok(runner.get_all_states())
}

// ==================== 导入导出相关命令 ====================

/// 导出用的命令数据结构（不包含 id, sort_order, created_at, updated_at）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportCommand {
    pub name: String,
    pub command: String,
    pub sudo: bool,
    pub working_directory: Option<String>,
    pub url: Option<String>,
    pub notification_when_finished: bool,
}

/// 导入结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub success_count: usize,
    pub skip_count: usize,
    pub failed_items: Vec<FailedItem>,
}

/// 失败项信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedItem {
    pub index: usize,
    pub reason: String,
}

/// 导出所有命令
#[tauri::command]
pub fn export_commands(database: State<Database>) -> Result<String, String> {
    // 获取所有命令
    let commands = database.get_all_commands()?;

    // 转换为导出格式
    let export_commands: Vec<ExportCommand> = commands
        .into_iter()
        .map(|cmd| ExportCommand {
            name: cmd.name,
            command: cmd.command,
            sudo: cmd.sudo,
            working_directory: cmd.working_directory,
            url: cmd.url,
            notification_when_finished: cmd.notification_when_finished,
        })
        .collect();

    // 序列化为 JSON
    serde_json::to_string_pretty(&export_commands)
        .map_err(|e| format!("序列化命令失败: {}", e))
}

/// 导入命令
#[tauri::command]
pub fn import_commands(database: State<Database>, json_data: String) -> Result<ImportResult, String> {
    // 解析 JSON
    let import_commands: Vec<ExportCommand> = serde_json::from_str(&json_data)
        .map_err(|e| format!("解析 JSON 失败: {}", e))?;

    let mut success_count = 0;
    let mut skip_count = 0;
    let mut failed_items = Vec::new();

    // 逐条导入
    for (index, cmd) in import_commands.into_iter().enumerate() {
        // 验证必填字段
        if cmd.name.trim().is_empty() {
            failed_items.push(FailedItem {
                index,
                reason: "命令名称不能为空".to_string(),
            });
            skip_count += 1;
            continue;
        }

        if cmd.command.trim().is_empty() {
            failed_items.push(FailedItem {
                index,
                reason: "命令内容不能为空".to_string(),
            });
            skip_count += 1;
            continue;
        }

        // 检查是否重复
        match database.check_command_exists(&cmd.name, &cmd.command) {
            Ok(exists) => {
                if exists {
                    failed_items.push(FailedItem {
                        index,
                        reason: "命令已存在（名称和内容重复）".to_string(),
                    });
                    skip_count += 1;
                    continue;
                }
            }
            Err(e) => {
                failed_items.push(FailedItem {
                    index,
                    reason: format!("检查重复失败: {}", e),
                });
                skip_count += 1;
                continue;
            }
        }

        // 创建命令
        let input = CreateCommandInput {
            name: cmd.name,
            command: cmd.command,
            sudo: cmd.sudo,
            working_directory: cmd.working_directory,
            url: cmd.url,
            notification_when_finished: cmd.notification_when_finished,
        };

        match database.create_command(input) {
            Ok(_) => {
                success_count += 1;
            }
            Err(e) => {
                failed_items.push(FailedItem {
                    index,
                    reason: format!("创建命令失败: {}", e),
                });
                skip_count += 1;
            }
        }
    }

    Ok(ImportResult {
        success_count,
        skip_count,
        failed_items,
    })
}

/// 将导出数据写入文件
#[tauri::command]
pub fn write_export_file(file_path: String, data: String) -> Result<(), String> {
    // 使用 PathBuf 处理路径，确保带空格的路径被正确处理
    let path = std::path::PathBuf::from(&file_path);
    std::fs::write(&path, data)
        .map_err(|e| format!("写入文件失败: {}。路径: {:?}", e, path))
}

/// 从文件读取导入数据
#[tauri::command]
pub fn read_import_file(file_path: String) -> Result<String, String> {
    // 使用 PathBuf 处理路径，确保带空格的路径被正确处理
    let path = std::path::PathBuf::from(&file_path);
    std::fs::read_to_string(&path)
        .map_err(|e| format!("读取文件失败: {}。路径: {:?}", e, path))
}

// ==================== 日志相关命令 ====================

/// 获取命令日志
#[tauri::command]
pub fn get_command_logs(
    command_id: i64,
    runner: State<CommandRunner>,
) -> Result<Vec<String>, String> {
    Ok(runner.get_logs(command_id))
}

/// 清空命令日志
#[tauri::command]
pub fn clear_command_logs(
    command_id: i64,
    runner: State<CommandRunner>,
) -> Result<(), String> {
    runner.clear_logs(command_id);
    Ok(())
}

/// 打开命令日志窗口
#[tauri::command]
pub async fn open_log_window(
    app: AppHandle,
    command_id: i64,
    command_name: String,
) -> Result<(), String> {
    crate::window::create_log_window(&app, command_id, &command_name)
}

/// 更新日志窗口标题
#[tauri::command]
pub async fn update_log_window_title(
    app: AppHandle,
    command_id: i64,
    command_name: String,
) -> Result<(), String> {
    let database = app.state::<Database>();
    let language = crate::i18n::get_language_from_db(database.inner());
    let window_label = format!("log-{}", command_id);
    
    if let Some(window) = app.get_webview_window(&window_label) {
        let title = crate::i18n::Translations::log_window_title(language, &command_name);
        window.set_title(&title)
            .map_err(|e| format!("更新窗口标题失败: {}", e))?;
    }
    
    Ok(())
}

// ==================== 开机自启动相关命令 ====================

/// 启用开机自启动
#[tauri::command]
pub fn enable_autostart(app: AppHandle, database: State<Database>) -> Result<(), String> {
    let language = get_language_from_db(database.inner());
    
    // 获取应用名称
    let app_name = constants::APP_NAME;
    
    // 获取应用可执行文件路径（多个fallback策略）
    let app_path = {
        // 策略1: 尝试从Tauri的Executable目录获取
        let path1 = app
            .path()
            .resolve("sigil.exe", tauri::path::BaseDirectory::Executable);
        
        // 策略2: 尝试从当前可执行文件获取
        let path2 = std::env::current_exe();
        
        // 策略3: 尝试从Tauri的Resource目录获取（分发场景）
        let path3 = app
            .path()
            .resolve("sigil.exe", tauri::path::BaseDirectory::Resource);
        
        // 按优先级尝试
        path1
            .or_else(|_| path2)
            .or_else(|_| path3)
            .map_err(|e| {
                // 如果所有策略都失败，返回详细错误信息
                Translations::autostart_get_path_failed(
                    language,
                    &format!("无法获取应用路径: {}", e),
                )
            })?
            .to_string_lossy()
            .to_string()
    };
    
    // 验证路径是否存在
    if !std::path::Path::new(&app_path).exists() {
        return Err(Translations::autostart_get_path_failed(
            language,
            &format!("应用路径不存在: {}", app_path),
        ));
    }
    
    // 启用自启动
    autostart::enable_autostart(app_name, &app_path)
        .map_err(|e| Translations::autostart_enable_failed(language, &e))?;
    
    Ok(())
}

/// 禁用开机自启动
#[tauri::command]
pub fn disable_autostart(_app: AppHandle, database: State<Database>) -> Result<(), String> {
    let language = get_language_from_db(database.inner());
    
    // 获取应用名称
    let app_name = constants::APP_NAME;
    
    // 禁用自启动
    autostart::disable_autostart(app_name)
        .map_err(|e| Translations::autostart_disable_failed(language, &e))?;
    
    Ok(())
}

/// 检查开机自启动状态
#[tauri::command]
pub fn check_autostart_status(_app: AppHandle, _database: State<Database>) -> Result<bool, String> {
    // 获取应用名称
    let app_name = constants::APP_NAME;
    
    // 检查自启动状态
    autostart::is_autostart_enabled(app_name)
}

// ==================== 开发者工具相关命令 ====================

/// 打开开发者工具
#[tauri::command]
pub fn open_devtools(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.open_devtools();
        Ok(())
    } else {
        Err("找不到主窗口".to_string())
    }
}

/// 关闭开发者工具
#[tauri::command]
pub fn close_devtools(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.close_devtools();
        Ok(())
    } else {
        Err("找不到主窗口".to_string())
    }
}

/// 切换开发者工具
#[tauri::command]
pub fn toggle_devtools(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // 检查开发者工具是否已打开
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
        Ok(())
    } else {
        Err("找不到主窗口".to_string())
    }
}

