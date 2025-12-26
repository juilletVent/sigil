import { message } from "antd";
import { ERROR_CODES, type ErrorCode } from "../constants/errors";

// 重新导出ERROR_CODES以便在其他地方使用
export { ERROR_CODES };

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * 错误处理工具
 */
export class ErrorHandler {
  /**
   * 处理错误并显示用户友好的消息
   */
  static handle(error: unknown, customMessage?: string): void {
    let errorMessage: string;

    // 如果提供了自定义消息，优先使用自定义消息
    if (customMessage) {
      errorMessage = customMessage;
    } else if (error instanceof AppError) {
      errorMessage = this.getErrorMessage(error.code) || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = "操作失败";
    }

    console.error("Error:", error);
    message.error(errorMessage);
  }

  /**
   * 根据错误码获取错误消息
   */
  private static getErrorMessage(code: ErrorCode): string {
    const errorMessages: Record<ErrorCode, string> = {
      [ERROR_CODES.UNKNOWN_ERROR]: "发生未知错误",
      [ERROR_CODES.NETWORK_ERROR]: "网络连接失败",
      [ERROR_CODES.TIMEOUT_ERROR]: "操作超时",
      [ERROR_CODES.COMMAND_NOT_FOUND]: "命令不存在",
      [ERROR_CODES.COMMAND_ALREADY_RUNNING]: "命令正在运行中",
      [ERROR_CODES.COMMAND_EXECUTION_FAILED]: "命令执行失败",
      [ERROR_CODES.COMMAND_VALIDATION_FAILED]: "命令验证失败",
      [ERROR_CODES.DATABASE_CONNECTION_FAILED]: "数据库连接失败",
      [ERROR_CODES.DATABASE_QUERY_FAILED]: "数据库查询失败",
      [ERROR_CODES.DATABASE_WRITE_FAILED]: "数据库写入失败",
      [ERROR_CODES.CONFIG_LOAD_FAILED]: "配置加载失败",
      [ERROR_CODES.CONFIG_SAVE_FAILED]: "配置保存失败",
      [ERROR_CODES.FILE_READ_FAILED]: "文件读取失败",
      [ERROR_CODES.FILE_WRITE_FAILED]: "文件写入失败",
      [ERROR_CODES.FILE_NOT_FOUND]: "文件不存在",
      [ERROR_CODES.AUTOSTART_ENABLE_FAILED]: "启用开机自启动失败",
      [ERROR_CODES.AUTOSTART_DISABLE_FAILED]: "禁用开机自启动失败",
    };

    return errorMessages[code] || "发生未知错误";
  }

  /**
   * 静默处理错误（不显示消息）
   */
  static handleSilent(error: unknown): void {
    console.error("Silent error:", error);
  }
}

