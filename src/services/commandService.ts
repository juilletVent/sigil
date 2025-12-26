import { commandApi } from "../api/database";
import { Command, CreateCommandParams, UpdateCommandParams, ImportResult } from "../types";
import { Logger } from "../utils/logger";
import { AppError } from "../utils/errorHandler";
import { ERROR_CODES } from "../constants/errors";

/**
 * 命令服务类
 * 封装命令相关的业务逻辑
 */
export class CommandService {
  /**
   * 获取所有命令
   */
  static async getAllCommands(): Promise<Command[]> {
    try {
      Logger.debug("Getting all commands");
      const commands = await commandApi.getAll();
      Logger.info(`Retrieved ${commands.length} commands`);
      return commands;
    } catch (error) {
      Logger.error("Failed to get all commands", error);
      throw new AppError(ERROR_CODES.DATABASE_QUERY_FAILED, "获取命令列表失败", error);
    }
  }

  /**
   * 根据ID获取命令
   */
  static async getCommandById(id: number): Promise<Command> {
    try {
      Logger.debug("Getting command by id", { id });
      const command = await commandApi.getById(id);
      Logger.info("Command retrieved", { id });
      return command;
    } catch (error) {
      Logger.error("Failed to get command by id", error);
      throw new AppError(ERROR_CODES.COMMAND_NOT_FOUND, "命令不存在", error);
    }
  }

  /**
   * 创建命令
   */
  static async createCommand(params: CreateCommandParams): Promise<Command> {
    try {
      Logger.debug("Creating command", params);
      const command = await commandApi.create(params);
      Logger.info("Command created", { id: command.id });
      return command;
    } catch (error) {
      Logger.error("Failed to create command", error);
      throw new AppError(ERROR_CODES.DATABASE_WRITE_FAILED, "创建命令失败", error);
    }
  }

  /**
   * 更新命令
   */
  static async updateCommand(id: number, params: UpdateCommandParams): Promise<void> {
    try {
      Logger.debug("Updating command", { id, params });
      await commandApi.update(id, params);
      Logger.info("Command updated", { id });
    } catch (error) {
      Logger.error("Failed to update command", error);
      throw new AppError(ERROR_CODES.DATABASE_WRITE_FAILED, "更新命令失败", error);
    }
  }

  /**
   * 删除命令
   */
  static async deleteCommand(id: number): Promise<void> {
    try {
      Logger.debug("Deleting command", { id });
      await commandApi.delete(id);
      Logger.info("Command deleted", { id });
    } catch (error) {
      Logger.error("Failed to delete command", error);
      throw new AppError(ERROR_CODES.DATABASE_WRITE_FAILED, "删除命令失败", error);
    }
  }

  /**
   * 更新命令排序
   */
  static async updateSortOrders(commandIds: number[]): Promise<void> {
    try {
      Logger.debug("Updating sort orders", { commandIds });
      await commandApi.updateSortOrders(commandIds);
      Logger.info("Sort orders updated");
    } catch (error) {
      Logger.error("Failed to update sort orders", error);
      throw new AppError(ERROR_CODES.DATABASE_WRITE_FAILED, "更新排序失败", error);
    }
  }

  /**
   * 导出命令
   */
  static async exportCommands(): Promise<string> {
    try {
      Logger.debug("Exporting commands");
      const jsonData = await commandApi.exportToJson();
      Logger.info("Commands exported");
      return jsonData;
    } catch (error) {
      Logger.error("Failed to export commands", error);
      throw new AppError(ERROR_CODES.FILE_WRITE_FAILED, "导出命令失败", error);
    }
  }

  /**
   * 导入命令
   */
  static async importCommands(jsonData: string): Promise<ImportResult> {
    try {
      Logger.debug("Importing commands");
      const result = await commandApi.importFromJson(jsonData);
      Logger.info("Commands imported", result);
      return result;
    } catch (error) {
      Logger.error("Failed to import commands", error);
      throw new AppError(ERROR_CODES.FILE_READ_FAILED, "导入命令失败", error);
    }
  }
}

