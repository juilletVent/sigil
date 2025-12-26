import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router";
import Home from "./Home";
import { commandApi, commandExecutionApi } from "../api/database";
import type { Command } from "../types";

// Mock API
vi.mock("../api/database", () => ({
  commandApi: {
    getAll: vi.fn(),
    updateSortOrders: vi.fn(),
    exportToJson: vi.fn(),
    importFromJson: vi.fn(),
  },
  commandExecutionApi: {
    getAllStates: vi.fn(),
    execute: vi.fn(),
    stop: vi.fn(),
  },
}));

// Mock Tauri API
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
  open: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock components
vi.mock("../components/StatusBar", () => ({
  default: () => <div data-testid="status-bar">StatusBar</div>,
}));

vi.mock("../components/ToolBar", () => ({
  default: ({ onAddCommand, onSettings, onImport, onExport }: any) => (
    <div data-testid="toolbar">
      <button onClick={onAddCommand}>Add</button>
      <button onClick={onSettings}>Settings</button>
      <button onClick={onImport}>Import</button>
      <button onClick={onExport}>Export</button>
    </div>
  ),
}));

vi.mock("../components/CommandList", () => ({
  default: ({ commands, onPlayCommand, onEditCommand, onDeleteCommand, onViewLogs, onReorder }: any) => (
    <div data-testid="command-list">
      {commands.map((cmd: any) => (
        <div key={cmd.id} data-testid={`command-${cmd.id}`}>
          <span>{cmd.name}</span>
          <button onClick={() => onPlayCommand?.(cmd.id)}>Play</button>
          <button onClick={() => onEditCommand?.(cmd.id)}>Edit</button>
          <button onClick={() => onDeleteCommand?.(cmd.id)}>Delete</button>
          <button onClick={() => onViewLogs?.(cmd.id)}>ViewLogs</button>
        </div>
      ))}
    </div>
  ),
}));

describe("Home", () => {
  const mockCommands: Command[] = [
    {
      id: 1,
      name: "测试命令1",
      command: "echo test1",
      sudo: false,
      notification_when_finished: false,
      sort_order: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "测试命令2",
      command: "echo test2",
      sudo: false,
      notification_when_finished: false,
      sort_order: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandApi.getAll).mockResolvedValue(mockCommands);
    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue({});
  });

  it("应该渲染页面", async () => {
    render(
      <HashRouter>
        <Home />
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
      expect(screen.getByTestId("command-list")).toBeInTheDocument();
      expect(screen.getByTestId("status-bar")).toBeInTheDocument();
    });
  });

  it("应该加载命令列表", async () => {
    render(
      <HashRouter>
        <Home />
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("测试命令1")).toBeInTheDocument();
      expect(screen.getByText("测试命令2")).toBeInTheDocument();
    });

    expect(commandApi.getAll).toHaveBeenCalled();
  });

  it("应该处理添加命令", async () => {
    const user = userEvent.setup();

    render(
      <HashRouter>
        <Home />
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Add")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add");
    await user.click(addButton);

    // 应该导航到配置编辑页面（通过 HashRouter）
    expect(window.location.hash).toBe("#/config-edit");
  });

  it("应该处理设置", async () => {
    const user = userEvent.setup();

    render(
      <HashRouter>
        <Home />
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    const settingsButton = screen.getByText("Settings");
    await user.click(settingsButton);

    expect(window.location.hash).toBe("#/system-config");
  });
});

