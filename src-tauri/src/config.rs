// ==================== 配置管理 ====================

use crate::constants;
use crate::db::Database;
use crate::error::{AppError, AppResult};

/// 配置管理器
#[allow(dead_code)]
pub struct ConfigManager;

#[allow(dead_code)]
impl ConfigManager {
    /// 获取配置值
    pub fn get(database: &Database, key: &str) -> AppResult<Option<String>> {
        database
            .get_config(key)
            .map_err(|e| AppError::Config(format!("获取配置失败: {}", e)))
    }

    /// 设置配置值
    pub fn set(database: &Database, key: &str, value: &str) -> AppResult<()> {
        database
            .set_config(key, value)
            .map_err(|e| AppError::Config(format!("设置配置失败: {}", e)))
    }

    /// 获取语言配置
    pub fn get_language(database: &Database) -> String {
        Self::get(database, constants::config_keys::LANGUAGE)
            .ok()
            .flatten()
            .unwrap_or_else(|| constants::DEFAULT_LANGUAGE.to_string())
    }

    /// 设置语言配置
    pub fn set_language(database: &Database, language: &str) -> AppResult<()> {
        Self::set(database, constants::config_keys::LANGUAGE, language)
    }

    /// 获取开机自启动配置
    pub fn get_autostart(database: &Database) -> bool {
        Self::get(database, constants::config_keys::AUTO_START)
            .ok()
            .flatten()
            .map(|v| v == "true")
            .unwrap_or(false)
    }

    /// 设置开机自启动配置
    pub fn set_autostart(database: &Database, enabled: bool) -> AppResult<()> {
        Self::set(
            database,
            constants::config_keys::AUTO_START,
            if enabled { "true" } else { "false" },
        )
    }
}

/// 环境配置
#[allow(dead_code)]
pub struct EnvConfig;

#[allow(dead_code)]
impl EnvConfig {
    /// 获取环境变量
    pub fn get(key: &str) -> Option<String> {
        std::env::var(key).ok()
    }

    /// 获取环境变量或默认值
    pub fn get_or_default(key: &str, default: &str) -> String {
        std::env::var(key).unwrap_or_else(|_| default.to_string())
    }

    /// 是否为调试模式
    pub fn is_debug() -> bool {
        Self::get_or_default("RUST_LOG", "info") == "debug"
    }

    /// 是否为发布模式
    pub fn is_release() -> bool {
        cfg!(not(debug_assertions))
    }
}
