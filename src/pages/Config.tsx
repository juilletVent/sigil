import styled from "styled-components";
import { Typography, Card, Form, Switch, InputNumber, Button, Space, Divider } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// ==================== 样式组件 ====================

const Container = styled.div`
  padding: 24px;
  padding-bottom: 60px;
  min-height: 100vh;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled(SettingOutlined)`
  font-size: 32px;
  color: #1890ff;
`;

const StyledTitle = styled(Title)`
  margin: 0 !important;
`;

const ConfigCard = styled(Card)`
  max-width: 800px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #262626;

  @media (prefers-color-scheme: dark) {
    color: #e6e6e6;
  }
`;

// ==================== 主组件 ====================

function Config() {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log("配置已保存:", values);
    // TODO: 实现配置保存逻辑
  };

  return (
    <Container>
      <PageHeader>
        <HeaderIcon />
        <StyledTitle level={2}>配置</StyledTitle>
      </PageHeader>

      <ConfigCard>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            autoStart: false,
            updateInterval: 1500,
            enableNotifications: false,
            cpuThreshold: 80,
            memoryThreshold: 80,
          }}
        >
          <SectionTitle>监控设置</SectionTitle>
          <Divider />

          <Form.Item
            label="更新间隔 (毫秒)"
            name="updateInterval"
            help="系统信息刷新的时间间隔"
          >
            <InputNumber min={500} max={10000} step={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="CPU 警告阈值 (%)"
            name="cpuThreshold"
            help="超过此值时高亮显示"
          >
            <InputNumber min={50} max={100} step={5} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="内存警告阈值 (%)"
            name="memoryThreshold"
            help="超过此值时高亮显示"
          >
            <InputNumber min={50} max={100} step={5} style={{ width: "100%" }} />
          </Form.Item>

          <Divider />
          <SectionTitle>应用设置</SectionTitle>
          <Divider />

          <Form.Item
            label="开机自启动"
            name="autoStart"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="启用通知"
            name="enableNotifications"
            valuePropName="checked"
            help="当资源使用超过阈值时显示通知"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存配置
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </ConfigCard>
    </Container>
  );
}

export default Config;

