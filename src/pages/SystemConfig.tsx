import { useState, useEffect } from "react";
import { Checkbox, Radio, message } from "antd";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import SecondaryNavBar from "../components/SecondaryNavBar";
import { configApi, CONFIG_KEYS } from "../api/database";

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
      setAutoStart(autoStartValue === "true");

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
      setAutoStart(checked);
      await configApi.set(CONFIG_KEYS.AUTO_START, String(checked));
      // TODO: 后续可以对接 Tauri API 来实现真正的开机自启动功能
    } catch (error) {
      console.error("Failed to save auto-start setting:", error);
      message.error(t("pages.systemConfig.saveSettingsFailed"));
      // 回滚状态
      setAutoStart(!checked);
    }
  };

  // 处理语言切换
  const handleLanguageChange = async (language: string) => {
    try {
      i18n.changeLanguage(language);
      await configApi.set(CONFIG_KEYS.LANGUAGE, language);
      message.success(t("pages.systemConfig.languageSaved"));
    } catch (error) {
      console.error("Failed to save language setting:", error);
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
