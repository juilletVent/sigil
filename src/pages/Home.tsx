import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { message, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import StatusBar from "../components/StatusBar";
import ToolBar from "../components/ToolBar";
import CommandList from "../components/CommandList";
import type { CommandItem } from "../types";
import { AppRoutes } from "../constants/routes";
import { commandApi, commandExecutionApi, CommandState } from "../api/database";

// ==================== 样式组件 ====================

const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px); /* 减去底部状态栏高度 */
  padding-top: 40px; /* 为固定的顶部导航栏留出空间 */
`;

// ==================== 主组件 ====================

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [commands, setCommands] = useState<CommandItem[]>([]);

  // 加载命令列表
  useEffect(() => {
    loadCommands();
    loadCommandStates();

    // 监听命令状态变化事件
    const unlisten = listen<CommandState>("command-status-changed", (event) => {
      const state = event.payload;
      updateCommandStatus(state.command_id, state.status);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const loadCommands = async () => {
    try {
      const data = await commandApi.getAll();
      // 转换数据格式以匹配 CommandItem 接口
      const formattedCommands: CommandItem[] = data.map((cmd) => ({
        id: cmd.id.toString(),
        name: cmd.name,
        isRunning: false,
        url: cmd.url,
      }));
      setCommands(formattedCommands);
    } catch (error) {
      console.error("加载命令列表失败:", error);
      message.error("加载命令列表失败");
    }
  };

  // 加载所有命令的状态
  const loadCommandStates = async () => {
    try {
      const states = await commandExecutionApi.getAllStates();
      // 更新命令的运行状态和日志状态
      setCommands((prev) =>
        prev.map((cmd) => {
          const state = states[parseInt(cmd.id)];
          const isRunning = state?.status === "running";
          const hasLogs = isRunning || (state?.status === "success" || state?.status === "failed");
          return {
            ...cmd,
            isRunning,
            hasLogs,
          };
        })
      );
    } catch (error) {
      console.error("加载命令状态失败:", error);
    }
  };

  // 更新单个命令的状态
  const updateCommandStatus = (commandId: number, status: string) => {
    setCommands((prev) =>
      prev.map((cmd) => {
        if (parseInt(cmd.id) === commandId) {
          const isRunning = status === "running";
          const hasLogs = isRunning || status === "success" || status === "failed";
          return { ...cmd, isRunning, hasLogs };
        }
        return cmd;
      })
    );
  };

  // 处理拖拽排序
  const handleReorder = async (newCommands: CommandItem[]) => {
    try {
      // 立即更新 UI
      setCommands(newCommands);

      // 提取命令 ID 数组并发送到后端
      const commandIds = newCommands.map((cmd) => parseInt(cmd.id));
      await commandApi.updateSortOrders(commandIds);
    } catch (error) {
      console.error("保存排序失败:", error);
      message.error("保存排序失败");
      // 失败时重新加载列表
      loadCommands();
    }
  };

  // 处理添加命令
  const handleAddCommand = () => {
    navigate(AppRoutes.CONFIG_EDIT);
  };

  // 处理设置
  const handleSettings = () => {
    navigate(AppRoutes.SYSTEM_CONFIG);
  };

  // 处理播放命令
  const handlePlayCommand = async (id: string) => {
    const commandId = parseInt(id);
    const command = commands.find((cmd) => cmd.id === id);

    if (!command) return;

    try {
      if (command.isRunning) {
        // 停止命令 - 同步更新，等待后端确认
        await commandExecutionApi.stop(commandId);
        message.info(t("components.commandItem.stopSuccess") || "命令已停止");
        // UI 会通过 command-status-changed 事件自动更新
      } else {
        // 执行命令
        await commandExecutionApi.execute(commandId);
        message.success(t("components.commandItem.executeSuccess") || "命令已启动");
        // UI 会通过 command-status-changed 事件自动更新
      }
    } catch (error) {
      console.error("命令操作失败:", error);
      message.error(
        command.isRunning
          ? t("components.commandItem.stopFailed") || "停止命令失败"
          : t("components.commandItem.executeFailed") || "执行命令失败"
      );
    }
  };

  // 处理编辑命令
  const handleEditCommand = (id: string) => {
    navigate(`${AppRoutes.CONFIG_EDIT}?id=${id}`);
  };

  // 处理复制命令
  const handleCopyCommand = async (id: string) => {
    try {
      // 获取完整的命令数据
      const commandData = await commandApi.getById(parseInt(id));

      // 创建新命令，名称添加 -Copy 后缀
      await commandApi.create({
        name: `${commandData.name}-Copy`,
        command: commandData.command,
        sudo: commandData.sudo,
        working_directory: commandData.working_directory,
        url: commandData.url,
        notification_when_finished: commandData.notification_when_finished,
      });

      message.success(t("components.commandItem.copySuccess"));
      // 重新加载命令列表
      loadCommands();
    } catch (error) {
      console.error("复制命令失败:", error);
      message.error(t("components.commandItem.copyFailed"));
    }
  };

  // 处理删除命令
  const handleDeleteCommand = async (id: string) => {
    try {
      // 获取命令信息用于显示在确认对话框中
      const commandData = await commandApi.getById(parseInt(id));

      Modal.confirm({
        title: t("components.commandItem.deleteConfirmTitle"),
        content: t("components.commandItem.deleteConfirmContent", {
          name: commandData.name,
        }),
        okText: t("common.confirm"),
        cancelText: t("common.cancel"),
        okType: "danger",
        onOk: async () => {
          try {
            await commandApi.delete(parseInt(id));
            message.success(t("components.commandItem.deleteSuccess"));
            // 重新加载命令列表
            loadCommands();
          } catch (error) {
            console.error("删除命令失败:", error);
            message.error(t("components.commandItem.deleteFailed"));
          }
        },
      });
    } catch (error) {
      console.error("获取命令信息失败:", error);
      message.error(t("components.commandItem.deleteFailed"));
    }
  };

  // 处理导出命令
  const handleExport = async () => {
    try {
      // 获取导出数据
      const jsonData = await commandApi.exportToJson();

      // 生成默认文件名（格式：commands_YYYYMMDD.json）
      const date = new Date();
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      const defaultFileName = `commands_${dateStr}.json`;

      // 打开保存对话框
      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
      });

      if (filePath) {
        // 写入文件
        await invoke("write_export_file", { filePath, data: jsonData });
        message.success(t("components.toolbar.exportSuccess"));
      }
    } catch (error) {
      console.error("导出命令失败:", error);
      message.error(t("components.toolbar.exportFailed") || "导出失败");
    }
  };

  // 处理导入命令
  const handleImport = async () => {
    try {
      // 打开文件选择对话框
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
      });

      if (filePath) {
        // 读取文件内容
        const jsonData = await invoke<string>("read_import_file", { filePath });

        // 调用导入 API
        const result = await commandApi.importFromJson(jsonData);

        // 显示导入结果
        if (result.success_count > 0 || result.skip_count > 0) {
          const successMsg = t("components.toolbar.importSuccess", {
            success: result.success_count,
            skip: result.skip_count,
          });
          message.success(successMsg);
          
          // 重新加载命令列表
          loadCommands();
        } else {
          message.warning(t("components.toolbar.importNoData") || "没有可导入的数据");
        }

        // 如果有失败项，显示详细信息
        if (result.failed_items.length > 0) {
          // 失败项已在 message 中显示，无需额外日志
        }
      }
    } catch (error) {
      console.error("导入命令失败:", error);
      message.error(t("components.toolbar.importFailed") || "导入失败");
    }
  };

  // 处理查看日志
  const handleViewLogs = async (id: string) => {
    try {
      const commandId = parseInt(id);
      const command = commands.find((cmd) => cmd.id === id);
      await invoke("open_log_window", {
        commandId,
        commandName: command?.name || "Unknown",
      });
    } catch (error) {
      console.error("打开日志窗口失败:", error);
      message.error("打开日志窗口失败");
    }
  };

  return (
    <HomeContainer>
      <MainContent>
        <ToolBar 
          onAddCommand={handleAddCommand} 
          onSettings={handleSettings}
          onImport={handleImport}
          onExport={handleExport}
        />
        <CommandList
          commands={commands}
          onPlayCommand={handlePlayCommand}
          onEditCommand={handleEditCommand}
          onCopyCommand={handleCopyCommand}
          onDeleteCommand={handleDeleteCommand}
          onViewLogs={handleViewLogs}
          onReorder={handleReorder}
        />
      </MainContent>
      <StatusBar />
    </HomeContainer>
  );
}

export default Home;
