import styled from "styled-components";
import SecondaryNavBar from "../components/SecondaryNavBar";
import TechLogos from "../components/TechLogos";

// ==================== 样式组件 ====================

const AboutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  padding: 24px;
  padding-top: 73px; /* 49px 导航栏高度 + 24px 内容间距 */
  overflow-y: auto;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1890ff;
  text-align: center;

  @media (prefers-color-scheme: dark) {
    color: #4096ff;
  }
`;

const Version = styled.p`
  font-size: 14px;
  color: #999;
  margin: 0 0 32px 0;
  text-align: center;

  @media (prefers-color-scheme: dark) {
    color: #888;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  text-align: center;

  @media (prefers-color-scheme: dark) {
    color: #ddd;
  }
`;

const Description = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0 0 8px 0;

  @media (prefers-color-scheme: dark) {
    color: #aaa;
  }
`;

const InfoItem = styled.div`
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #333;
  min-width: 80px;

  @media (prefers-color-scheme: dark) {
    color: #ddd;
  }
`;

const InfoValue = styled.span`
  color: #666;

  @media (prefers-color-scheme: dark) {
    color: #aaa;
  }
`;

// ==================== 主组件 ====================

function About() {
  return (
    <AboutContainer>
      <SecondaryNavBar />
      <ContentWrapper>
        <Title>Sigil</Title>
        <Version>版本 0.1.0</Version>

        <Section>
          <SectionTitle>关于本程序</SectionTitle>
          <Description>
            Sigil 是一个基于 Tauri
            构建的现代化桌面应用程序，旨在简化命令行工具的管理和执行过程。
          </Description>
        </Section>

        <Section>
          <SectionTitle>技术栈</SectionTitle>
          <TechLogos />
        </Section>

        <Section>
          <SectionTitle>项目信息</SectionTitle>
          <InfoItem>
            <InfoLabel>项目名称:</InfoLabel>
            <InfoValue>Sigil</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>版本:</InfoLabel>
            <InfoValue>0.1.0</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>许可证:</InfoLabel>
            <InfoValue>MIT</InfoValue>
          </InfoItem>
        </Section>
      </ContentWrapper>
    </AboutContainer>
  );
}

export default About;
