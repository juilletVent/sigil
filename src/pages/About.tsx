import styled from "styled-components";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  
  return (
    <AboutContainer>
      <SecondaryNavBar />
      <ContentWrapper>
        <Title>{t("pages.about.title")}</Title>
        <Version>{t("pages.about.version")}</Version>

        <Section>
          <SectionTitle>{t("pages.about.aboutProgram")}</SectionTitle>
          <Description>
            {t("pages.about.description")}
          </Description>
        </Section>

        <Section>
          <SectionTitle>{t("pages.about.techStack")}</SectionTitle>
          <TechLogos />
        </Section>

        <Section>
          <SectionTitle>{t("pages.about.projectInfo")}</SectionTitle>
          <InfoItem>
            <InfoLabel>{t("pages.about.projectName")}</InfoLabel>
            <InfoValue>{t("pages.about.projectNameValue")}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>{t("pages.about.projectVersion")}</InfoLabel>
            <InfoValue>{t("pages.about.projectVersionValue")}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>{t("pages.about.license")}</InfoLabel>
            <InfoValue>{t("pages.about.licenseValue")}</InfoValue>
          </InfoItem>
        </Section>
      </ContentWrapper>
    </AboutContainer>
  );
}

export default About;
