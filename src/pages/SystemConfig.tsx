import { useState } from "react";
import { Checkbox } from "antd";
import styled from "styled-components";
import SecondaryNavBar from "../components/SecondaryNavBar";

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

// ==================== 主组件 ====================

function SystemConfig() {
  // 从 localStorage 读取初始值
  const [autoStart, setAutoStart] = useState<boolean>(() => {
    const saved = localStorage.getItem("autoStart");
    return saved === "true";
  });

  // 处理开机自启动变化
  const handleAutoStartChange = (checked: boolean) => {
    setAutoStart(checked);
    localStorage.setItem("autoStart", String(checked));
    console.log("开机自启动设置已更新:", checked);
    // TODO: 后续可以对接 Tauri API 来实现真正的开机自启动功能
  };

  return (
    <PageContainer>
      <SecondaryNavBar />
      <ContentWrapper>
        <PageTitle>系统设置</PageTitle>
        <SettingsContent>
          <SettingItem>
            <Checkbox
              checked={autoStart}
              onChange={(e) => handleAutoStartChange(e.target.checked)}
            >
              开机自启动
            </Checkbox>
          </SettingItem>
        </SettingsContent>
      </ContentWrapper>
    </PageContainer>
  );
}

export default SystemConfig;
