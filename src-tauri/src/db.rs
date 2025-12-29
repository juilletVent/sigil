use rusqlite::{params, Connection, OptionalExtension, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;
use crate::constants;

// ==================== 数据结构定义 ====================

/// 命令数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub id: i64,
    pub name: String,
    pub command: String,
    pub sudo: bool,
    pub working_directory: Option<String>,
    pub url: Option<String>,
    pub notification_when_finished: bool,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

/// 创建命令的输入参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCommandInput {
    pub name: String,
    pub command: String,
    pub sudo: bool,
    pub working_directory: Option<String>,
    pub url: Option<String>,
    pub notification_when_finished: bool,
}

/// 更新命令的输入参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCommandInput {
    pub name: Option<String>,
    pub command: Option<String>,
    pub sudo: Option<bool>,
    pub working_directory: Option<String>,
    pub url: Option<String>,
    pub notification_when_finished: Option<bool>,
}

// ==================== 数据库管理 ====================

/// 数据库连接管理器
pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// 获取应用数据目录（LocalAppData下的应用子目录）
    fn get_app_data_dir(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
        // 获取LocalAppData目录下的应用子目录
        let app_data_dir = app_handle
            .path()
            .resolve("", tauri::path::BaseDirectory::AppLocalData)
            .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
        
        // 创建应用特定的子目录
        let app_dir = app_data_dir.join(constants::APP_NAME);
        
        Ok(app_dir)
    }

    /// 初始化数据库
    pub fn init(app_handle: &tauri::AppHandle) -> Result<Self, String> {
        // 获取应用数据目录（LocalAppData下的应用子目录）
        let app_dir = Self::get_app_data_dir(app_handle)?;

        // 确保目录存在（递归创建所有必要的父目录）
        std::fs::create_dir_all(&app_dir).map_err(|e| {
            format!(
                "创建应用数据目录失败: {}。路径: {:?}。请检查文件系统权限。",
                e, app_dir
            )
        })?;

        // 验证目录是否可写
        let test_file = app_dir.join(".write_test");
        if let Err(e) = std::fs::write(&test_file, b"test") {
            return Err(format!(
                "应用数据目录不可写: {}。路径: {:?}。请检查文件系统权限。",
                e, app_dir
            ));
        }
        // 清理测试文件
        let _ = std::fs::remove_file(&test_file);

        // 数据库文件路径
        let db_path = app_dir.join(constants::DB_FILE_NAME);
        
        // 规范化路径（如果可能），确保带空格的路径被正确处理
        // 注意：如果文件不存在，canonicalize 会失败，所以先尝试规范化目录
        let db_path = if let Ok(canonical_dir) = app_dir.canonicalize() {
            canonical_dir.join(constants::DB_FILE_NAME)
        } else {
            // 如果无法规范化（例如文件不存在），使用原始路径
            // PathBuf 本身就能正确处理带空格的路径
            db_path
        };
        
        // 连接数据库（如果文件不存在会自动创建）
        // Connection::open 接受 AsRef<Path>，PathBuf 实现了这个 trait，能正确处理带空格的路径
        let conn = Connection::open(&db_path).map_err(|e| {
            format!(
                "打开数据库失败: {}。路径: {:?}。请确保有足够的磁盘空间和文件系统权限。",
                e, db_path
            )
        })?;

        // 创建表（如果不存在）
        Self::create_tables(&conn).map_err(|e| {
            format!(
                "创建数据库表失败: {}。这可能是数据库文件损坏导致的。",
                e
            )
        })?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    /// 创建数据库表
    pub(crate) fn create_tables(conn: &Connection) -> Result<(), String> {
        // 创建命令表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                command TEXT NOT NULL,
                sudo BOOLEAN NOT NULL DEFAULT 0,
                working_directory TEXT,
                url TEXT,
                notification_when_finished BOOLEAN NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )
        .map_err(|e| format!("创建命令表失败: {}", e))?;

        // 创建系统配置表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )
        .map_err(|e| format!("创建配置表失败: {}", e))?;

        Ok(())
    }

    // ==================== 命令操作 ====================

    /// 创建新命令
    pub fn create_command(&self, input: CreateCommandInput) -> Result<Command, String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        // 获取当前最大的 sort_order
        let max_sort_order: i64 = conn
            .query_row("SELECT COALESCE(MAX(sort_order), -1) FROM commands", [], |row| {
                row.get(0)
            })
            .unwrap_or(-1);

        let new_sort_order = max_sort_order + 1;

        // 插入命令
        conn.execute(
            "INSERT INTO commands (name, command, sudo, working_directory, url, notification_when_finished, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                input.name,
                input.command,
                input.sudo,
                input.working_directory,
                input.url,
                input.notification_when_finished,
                new_sort_order,
            ],
        )
        .map_err(|e| format!("插入命令失败: {}", e))?;

        let id = conn.last_insert_rowid();

        // 获取刚创建的命令
        self.get_command_by_id_internal(&conn, id)
    }

    /// 获取所有命令（按 sort_order 排序）
    pub fn get_all_commands(&self) -> Result<Vec<Command>, String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        let mut stmt = conn
            .prepare("SELECT id, name, command, sudo, working_directory, url, notification_when_finished, sort_order, created_at, updated_at FROM commands ORDER BY sort_order ASC")
            .map_err(|e| format!("准备查询失败: {}", e))?;

        let commands = stmt
            .query_map([], |row| {
                Ok(Command {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    command: row.get(2)?,
                    sudo: row.get(3)?,
                    working_directory: row.get(4)?,
                    url: row.get(5)?,
                    notification_when_finished: row.get(6)?,
                    sort_order: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })
            .map_err(|e| format!("查询命令失败: {}", e))?
            .collect::<SqliteResult<Vec<Command>>>()
            .map_err(|e| format!("收集查询结果失败: {}", e))?;

        Ok(commands)
    }

    /// 根据 ID 获取命令（内部使用，不需要锁）
    fn get_command_by_id_internal(&self, conn: &Connection, id: i64) -> Result<Command, String> {
        let mut stmt = conn
            .prepare("SELECT id, name, command, sudo, working_directory, url, notification_when_finished, sort_order, created_at, updated_at FROM commands WHERE id = ?1")
            .map_err(|e| format!("准备查询失败: {}", e))?;

        let command = stmt
            .query_row([id], |row| {
                Ok(Command {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    command: row.get(2)?,
                    sudo: row.get(3)?,
                    working_directory: row.get(4)?,
                    url: row.get(5)?,
                    notification_when_finished: row.get(6)?,
                    sort_order: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })
            .map_err(|e| format!("查询命令失败: {}", e))?;

        Ok(command)
    }

    /// 根据 ID 获取命令
    pub fn get_command_by_id(&self, id: i64) -> Result<Command, String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;
        self.get_command_by_id_internal(&conn, id)
    }

    /// 更新命令
    pub fn update_command(&self, id: i64, input: UpdateCommandInput) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        // 构建动态更新语句
        let mut updates = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(name) = &input.name {
            updates.push("name = ?");
            params.push(Box::new(name.clone()));
        }
        if let Some(command) = &input.command {
            updates.push("command = ?");
            params.push(Box::new(command.clone()));
        }
        if let Some(sudo) = input.sudo {
            updates.push("sudo = ?");
            params.push(Box::new(sudo));
        }
        if let Some(working_directory) = &input.working_directory {
            updates.push("working_directory = ?");
            params.push(Box::new(working_directory.clone()));
        }
        if let Some(url) = &input.url {
            updates.push("url = ?");
            params.push(Box::new(url.clone()));
        }
        if let Some(notification_when_finished) = input.notification_when_finished {
            updates.push("notification_when_finished = ?");
            params.push(Box::new(notification_when_finished));
        }

        if updates.is_empty() {
            return Ok(());
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");

        let sql = format!("UPDATE commands SET {} WHERE id = ?", updates.join(", "));
        params.push(Box::new(id));

        let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();

        conn.execute(&sql, params_refs.as_slice())
            .map_err(|e| format!("更新命令失败: {}", e))?;

        Ok(())
    }

    /// 删除命令
    pub fn delete_command(&self, id: i64) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        conn.execute("DELETE FROM commands WHERE id = ?1", [id])
            .map_err(|e| format!("删除命令失败: {}", e))?;

        Ok(())
    }

    /// 批量更新命令排序
    pub fn update_sort_orders(&self, command_ids: Vec<i64>) -> Result<(), String> {
        let mut conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        let tx = conn
            .transaction()
            .map_err(|e| format!("开始事务失败: {}", e))?;

        for (index, command_id) in command_ids.iter().enumerate() {
            tx.execute(
                "UPDATE commands SET sort_order = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![index as i64, command_id],
            )
            .map_err(|e| format!("更新排序失败: {}", e))?;
        }

        tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;

        Ok(())
    }

    /// 检查命令是否存在（根据 name 和 command）
    pub fn check_command_exists(&self, name: &str, command: &str) -> Result<bool, String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM commands WHERE name = ?1 AND command = ?2",
                params![name, command],
                |row| row.get(0),
            )
            .map_err(|e| format!("查询命令是否存在失败: {}", e))?;

        Ok(count > 0)
    }

    // ==================== 系统配置操作 ====================

    /// 获取配置项
    pub fn get_config(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        let result = conn
            .query_row("SELECT value FROM system_config WHERE key = ?1", [key], |row| {
                row.get(0)
            })
            .optional()
            .map_err(|e| format!("查询配置失败: {}", e))?;

        Ok(result)
    }

    /// 设置配置项
    pub fn set_config(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        conn.execute(
            "INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
            params![key, value],
        )
        .map_err(|e| format!("设置配置失败: {}", e))?;

        Ok(())
    }

    /// 获取所有配置
    pub fn get_all_configs(&self) -> Result<std::collections::HashMap<String, String>, String> {
        let conn = self.conn.lock().map_err(|e| format!("获取数据库连接失败: {}", e))?;

        let mut stmt = conn
            .prepare("SELECT key, value FROM system_config")
            .map_err(|e| format!("准备查询失败: {}", e))?;

        let configs = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| format!("查询配置失败: {}", e))?
            .collect::<SqliteResult<std::collections::HashMap<String, String>>>()
            .map_err(|e| format!("收集查询结果失败: {}", e))?;

        Ok(configs)
    }

    #[cfg(test)]
    /// 创建测试数据库（仅用于测试）
    pub fn new_for_testing(conn: Connection) -> Self {
        Database {
            conn: Mutex::new(conn),
        }
    }
}

