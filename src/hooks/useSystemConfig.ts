import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import { listen } from "@tauri-apps/api/event";
import { configApi } from "../api/database";
import { CONFIG_KEYS } from "../types/config";
import { Language } from "../types/config";
import { DEFAULT_LANGUAGE } from "../constants/config";
import { ErrorHandler } from "../utils/errorHandler";
import { Logger } from "../utils/logger";

/**
 * 系统配置Hook
 */
export function useSystemConfig() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE as Language);
  const [autoStart, setAutoStart] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  /**
   * 加载配置
   */
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      Logger.debug("Loading system configs");

      // 加载语言配置
      const languageValue = await configApi.get(CONFIG_KEYS.LANGUAGE);
      if (languageValue && (languageValue === "zh-CN" || languageValue === "en-US")) {
        setLanguage(languageValue);
        i18n.changeLanguage(languageValue);
      }

      // 加载开机自启动配置
      const autoStartValue = await configApi.get(CONFIG_KEYS.AUTO_START);
      setAutoStart(autoStartValue === "true");

      Logger.info("System configs loaded", { language: languageValue, autoStart: autoStartValue });
    } catch (err) {
      ErrorHandler.handleSilent(err);
      Logger.error("Failed to load system configs", err);
    } finally {
      setLoading(false);
    }
  }, [i18n]);

  /**
   * 设置语言
   */
  const setLanguageConfig = useCallback(async (lang: Language): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Setting language", { lang });
      await i18n.changeLanguage(lang);
      await configApi.set(CONFIG_KEYS.LANGUAGE, lang);
      setLanguage(lang);
      const tNew = i18n.getFixedT(lang);
      message.success(tNew("pages.systemConfig.languageSaved"));
      Logger.info("Language set successfully", { lang });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "保存语言设置失败");
      Logger.error("Failed to set language", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [i18n]);

  /**
   * 设置开机自启动
   */
  const setAutoStartConfig = useCallback(async (enabled: boolean): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Setting autostart", { enabled });
      setAutoStart(enabled);
      await configApi.set(CONFIG_KEYS.AUTO_START, String(enabled));
      message.success(enabled ? "开机自启动已启用" : "开机自启动已禁用");
      Logger.info("Autostart set successfully", { enabled });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, enabled ? "启用开机自启动失败" : "禁用开机自启动失败");
      Logger.error("Failed to set autostart", err);
      setAutoStart(!enabled); // 回滚状态
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 监听语言变化事件
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen<string>("language-changed", (event) => {
        const newLanguage = event.payload;
        if (newLanguage === "zh-CN" || newLanguage === "en-US") {
          setLanguage(newLanguage);
          i18n.changeLanguage(newLanguage);
          Logger.debug("Language changed via event", { newLanguage });
        }
      });
    };

    setupListener();
    loadConfigs();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [i18n, loadConfigs]);

  return {
    language,
    autoStart,
    loading,
    loadConfigs,
    setLanguage: setLanguageConfig,
    setAutoStart: setAutoStartConfig,
  };
}

