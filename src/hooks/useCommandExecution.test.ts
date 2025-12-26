import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCommandExecution } from "./useCommandExecution";
import { commandExecutionApi } from "../api/database";
import { CommandState, CommandStatus } from "../types";

// Mock API
vi.mock("../api/database", () => ({
  commandExecutionApi: {
    getAllStates: vi.fn(),
    execute: vi.fn(),
    stop: vi.fn(),
  },
}));

// Mock Tauri event
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

// Mock antd message
vi.mock("antd", () => ({
  message: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useCommandExecution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该加载命令状态", async () => {
    const mockStates: Record<number, CommandState> = {
      1: {
        command_id: 1,
        status: "running",
        pid: 12345,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    };

    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue(mockStates);

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      expect(result.current.states).toEqual(mockStates);
    });

    expect(commandExecutionApi.getAllStates).toHaveBeenCalled();
  });

  it("应该执行命令", async () => {
    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue({});
    vi.mocked(commandExecutionApi.execute).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.executeCommand(1);

    expect(success).toBe(true);
    expect(commandExecutionApi.execute).toHaveBeenCalledWith(1);
  });

  it("应该在执行失败时返回false", async () => {
    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue({});
    vi.mocked(commandExecutionApi.execute).mockRejectedValue(new Error("执行失败"));

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.executeCommand(1);

    expect(success).toBe(false);
  });

  it("应该停止命令", async () => {
    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue({});
    vi.mocked(commandExecutionApi.stop).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.stopCommand(1);

    expect(success).toBe(true);
    expect(commandExecutionApi.stop).toHaveBeenCalledWith(1);
  });

  it("应该获取命令状态", async () => {
    const mockStates: Record<number, CommandState> = {
      1: {
        command_id: 1,
        status: "running",
        pid: 12345,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    };

    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue(mockStates);

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      const status = result.current.getCommandStatus(1);
      expect(status).toBe("running");
    });
  });

  it("应该检查命令是否运行中", async () => {
    const mockStates: Record<number, CommandState> = {
      1: {
        command_id: 1,
        status: "running",
        pid: 12345,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    };

    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue(mockStates);

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      expect(result.current.isRunning(1)).toBe(true);
      expect(result.current.isRunning(2)).toBe(false);
    });
  });

  it("应该检查命令是否有日志", async () => {
    const mockStates: Record<number, CommandState> = {
      1: {
        command_id: 1,
        status: "success",
        pid: 12345,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    };

    vi.mocked(commandExecutionApi.getAllStates).mockResolvedValue(mockStates);

    const { result } = renderHook(() => useCommandExecution());

    await waitFor(() => {
      expect(result.current.hasLogs(1)).toBe(true);
      expect(result.current.hasLogs(2)).toBe(false);
    });
  });
});

