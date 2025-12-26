import { describe, it, expect } from "vitest";
import { validateCommandName, validateCommand, validateUrl, validateWorkingDirectory } from "./validation";

describe("validation", () => {
  describe("validateCommandName", () => {
    it("应该验证空名称", () => {
      const result = validateCommandName("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("命令名称不能为空");
    });

    it("应该验证空白字符", () => {
      const result = validateCommandName("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("命令名称不能为空");
    });

    it("应该验证有效名称", () => {
      const result = validateCommandName("测试命令");
      expect(result.valid).toBe(true);
    });

    it("应该验证名称长度限制", () => {
      const longName = "a".repeat(101);
      const result = validateCommandName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("命令名称不能超过100个字符");
    });
  });

  describe("validateCommand", () => {
    it("应该验证空命令", () => {
      const result = validateCommand("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("命令内容不能为空");
    });

    it("应该验证有效命令", () => {
      const result = validateCommand("echo hello");
      expect(result.valid).toBe(true);
    });

    it("应该验证命令长度限制", () => {
      const longCommand = "a".repeat(10001);
      const result = validateCommand(longCommand);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("命令内容不能超过10000个字符");
    });
  });

  describe("validateUrl", () => {
    it("应该允许空URL", () => {
      const result = validateUrl("");
      expect(result.valid).toBe(true);
    });

    it("应该验证有效URL", () => {
      const result = validateUrl("https://example.com");
      expect(result.valid).toBe(true);
    });

    it("应该拒绝无效URL", () => {
      const result = validateUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("URL格式不正确");
    });
  });

  describe("validateWorkingDirectory", () => {
    it("应该允许空路径", () => {
      const result = validateWorkingDirectory("");
      expect(result.valid).toBe(true);
    });

    it("应该验证有效路径", () => {
      const result = validateWorkingDirectory("/path/to/dir");
      expect(result.valid).toBe(true);
    });

    it("应该验证路径长度限制", () => {
      const longPath = "a".repeat(501);
      const result = validateWorkingDirectory(longPath);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("路径长度不能超过500个字符");
    });
  });
});

