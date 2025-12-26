import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCommands } from "./useCommands";
import { commandApi } from "../api/database";
import { Command } from "../types";

// Mock API
vi.mock("../api/database", () => ({
  commandApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateSortOrders: vi.fn(),
    getById: vi.fn(),
  },
}));

// Mock message
vi.mock("antd", () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该加载命令列表", async () => {
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
    ];

    vi.mocked(commandApi.getAll).mockResolvedValue(mockCommands);

    const { result } = renderHook(() => useCommands());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.commands).toEqual(mockCommands);
    expect(commandApi.getAll).toHaveBeenCalled();
  });

  it("应该创建命令", async () => {
    const newCommand: Command = {
      id: 1,
      name: "新命令",
      command: "echo new",
      sudo: false,
      notification_when_finished: false,
      sort_order: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    vi.mocked(commandApi.getAll).mockResolvedValue([]);
    vi.mocked(commandApi.create).mockResolvedValue(newCommand);

    const { result } = renderHook(() => useCommands());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const created = await result.current.createCommand({
      name: "新命令",
      command: "echo new",
      sudo: false,
      notification_when_finished: false,
    });

    expect(created).toEqual(newCommand);
    expect(commandApi.create).toHaveBeenCalled();
  });
});

