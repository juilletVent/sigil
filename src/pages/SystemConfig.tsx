import { useState, useEffect } from "react";
import { Checkbox, Radio, message } from "antd";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import SecondaryNavBar from "../components/SecondaryNavBar";
import { configApi, autostartApi } from "../api/database";
import { CONFIG_KEYS } from "../types/config";

// ==================== 样式组件 ====================

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px; /* 为固定的顶部导航栏留出空间 */
  padding-bottom: 24px;
`;

const PageTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  margin-block: 20px 10px;
  color: #666;

  @media (prefers-color-scheme: dark) {
    color: #e6e6e6;
  }
`;

const SettingsContent = styled.div`
  width: 100%;
  max-width: 600px;
  padding: 0 24px;
`;

const SettingItem = styled.div`
  padding: 16px 0;
`;

const SettingLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;

  @media (prefers-color-scheme: dark) {
    color: #ddd;
  }
`;

// ==================== 主组件 ====================

function SystemConfig() {
  const { t, i18n } = useTranslation();
  const [autoStart, setAutoStart] = useState<boolean>(false);

  // 加载配置
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      // 加载开机自启动配置
      const autoStartValue = await configApi.get(CONFIG_KEYS.AUTO_START);
      
      // 如果数据库中有配置值，优先使用数据库配置（用户明确设置的值）
      if (autoStartValue !== null) {
        const configEnabled = autoStartValue === "true";
        setAutoStart(configEnabled);
        
        // 同步注册表状态，确保注册表状态与数据库配置一致
        try {
          const actualStatus = await autostartApi.checkStatus();
          if (configEnabled !== actualStatus) {
            // 如果注册表状态与数据库配置不一致，同步注册表状态
            if (configEnabled) {
              await autostartApi.enable();
            } else {
              try {
                await autostartApi.disable();
              } catch (disableError) {
                // 禁用失败时，忽略错误（可能是注册表中不存在该项）
                console.warn("Failed to sync autostart status (ignored):", disableError);
              }
            }
          }
        } catch (error) {
          // 如果检查失败，忽略（不影响UI显示）
          console.warn("Failed to check autostart status for sync (ignored):", error);
        }
      } else {
        // 如果数据库中没有配置值，检查注册表状态作为默认值
        try {
          const actualStatus = await autostartApi.checkStatus();
          setAutoStart(actualStatus);
          // 将注册表状态保存到数据库
          await configApi.set(CONFIG_KEYS.AUTO_START, String(actualStatus));
        } catch (error) {
          // 如果检查失败，默认禁用
          console.error("Failed to check autostart status:", error);
          setAutoStart(false);
          await configApi.set(CONFIG_KEYS.AUTO_START, "false");
        }
      }

      // 加载语言配置
      const languageValue = await configApi.get(CONFIG_KEYS.LANGUAGE);
      if (languageValue) {
        i18n.changeLanguage(languageValue);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      message.error(t("pages.systemConfig.loadConfigFailed"));
    }
  };

  // 处理开机自启动变化
  const handleAutoStartChange = async (checked: boolean) => {
    try {
      // 先更新 UI 状态
      setAutoStart(checked);
      
      // 调用 Tauri 命令设置自启动
      if (checked) {
        // 启用自启动
        await autostartApi.enable();
        // 保存配置到数据库
        await configApi.set(CONFIG_KEYS.AUTO_START, String(checked));
        // 显示成功提示
        message.success(t("pages.systemConfig.autostartEnabled"));
      } else {
        // 禁用自启动 - 如果失败，忽略错误，允许UI更新
        try {
          await autostartApi.disable();
        } catch (disableError) {
          // 禁用失败时，忽略错误（可能是注册表中不存在该项）
          console.warn("Failed to disable autostart (ignored):", disableError);
        }
        // 无论禁用是否成功，都保存配置到数据库
        await configApi.set(CONFIG_KEYS.AUTO_START, String(checked));
        // 显示成功提示
        message.success(t("pages.systemConfig.autostartDisabled"));
      }
    } catch (error) {
      console.error("Failed to save auto-start setting:", error);
      // 只有启用失败时才回滚状态
      if (checked) {
        message.error(t("pages.systemConfig.autostartEnableFailed"));
        // 回滚状态
        setAutoStart(false);
      } else {
        // 禁用失败时不应该到这里（已经在内部处理），但为了安全起见也处理
        message.error(t("pages.systemConfig.autostartDisableFailed"));
        // 不回滚状态，保持禁用状态
      }
    }
  };

  // 处理语言切换
  const handleLanguageChange = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      await configApi.set(CONFIG_KEYS.LANGUAGE, language);
      // 使用 getFixedT 直接指定新语言来获取翻译，确保使用最新语言的文案
      const tNew = i18n.getFixedT(language);
      message.success(tNew("pages.systemConfig.languageSaved"));
    } catch (error) {
      console.error("Failed to save language setting:", error);
      // 失败时使用当前语言显示错误消息
      message.error(t("pages.systemConfig.saveLanguageFailed"));
    }
  };

  return (
    <PageContainer>
      <SecondaryNavBar />
      <ContentWrapper>
        <PageTitle>{t("pages.systemConfig.title")}</PageTitle>
        <SettingsContent>
          <SettingItem>
            <Checkbox
              checked={autoStart}
              onChange={(e) => handleAutoStartChange(e.target.checked)}
            >
              {t("pages.systemConfig.autoStart")}
            </Checkbox>
          </SettingItem>
          
          <SettingItem>
            <SettingLabel>{t("pages.systemConfig.language")}</SettingLabel>
            <Radio.Group 
              value={i18n.language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <Radio value="zh-CN">{t("pages.systemConfig.languageZhCN")}</Radio>
              <Radio value="en-US">{t("pages.systemConfig.languageEnUS")}</Radio>
            </Radio.Group>
          </SettingItem>
        </SettingsContent>
      </ContentWrapper>
    </PageContainer>
  );
}

export default SystemConfig;
