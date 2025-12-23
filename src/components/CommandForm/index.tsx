import { Form, Input, Checkbox, Button, Tooltip } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
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
          label="名称"
          name="name"
          rules={[{ required: true, message: "请输入命令名称" }]}
        >
          <Input placeholder="输入命令名称" />
        </Form.Item>

        <Form.Item
          label={
            <span>
              命令 &nbsp;
              <Tooltip title="要执行的命令">
                <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            </span>
          }
          name="command"
          rules={[{ required: true, message: "请输入命令" }]}
        >
          <Input placeholder="输入要执行的命令" />
        </Form.Item>

        <Form.Item name="sudo" valuePropName="checked">
          <Checkbox>
            Sudo &nbsp;
            <Tooltip title="以管理员权限运行">
              <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        <Form.Item
          label={
            <span>
              工作目录 &nbsp;
              <Tooltip title="命令执行的工作目录">
                <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            </span>
          }
          name="workingDirectory"
        >
          <Input placeholder="选择工作目录" />
        </Form.Item>

        <Form.Item
          label={
            <span>
              关联地址 &nbsp;
              <Tooltip title="相关的URL地址，可以快速打开">
                <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
            </span>
          }
          name="url"
        >
          <Input placeholder="输入URL" />
        </Form.Item>

        <Form.Item name="notificationWhenFinished" valuePropName="checked">
          <Checkbox>
            执行完成通知 &nbsp;
            <Tooltip title="命令执行完成后发送通知">
              <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        <ButtonGroup>
          <Button type="primary" htmlType="submit">
            <CheckOutlined />
            确定
          </Button>
          <Button onClick={onCancel}>
            <CloseOutlined />
            取消
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
}

export default CommandForm;
