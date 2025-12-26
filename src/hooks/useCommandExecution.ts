import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { listen } from "@tauri-apps/api/event";
import { commandExecutionApi } from "../api/database";
import { CommandState, CommandStatus } from "../types";
import { ErrorHandler } from "../utils/errorHandler";
import { Logger } from "../utils/logger";

/**
 * 命令执行Hook
 */
export function useCommandExecution() {
  const [states, setStates] = useState<Record<number, CommandState>>({});
  const [loading, setLoading] = useState(false);

  /**
   * 加载所有命令状态
   */
  const loadStates = useCallback(async () => {
    try {
      const allStates = await commandExecutionApi.getAllStates();
      setStates(allStates);
      Logger.debug("Command states loaded", allStates);
    } catch (err) {
      ErrorHandler.handleSilent(err);
      Logger.error("Failed to load command states", err);
    }
  }, []);

  /**
   * 执行命令
   */
  const executeCommand = useCallback(async (commandId: number): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Executing command", { commandId });
      await commandExecutionApi.execute(commandId);
      message.success("命令已启动");
      Logger.info("Command executed successfully", { commandId });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "执行命令失败");
      Logger.error("Failed to execute command", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 停止命令
   */
  const stopCommand = useCallback(async (commandId: number): Promise<boolean> => {
    try {
      setLoading(true);
      Logger.debug("Stopping command", { commandId });
      await commandExecutionApi.stop(commandId);
      message.info("命令已停止");
      Logger.info("Command stopped successfully", { commandId });
      return true;
    } catch (err) {
      ErrorHandler.handle(err, "停止命令失败");
      Logger.error("Failed to stop command", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取命令状态
   */
  const getCommandStatus = useCallback((commandId: number): CommandStatus => {
    const state = states[commandId];
    return state?.status || "idle";
  }, [states]);

  /**
   * 检查命令是否运行中
   */
  const isRunning = useCallback((commandId: number): boolean => {
    return getCommandStatus(commandId) === "running";
  }, [getCommandStatus]);

  /**
   * 检查命令是否有日志
   */
  const hasLogs = useCallback((commandId: number): boolean => {
    const status = getCommandStatus(commandId);
    return status === "running" || status === "success" || status === "failed";
  }, [getCommandStatus]);

  // 监听命令状态变化事件
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen<CommandState>("command-status-changed", (event) => {
        const state = event.payload;
        setStates((prev) => ({
          ...prev,
          [state.command_id]: state,
        }));
        Logger.debug("Command status changed", state);
      });
    };

    setupListener();
    loadStates();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [loadStates]);

  return {
    states,
    loading,
    loadStates,
    executeCommand,
    stopCommand,
    getCommandStatus,
    isRunning,
    hasLogs,
  };
}

