import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, ErrorHandler } from "./errorHandler";
import { ERROR_CODES } from "../constants/errors";
import { message } from "antd";

// Mock antd message
vi.mock("antd", () => ({
  message: {
    error: vi.fn(),
  },
}));

describe("ErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AppError", () => {
    it("应该创建AppError实例", () => {
      const error = new AppError(ERROR_CODES.UNKNOWN_ERROR, "测试错误");
      expect(error.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(error.message).toBe("测试错误");
    });

    it("应该包含原始错误", () => {
      const originalError = new Error("原始错误");
      const error = new AppError(ERROR_CODES.UNKNOWN_ERROR, "测试错误", originalError);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe("ErrorHandler.handle", () => {
    it("应该处理AppError", () => {
      const error = new AppError(ERROR_CODES.COMMAND_NOT_FOUND, "命令不存在");
      ErrorHandler.handle(error);
      expect(message.error).toHaveBeenCalledWith("命令不存在");
    });

    it("应该处理普通Error", () => {
      const error = new Error("普通错误");
      ErrorHandler.handle(error);
      expect(message.error).toHaveBeenCalledWith("普通错误");
    });

    it("应该处理字符串错误", () => {
      ErrorHandler.handle("字符串错误");
      expect(message.error).toHaveBeenCalledWith("字符串错误");
    });

    it("应该使用自定义消息", () => {
      const error = new Error("原始错误");
      ErrorHandler.handle(error, "自定义错误消息");
      expect(message.error).toHaveBeenCalledWith("自定义错误消息");
    });
  });

  describe("ErrorHandler.handleSilent", () => {
    it("应该静默处理错误", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      ErrorHandler.handleSilent(new Error("测试错误"));
      expect(consoleSpy).toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

