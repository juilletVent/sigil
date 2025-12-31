/**
 * 环境配置工具
 */

/**
 * 获取环境变量
 */
export function getEnv(key: string, defaultValue?: string): string {
  if (import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`环境变量 ${key} 未设置`);
}

/**
 * 是否为开发环境
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}

/**
 * 是否为生产环境
 */
export function isProd(): boolean {
  return import.meta.env.PROD;
}

/**
 * 应用配置
 */
export const AppConfig = {
  /** 应用名称 */
  APP_NAME: import.meta.env.VITE_APP_NAME || "sigil",
  /** 应用版本 */
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "0.1.1",
  /** API超时时间（毫秒） */
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  /** 是否启用调试模式 */
  DEBUG: import.meta.env.VITE_DEBUG === "true" || isDev(),
} as const;

