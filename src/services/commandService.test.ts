import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandService } from "./commandService";
import { commandApi } from "../api/database";
import { Command, CreateCommandParams } from "../types";
import { AppError } from "../utils/errorHandler";

// Mock API
vi.mock("../api/database", () => ({
  commandApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateSortOrders: vi.fn(),
    exportToJson: vi.fn(),
    importFromJson: vi.fn(),
  },
}));

describe("CommandService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllCommands", () => {
    it("应该获取所有命令", async () => {
      const mockCommands: Command[] = [
        {
          id: 1,
          name: "测试命令",
          command: "echo test",
          sudo: false,
          notification_when_finished: false,
          sort_order: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      vi.mocked(commandApi.getAll).mockResolvedValue(mockCommands);

      const result = await CommandService.getAllCommands();

      expect(result).toEqual(mockCommands);
      expect(commandApi.getAll).toHaveBeenCalled();
    });

    it("应该在失败时抛出AppError", async () => {
      const error = new Error("数据库错误");
      vi.mocked(commandApi.getAll).mockRejectedValue(error);

      await expect(CommandService.getAllCommands()).rejects.toThrow(AppError);
    });
  });

  describe("createCommand", () => {
    it("应该创建命令", async () => {
      const params: CreateCommandParams = {
        name: "新命令",
        command: "echo new",
        sudo: false,
        notification_when_finished: false,
      };

      const createdCommand: Command = {
        id: 1,
        ...params,
        sort_order: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(commandApi.create).mockResolvedValue(createdCommand);

      const result = await CommandService.createCommand(params);

      expect(result).toEqual(createdCommand);
      expect(commandApi.create).toHaveBeenCalledWith(params);
    });
  });
});

