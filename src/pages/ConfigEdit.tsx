import { useNavigate, useSearchParams } from "react-router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import SecondaryNavBar from "../components/SecondaryNavBar";
import CommandForm, { CommandFormValues } from "../components/CommandForm";
import { AppRoutes } from "../constants/routes";

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

// ==================== 主组件 ====================

function ConfigEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const commandId = searchParams.get("id");

  // 判断是新增还是编辑模式
  const isEditMode = !!commandId;
  const pageTitle = isEditMode ? t("pages.configEdit.titleEdit") : t("pages.configEdit.titleAdd");

  // 如果是编辑模式，这里应该根据id获取命令数据
  // 暂时使用模拟数据
  const initialValues = isEditMode
    ? {
        name: "示例命令",
        command: "npm run dev",
        sudo: false,
        workingDirectory: "",
        url: "",
        notificationWhenFinished: false,
      }
    : undefined;

  const handleSubmit = (values: CommandFormValues) => {
    console.log("表单提交:", values);
    console.log("模式:", isEditMode ? "编辑" : "新增");
    if (isEditMode) {
      console.log("命令ID:", commandId);
    }
    // TODO: 实现实际的数据保存逻辑
    // 暂时提交后返回首页
    navigate(AppRoutes.HOME);
  };

  const handleCancel = () => {
    navigate(AppRoutes.HOME);
  };

  return (
    <PageContainer>
      <SecondaryNavBar />
      <ContentWrapper>
        <PageTitle>{pageTitle}</PageTitle>
        <CommandForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </ContentWrapper>
    </PageContainer>
  );
}

export default ConfigEdit;
