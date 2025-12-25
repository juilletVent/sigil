import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { message, Spin } from "antd";
import SecondaryNavBar from "../components/SecondaryNavBar";
import CommandForm, { CommandFormValues } from "../components/CommandForm";
import { AppRoutes } from "../constants/routes";
import { commandApi } from "../api/database";

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

  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<CommandFormValues>>();

  // 判断是新增还是编辑模式
  const isEditMode = !!commandId;
  const pageTitle = isEditMode ? t("pages.configEdit.titleEdit") : t("pages.configEdit.titleAdd");

  // 加载命令数据（编辑模式）
  useEffect(() => {
    if (isEditMode && commandId) {
      loadCommandData(parseInt(commandId));
    }
  }, [isEditMode, commandId]);

  const loadCommandData = async (id: number) => {
    try {
      setLoading(true);
      const command = await commandApi.getById(id);
      setInitialValues({
        name: command.name,
        command: command.command,
        sudo: command.sudo,
        workingDirectory: command.working_directory || "",
        url: command.url || "",
        notificationWhenFinished: command.notification_when_finished,
      });
    } catch (error) {
      console.error("加载命令数据失败:", error);
      message.error("加载命令数据失败");
      navigate(AppRoutes.HOME);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: CommandFormValues) => {
    try {
      if (isEditMode && commandId) {
        // 更新命令
        await commandApi.update(parseInt(commandId), {
          name: values.name,
          command: values.command,
          sudo: values.sudo,
          working_directory: values.workingDirectory ?? undefined,
          url: values.url ?? undefined,
          notification_when_finished: values.notificationWhenFinished,
        });
        message.success(t("common.updateSuccess") || "更新成功");
      } else {
        // 创建命令
        await commandApi.create({
          name: values.name,
          command: values.command,
          sudo: values.sudo || false,
          working_directory: values.workingDirectory ?? undefined,
          url: values.url ?? undefined,
          notification_when_finished: values.notificationWhenFinished || false,
        });
        message.success(t("common.createSuccess") || "创建成功");
      }
      navigate(AppRoutes.HOME);
    } catch (error) {
      console.error("保存命令失败:", error);
      message.error(t("common.saveFailed") || "保存失败");
    }
  };

  const handleCancel = () => {
    navigate(AppRoutes.HOME);
  };

  return (
    <PageContainer>
      <SecondaryNavBar />
      <ContentWrapper>
        <PageTitle>{pageTitle}</PageTitle>
        {loading ? (
          <Spin size="large" />
        ) : (
          <CommandForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </ContentWrapper>
    </PageContainer>
  );
}

export default ConfigEdit;
