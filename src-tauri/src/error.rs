// ==================== 统一错误类型 ====================

use std::fmt;

/// 应用错误类型
#[allow(dead_code)]
#[derive(Debug)]
pub enum AppError {
    /// 数据库错误
    Database(String),
    /// IO错误
    Io(std::io::Error),
    /// SQLite错误
    Sqlite(rusqlite::Error),
    /// 序列化错误
    Serialization(String),
    /// 命令执行错误
    CommandExecution(String),
    /// 配置错误
    Config(String),
    /// 系统错误
    System(String),
    /// 未知错误
    Unknown(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(msg) => write!(f, "数据库错误: {}", msg),
            AppError::Io(err) => write!(f, "IO错误: {}", err),
            AppError::Sqlite(err) => write!(f, "SQLite错误: {}", err),
            AppError::Serialization(msg) => write!(f, "序列化错误: {}", msg),
            AppError::CommandExecution(msg) => write!(f, "命令执行错误: {}", msg),
            AppError::Config(msg) => write!(f, "配置错误: {}", msg),
            AppError::System(msg) => write!(f, "系统错误: {}", msg),
            AppError::Unknown(msg) => write!(f, "未知错误: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err)
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::Sqlite(err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Serialization(err.to_string())
    }
}

/// Result类型别名
#[allow(dead_code)]
pub type AppResult<T> = Result<T, AppError>;

/// 将String错误转换为AppError
impl From<String> for AppError {
    fn from(msg: String) -> Self {
        AppError::Unknown(msg)
    }
}

/// 将&str错误转换为AppError
impl From<&str> for AppError {
    fn from(msg: &str) -> Self {
        AppError::Unknown(msg.to_string())
    }
}

