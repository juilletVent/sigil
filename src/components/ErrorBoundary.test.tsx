import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HashRouter } from "react-router";
import ErrorBoundary from "./ErrorBoundary";

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// 抛出错误的测试组件
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("测试错误");
  }
  return <div>正常内容</div>;
}

describe("ErrorBoundary", () => {
  it("应该正常渲染子组件", () => {
    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </HashRouter>
    );

    expect(screen.getByText("正常内容")).toBeInTheDocument();
  });

  it("应该捕获错误并显示错误UI", () => {
    // 抑制控制台错误输出
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </HashRouter>
    );

    expect(screen.getByText("应用出现错误")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("应该显示错误消息", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </HashRouter>
    );

    expect(screen.getByText(/测试错误/)).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("应该显示返回首页和刷新页面按钮", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </HashRouter>
    );

    expect(screen.getByText("返回首页")).toBeInTheDocument();
    expect(screen.getByText("刷新页面")).toBeInTheDocument();

    consoleError.mockRestore();
  });
});

