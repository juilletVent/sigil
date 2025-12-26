import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { commandApi } from "../api/database";
import { Command, CommandItem, CreateCommandParams, UpdateCommandParams } from "../types";
import { ErrorHandler } from "../utils/errorHandler";
import { Logger } from "../utils/logger";

/**
 * 命令列表Hook
 */
export function useCommands() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 加载命令列表
   */
  const loadCommands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      Logger.debug("Loading commands");
      const data = await commandApi.getAll();
      setCommands(data);
      Logger.info(`Loaded ${data.length} commands`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("加载命令列表失败");
      setError(error);
      ErrorHandler.handle(err, "加载命令列表失败");
      Logger.error("Failed to load commands", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 创建命令
   */
  const createCommand = useCallback(async (params: CreateCommandParams): Promise<Command | null> => {
    try {
      setLoading(true);
      Logger.debug("Creating command", params);
      const newCommand = await commandApi.create(params);
      await loadCommands();
      message.success("创建成功");
      Logger.info("Command created successfully", newCommand);
      return newCommand;
    } catch (err) {
      ErrorHandler.handle(err, "创建命令失败");
      Logger.error("Failed to create command", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadCommands]);

  /**
   * 更新命令
   */
  const updateCommand = useCallback(async (id: number, params: UpdateCommandParams): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Updating command", { id, params });
      await commandApi.update(id, params);
      await loadCommands();
      message.success("更新成功");
      Logger.info("Command updated successfully", { id });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "更新命令失败");
      Logger.error("Failed to update command", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCommands]);

  /**
   * 删除命令
   */
  const deleteCommand = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Deleting command", { id });
      await commandApi.delete(id);
      await loadCommands();
      message.success("删除成功");
      Logger.info("Command deleted successfully", { id });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "删除命令失败");
      Logger.error("Failed to delete command", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCommands]);

  /**
   * 更新排序
   */
  const updateSortOrders = useCallback(async (commandIds: number[]): Promise<boolean> => {
    try {
      Logger.debug("Updating sort orders", { commandIds });
      await commandApi.updateSortOrders(commandIds);
      await loadCommands();
      Logger.info("Sort orders updated successfully");
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "保存排序失败");
      Logger.error("Failed to update sort orders", err);
      return false;
    }
  }, [loadCommands]);

  /**
   * 复制命令
   */
  const copyCommand = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Copying command", { id });
      const command = await commandApi.getById(id);
      const newCommand = await commandApi.create({
        name: `${command.name}-Copy`,
        command: command.command,
        sudo: command.sudo,
        working_directory: command.working_directory,
        url: command.url,
        notification_when_finished: command.notification_when_finished,
      });
      await loadCommands();
      message.success("复制成功");
      Logger.info("Command copied successfully", { id, newId: newCommand.id });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "复制命令失败");
      Logger.error("Failed to copy command", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCommands]);

  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  return {
    commands,
    loading,
    error,
    loadCommands,
    createCommand,
    updateCommand,
    deleteCommand,
    updateSortOrders,
    copyCommand,
  };
}

/**
 * 将Command转换为CommandItem
 */
export function convertToCommandItem(command: Command, isRunning: boolean, hasLogs: boolean): CommandItem {
  return {
    id: command.id.toString(),
    name: command.name,
    isRunning,
    url: command.url,
    hasLogs,
  };
}

