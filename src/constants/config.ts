/**
 * 应用配置常量
 */

/**
 * 应用名称
 */
export const APP_NAME = "sigil";

/**
 * 应用版本
 */
export const APP_VERSION = "0.1.0";

/**
 * 数据库文件名
 */
export const DB_FILE_NAME = "sigil.db";

/**
 * 默认语言
 */
export const DEFAULT_LANGUAGE = "zh-CN";

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"] as const;

/**
 * 命令执行相关配置
 */
export const COMMAND_CONFIG = {
  /** 日志最大行数 */
  MAX_LOG_LINES: 10000,
  /** 状态更新间隔（毫秒） */
  STATUS_UPDATE_INTERVAL: 1000,
} as const;

