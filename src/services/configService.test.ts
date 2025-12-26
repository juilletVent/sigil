import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigService } from "./configService";
import { configApi } from "../api/database";
import { CONFIG_KEYS } from "../types/config";
import { AppError } from "../utils/errorHandler";
import { ERROR_CODES } from "../constants/errors";

// Mock API
vi.mock("../api/database", () => ({
  configApi: {
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(),
  },
}));

// Mock Logger
vi.mock("../utils/logger", () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConfig", () => {
    it("应该获取配置值", async () => {
      vi.mocked(configApi.get).mockResolvedValue("test-value");

      const result = await ConfigService.getConfig("test-key");

      expect(result).toBe("test-value");
      expect(configApi.get).toHaveBeenCalledWith("test-key");
    });

    it("应该在失败时抛出AppError", async () => {
      const error = new Error("数据库错误");
      vi.mocked(configApi.get).mockRejectedValue(error);

      await expect(ConfigService.getConfig("test-key")).rejects.toThrow(AppError);
    });
  });

  describe("setConfig", () => {
    it("应该设置配置值", async () => {
      vi.mocked(configApi.set).mockResolvedValue(undefined);

      await ConfigService.setConfig("test-key", "test-value");

      expect(configApi.set).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("应该在失败时抛出AppError", async () => {
      const error = new Error("数据库错误");
      vi.mocked(configApi.set).mockRejectedValue(error);

      await expect(ConfigService.setConfig("test-key", "test-value")).rejects.toThrow(AppError);
    });
  });

  describe("getAllConfigs", () => {
    it("应该获取所有配置", async () => {
      const mockConfigs = {
        key1: "value1",
        key2: "value2",
      };

      vi.mocked(configApi.getAll).mockResolvedValue(mockConfigs);

      const result = await ConfigService.getAllConfigs();

      expect(result).toEqual(mockConfigs);
      expect(configApi.getAll).toHaveBeenCalled();
    });

    it("应该在失败时抛出AppError", async () => {
      const error = new Error("数据库错误");
      vi.mocked(configApi.getAll).mockRejectedValue(error);

      await expect(ConfigService.getAllConfigs()).rejects.toThrow(AppError);
    });
  });

  describe("getLanguage", () => {
    it("应该获取语言配置", async () => {
      vi.mocked(configApi.get).mockResolvedValue("zh-CN");

      const result = await ConfigService.getLanguage();

      expect(result).toBe("zh-CN");
    });

    it("应该在配置不存在时返回默认语言", async () => {
      vi.mocked(configApi.get).mockResolvedValue(null);

      const result = await ConfigService.getLanguage();

      expect(result).toBe("zh-CN");
    });

    it("应该在配置无效时返回默认语言", async () => {
      vi.mocked(configApi.get).mockResolvedValue("invalid");

      const result = await ConfigService.getLanguage();

      expect(result).toBe("zh-CN");
    });
  });

  describe("setLanguage", () => {
    it("应该设置语言配置", async () => {
      vi.mocked(configApi.set).mockResolvedValue(undefined);

      await ConfigService.setLanguage("en-US");

      expect(configApi.set).toHaveBeenCalledWith(CONFIG_KEYS.LANGUAGE, "en-US");
    });
  });

  describe("getAutoStart", () => {
    it("应该获取开机自启动配置", async () => {
      vi.mocked(configApi.get).mockResolvedValue("true");

      const result = await ConfigService.getAutoStart();

      expect(result).toBe(true);
    });

    it("应该在配置为false时返回false", async () => {
      vi.mocked(configApi.get).mockResolvedValue("false");

      const result = await ConfigService.getAutoStart();

      expect(result).toBe(false);
    });

    it("应该在配置不存在时返回false", async () => {
      vi.mocked(configApi.get).mockResolvedValue(null);

      const result = await ConfigService.getAutoStart();

      expect(result).toBe(false);
    });
  });

  describe("setAutoStart", () => {
    it("应该设置开机自启动配置", async () => {
      vi.mocked(configApi.set).mockResolvedValue(undefined);

      await ConfigService.setAutoStart(true);

      expect(configApi.set).toHaveBeenCalledWith(CONFIG_KEYS.AUTO_START, "true");
    });
  });
});

