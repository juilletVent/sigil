/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * 日志工具类
 */
export class Logger {
  private static isDevelopment = import.meta.env.DEV;

  /**
   * 调试日志
   */
  static debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 信息日志
   */
  static info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  /**
   * 警告日志
   */
  static warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  /**
   * 错误日志
   */
  static error(message: string, error?: unknown, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, error, ...args);
  }

  /**
   * 记录性能指标
   */
  static performance(label: string, startTime: number): void {
    const duration = performance.now() - startTime;
    this.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);
  }
}

