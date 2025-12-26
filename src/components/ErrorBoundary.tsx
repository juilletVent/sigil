import { Component, ErrorInfo, ReactNode } from "react";
import styled from "styled-components";
import { AppRoutes } from "../constants/routes";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// ==================== 样式组件 ====================

const ErrorContainer = styled.div`
  padding: 50px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
    color: #ddd;
  }
`;

const ErrorCard = styled.div`
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (prefers-color-scheme: dark) {
    background-color: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  line-height: 1;
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #ff4d4f;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.5;

  @media (prefers-color-scheme: dark) {
    color: #aaa;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const PrimaryButton = styled.button`
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background-color: #1890ff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #40a9ff;
  }

  &:active {
    background-color: #096dd9;
  }
`;

const SecondaryButton = styled.button`
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #e6e6e6;
  }

  &:active {
    background-color: #d9d9d9;
  }

  @media (prefers-color-scheme: dark) {
    color: #ddd;
    background-color: #3a3a3a;
    border-color: #555;

    &:hover {
      background-color: #4a4a4a;
    }

    &:active {
      background-color: #2a2a2a;
    }
  }
`;

// ==================== 主组件 ====================

/**
 * 错误边界组件
 * 捕获子组件树中的JavaScript错误，记录这些错误，并显示降级UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // 错误已通过 ErrorBoundary 处理，这里可以记录到日志系统
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * 错误降级UI组件
 * 使用 styled-components 组织样式
 */
function ErrorFallback({ error }: { error?: Error }) {
  const handleGoHome = () => {
    // 使用 window.location 跳转到首页，不依赖 Router 上下文
    window.location.hash = AppRoutes.HOME;
    window.location.reload();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <ErrorContainer>
      <ErrorCard>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>应用出现错误</ErrorTitle>
        <ErrorMessage>
          {error?.message || "发生了未知错误，请刷新页面重试"}
        </ErrorMessage>
        <ButtonGroup>
          <PrimaryButton onClick={handleGoHome}>
            返回首页
          </PrimaryButton>
          <SecondaryButton onClick={handleReload}>
            刷新页面
          </SecondaryButton>
        </ButtonGroup>
      </ErrorCard>
    </ErrorContainer>
  );
}

export default ErrorBoundary;

