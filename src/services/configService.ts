import { configApi } from "../api/database";
import { CONFIG_KEYS } from "../types/config";
import { Language } from "../types/config";
import { Logger } from "../utils/logger";
import { AppError } from "../utils/errorHandler";
import { ERROR_CODES } from "../constants/errors";

/**
 * 配置服务类
 * 封装配置相关的业务逻辑
 */
export class ConfigService {
  /**
   * 获取配置值
   */
  static async getConfig(key: string): Promise<string | null> {
    try {
      Logger.debug("Getting config", { key });
      const value = await configApi.get(key);
      return value;
    } catch (error) {
      Logger.error("Failed to get config", error);
      throw new AppError(ERROR_CODES.CONFIG_LOAD_FAILED, "获取配置失败", error);
    }
  }

  /**
   * 设置配置值
   */
  static async setConfig(key: string, value: string): Promise<void> {
    try {
      Logger.debug("Setting config", { key, value });
      await configApi.set(key, value);
      Logger.info("Config set", { key });
    } catch (error) {
      Logger.error("Failed to set config", error);
      throw new AppError(ERROR_CODES.CONFIG_SAVE_FAILED, "保存配置失败", error);
    }
  }

  /**
   * 获取所有配置
   */
  static async getAllConfigs(): Promise<Record<string, string>> {
    try {
      Logger.debug("Getting all configs");
      const configs = await configApi.getAll();
      return configs;
    } catch (error) {
      Logger.error("Failed to get all configs", error);
      throw new AppError(ERROR_CODES.CONFIG_LOAD_FAILED, "获取配置失败", error);
    }
  }

  /**
   * 获取语言配置
   */
  static async getLanguage(): Promise<Language> {
    try {
      const value = await this.getConfig(CONFIG_KEYS.LANGUAGE);
      if (value === "zh-CN" || value === "en-US") {
        return value;
      }
      return "zh-CN"; // 默认语言
    } catch (error) {
      Logger.error("Failed to get language", error);
      return "zh-CN"; // 默认语言
    }
  }

  /**
   * 设置语言配置
   */
  static async setLanguage(language: Language): Promise<void> {
    await this.setConfig(CONFIG_KEYS.LANGUAGE, language);
  }

  /**
   * 获取开机自启动配置
   */
  static async getAutoStart(): Promise<boolean> {
    try {
      const value = await this.getConfig(CONFIG_KEYS.AUTO_START);
      return value === "true";
    } catch (error) {
      Logger.error("Failed to get autostart", error);
      return false;
    }
  }

  /**
   * 设置开机自启动配置
   */
  static async setAutoStart(enabled: boolean): Promise<void> {
    await this.setConfig(CONFIG_KEYS.AUTO_START, String(enabled));
  }
}

