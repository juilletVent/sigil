/**
 * 系统配置键常量
 */
export const CONFIG_KEYS = {
  AUTO_START: "auto_start",
  LANGUAGE: "language",
} as const;

/**
 * 配置键类型
 */
export type ConfigKey = typeof CONFIG_KEYS[keyof typeof CONFIG_KEYS];

/**
 * 支持的语言
 */
export type Language = "zh-CN" | "en-US";

