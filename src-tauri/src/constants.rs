// ==================== 常量定义 ====================

/// 应用名称
pub const APP_NAME: &str = "sigil";

/// 数据库文件名
pub const DB_FILE_NAME: &str = "sigil.db";

/// 默认语言
#[allow(dead_code)]
pub const DEFAULT_LANGUAGE: &str = "zh-CN";

/// 配置键
pub mod config_keys {
    /// 开机自启动配置键
    pub const AUTO_START: &str = "auto_start";
    /// 语言配置键
    pub const LANGUAGE: &str = "language";
}

/// 命令执行相关常量
pub mod command {
    /// 日志最大行数
    #[allow(dead_code)]
    pub const MAX_LOG_LINES: usize = 10000;
    /// 状态更新间隔（毫秒）
    #[allow(dead_code)]
    pub const STATUS_UPDATE_INTERVAL_MS: u64 = 1000;
}

/// 系统监控相关常量
pub mod monitor {
    /// 高频监控间隔（毫秒）- CPU和内存
    #[allow(dead_code)]
    pub const HIGH_FREQUENCY_INTERVAL_MS: u64 = 1000;
    /// 低频监控间隔（毫秒）- 磁盘
    #[allow(dead_code)]
    pub const LOW_FREQUENCY_INTERVAL_MS: u64 = 60000;
}

