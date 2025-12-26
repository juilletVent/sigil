// ==================== 国际化翻译模块 ====================

/// 支持的语言
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Language {
    ZhCN,
    EnUS,
}

impl Language {
    /// 从字符串转换为 Language
    pub fn from_str(s: &str) -> Self {
        match s {
            "en-US" => Language::EnUS,
            _ => Language::ZhCN, // 默认为中文
        }
    }
}

/// 翻译结构体
pub struct Translations;

impl Translations {
    /// 获取托盘菜单项文本
    pub fn tray_show(lang: Language) -> &'static str {
        match lang {
            Language::ZhCN => "显示/隐藏",
            Language::EnUS => "Show/Hide",
        }
    }

    /// 获取托盘菜单项文本
    pub fn tray_quit(lang: Language) -> &'static str {
        match lang {
            Language::ZhCN => "退出",
            Language::EnUS => "Quit",
        }
    }

    /// 获取日志窗口标题
    pub fn log_window_title(lang: Language, command_name: &str) -> String {
        match lang {
            Language::ZhCN => format!("命令日志 - {}", command_name),
            Language::EnUS => format!("Command Log - {}", command_name),
        }
    }

    /// 获取错误消息
    pub fn error_get_main_window(lang: Language) -> String {
        match lang {
            Language::ZhCN => "无法获取主窗口".to_string(),
            Language::EnUS => "Failed to get main window".to_string(),
        }
    }

    pub fn error_create_menu_item(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("创建菜单项失败: {}", e),
            Language::EnUS => format!("Failed to create menu item: {}", e),
        }
    }

    pub fn error_create_menu(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("创建菜单失败: {}", e),
            Language::EnUS => format!("Failed to create menu: {}", e),
        }
    }

    pub fn error_load_icon(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("加载图标失败: {}", e),
            Language::EnUS => format!("Failed to load icon: {}", e),
        }
    }

    pub fn error_build_tray(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("构建托盘失败: {}", e),
            Language::EnUS => format!("Failed to build tray: {}", e),
        }
    }

    pub fn error_show_window(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("显示窗口失败: {}", e),
            Language::EnUS => format!("Failed to show window: {}", e),
        }
    }

    pub fn error_focus_window(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("聚焦窗口失败: {}", e),
            Language::EnUS => format!("Failed to focus window: {}", e),
        }
    }

    pub fn error_create_window(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("创建窗口失败: {}", e),
            Language::EnUS => format!("Failed to create window: {}", e),
        }
    }

    /// 开机自启动相关消息
    #[allow(dead_code)]
    pub fn autostart_enabled(lang: Language) -> String {
        match lang {
            Language::ZhCN => "开机自启动已启用".to_string(),
            Language::EnUS => "Autostart enabled".to_string(),
        }
    }

    #[allow(dead_code)]
    pub fn autostart_disabled(lang: Language) -> String {
        match lang {
            Language::ZhCN => "开机自启动已禁用".to_string(),
            Language::EnUS => "Autostart disabled".to_string(),
        }
    }

    pub fn autostart_enable_failed(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("启用开机自启动失败: {}", e),
            Language::EnUS => format!("Failed to enable autostart: {}", e),
        }
    }

    pub fn autostart_disable_failed(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("禁用开机自启动失败: {}", e),
            Language::EnUS => format!("Failed to disable autostart: {}", e),
        }
    }

    pub fn autostart_get_path_failed(lang: Language, e: &str) -> String {
        match lang {
            Language::ZhCN => format!("获取应用路径失败: {}", e),
            Language::EnUS => format!("Failed to get application path: {}", e),
        }
    }
}

/// 从数据库获取语言设置
pub fn get_language_from_db(database: &crate::db::Database) -> Language {
    match database.get_config("language") {
        Ok(Some(lang)) => Language::from_str(&lang),
        _ => Language::ZhCN, // 默认中文
    }
}

