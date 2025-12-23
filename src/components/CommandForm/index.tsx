import { Form, Input, Checkbox, Button, Tooltip } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { FormContainer, ButtonGroup } from "./styles";

export interface CommandFormValues {
  name: string;
  command: string;
  sudo?: boolean;
  workingDirectory?: string;
  url?: string;
  notificationWhenFinished?: boolean;
}

interface CommandFormProps {
  initialValues?: Partial<CommandFormValues>;
  onSubmit: (values: CommandFormValues) => void;
  onCancel: () => void;
}

function CommandForm({ initialValues, onSubmit, onCancel }: CommandFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleFinish = (values: CommandFormValues) => {
    onSubmit(values);
  };

  return (
    <FormContainer>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
      >
        <Form.Item
          label={t("components.commandForm.name")}
          name="name"
          rules={[{ required: true, message: t("components.commandForm.nameRequired") }]}
        >
          <Input placeholder={t("components.commandForm.namePlaceholder")} />
        </Form.Item>

        <Form.Item
          label={
            <span>
              {t("components.commandForm.command")} &nbsp;
              <Tooltip title={t("components.commandForm.commandTooltip")}>
                <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            </span>
          }
          name="command"
          rules={[{ required: true, message: t("components.commandForm.commandRequired") }]}
        >
          <Input placeholder={t("components.commandForm.commandPlaceholder")} />
        </Form.Item>

        <Form.Item name="sudo" valuePropName="checked">
          <Checkbox>
            {t("components.commandForm.sudo")} &nbsp;
            <Tooltip title={t("components.commandForm.sudoTooltip")}>
              <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        <Form.Item
          label={
            <span>
              {t("components.commandForm.workingDirectory")} &nbsp;
              <Tooltip title={t("components.commandForm.workingDirectoryTooltip")}>
                <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            </span>
          }
          name="workingDirectory"
        >
          <Input placeholder={t("components.commandForm.workingDirectoryPlaceholder")} />
        </Form.Item>

        <Form.Item
          label={
            <span>
              {t("components.commandForm.url")} &nbsp;
              <Tooltip title={t("components.commandForm.urlTooltip")}>
                <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            </span>
          }
          name="url"
        >
          <Input placeholder={t("components.commandForm.urlPlaceholder")} />
        </Form.Item>

        <Form.Item name="notificationWhenFinished" valuePropName="checked">
          <Checkbox>
            {t("components.commandForm.notificationWhenFinished")} &nbsp;
            <Tooltip title={t("components.commandForm.notificationWhenFinishedTooltip")}>
              <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        <ButtonGroup>
          <Button type="primary" htmlType="submit">
            <CheckOutlined />
            {t("common.confirm")}
          </Button>
          <Button onClick={onCancel}>
            <CloseOutlined />
            {t("common.cancel")}
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
}

export default CommandForm;
