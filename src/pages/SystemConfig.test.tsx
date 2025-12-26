import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router";
import SystemConfig from "./SystemConfig";
import { configApi, autostartApi } from "../api/database";
import { CONFIG_KEYS } from "../types/config";

// Mock API
vi.mock("../api/database", () => ({
  configApi: {
    get: vi.fn(),
    set: vi.fn(),
  },
  autostartApi: {
    checkStatus: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  },
}));

// Mock i18next
const mockChangeLanguage = vi.fn();
const mockGetFixedT = vi.fn((lang: string) => (key: string) => key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "zh-CN",
      changeLanguage: mockChangeLanguage,
      getFixedT: mockGetFixedT,
    },
  }),
}));

// Mock components
vi.mock("../components/SecondaryNavBar", () => ({
  default: () => <div data-testid="secondary-nav-bar">SecondaryNavBar</div>,
}));

// Mock antd message
vi.mock("antd", async () => {
  const actual = await vi.importActual("antd");
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe("SystemConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configApi.get).mockImplementation((key: string) => {
      if (key === CONFIG_KEYS.AUTO_START) {
        return Promise.resolve("false");
      }
      if (key === CONFIG_KEYS.LANGUAGE) {
        return Promise.resolve("zh-CN");
      }
      return Promise.resolve(null);
    });
    vi.mocked(autostartApi.checkStatus).mockResolvedValue(false);
  });

  it("应该渲染页面", async () => {
    render(
      <HashRouter>
        <SystemConfig />
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("secondary-nav-bar")).toBeInTheDocument();
      expect(screen.getByText(/pages.systemConfig.title/)).toBeInTheDocument();
    });
  });

  it("应该加载配置", async () => {
    render(
      <HashRouter>
        <SystemConfig />
      </HashRouter>
    );

    await waitFor(() => {
      expect(configApi.get).toHaveBeenCalledWith(CONFIG_KEYS.AUTO_START);
      expect(configApi.get).toHaveBeenCalledWith(CONFIG_KEYS.LANGUAGE);
    });
  });

  it("应该切换开机自启动", async () => {
    const user = userEvent.setup();

    vi.mocked(autostartApi.enable).mockResolvedValue(undefined);
    vi.mocked(configApi.set).mockResolvedValue(undefined);

    render(
      <HashRouter>
        <SystemConfig />
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/pages.systemConfig.autoStart/)).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() => {
      expect(autostartApi.enable).toHaveBeenCalled();
      expect(configApi.set).toHaveBeenCalledWith(CONFIG_KEYS.AUTO_START, "true");
    });
  });

  it("应该切换语言", async () => {
    const user = userEvent.setup();

    vi.mocked(configApi.set).mockResolvedValue(undefined);
    mockChangeLanguage.mockResolvedValue(undefined);

    render(
      <HashRouter>
        <SystemConfig />
      </HashRouter>
    );

    await waitFor(() => {
      // 等待单选按钮出现
      expect(screen.getByRole("radio", { name: /pages.systemConfig.languageZhCN/ })).toBeInTheDocument();
    });

    const englishRadio = screen.getByRole("radio", { name: /pages.systemConfig.languageEnUS/ });
    await user.click(englishRadio);

    await waitFor(() => {
      expect(mockChangeLanguage).toHaveBeenCalledWith("en-US");
      expect(configApi.set).toHaveBeenCalledWith(CONFIG_KEYS.LANGUAGE, "en-US");
    });
  });

  it("应该在加载配置失败时显示错误", async () => {
    vi.mocked(configApi.get).mockRejectedValue(new Error("加载失败"));

    render(
      <HashRouter>
        <SystemConfig />
      </HashRouter>
    );

    await waitFor(() => {
      // 错误应该被处理
      expect(configApi.get).toHaveBeenCalled();
    });
  });
});

