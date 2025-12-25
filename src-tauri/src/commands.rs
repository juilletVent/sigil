use crate::command_runner::{CommandRunner, CommandState, ExecuteCommandParams};
use crate::db::{self, CreateCommandInput, Database, UpdateCommandInput};
use crate::monitor::{DiskInfo, DiskMonitorState, MonitorState, SystemInfo};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

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
pub fn set_system_config(database: State<Database>, key: String, value: String) -> Result<(), String> {
    database.set_config(&key, &value)
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
    std::fs::write(&file_path, data)
        .map_err(|e| format!("写入文件失败: {}", e))
}

/// 从文件读取导入数据
#[tauri::command]
pub fn read_import_file(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))
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

