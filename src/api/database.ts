import { invoke } from "@tauri-apps/api/core";

// ==================== 类型定义 ====================

/**
 * 命令数据结构
 */
export interface Command {
  id: number;
  name: string;
  command: string;
  sudo: boolean;
  working_directory?: string;
  url?: string;
  notification_when_finished: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 创建命令的参数
 */
export interface CreateCommandParams {
  name: string;
  command: string;
  sudo: boolean;
  working_directory?: string;
  url?: string;
  notification_when_finished: boolean;
}

/**
 * 更新命令的参数（所有字段可选）
 */
export interface UpdateCommandParams {
  name?: string;
  command?: string;
  sudo?: boolean;
  working_directory?: string;
  url?: string;
  notification_when_finished?: boolean;
}

/**
 * 导入结果
 */
export interface ImportResult {
  success_count: number;
  skip_count: number;
  failed_items: Array<{ index: number; reason: string }>;
}

// ==================== 命令管理 API ====================

/**
 * 命令管理相关 API
 */
export const commandApi = {
  /**
   * 获取所有命令（按 sort_order 排序）
   */
  getAll: async (): Promise<Command[]> => {
    return await invoke<Command[]>("get_all_commands");
  },

  /**
   * 根据 ID 获取单个命令
   */
  getById: async (id: number): Promise<Command> => {
    return await invoke<Command>("get_command_by_id", { id });
  },

  /**
   * 创建新命令
   */
  create: async (params: CreateCommandParams): Promise<Command> => {
    return await invoke<Command>("create_command", {
      name: params.name,
      command: params.command,
      sudo: params.sudo,
      workingDirectory: params.working_directory,
      url: params.url,
      notificationWhenFinished: params.notification_when_finished,
    });
  },

  /**
   * 更新命令
   */
  update: async (id: number, params: UpdateCommandParams): Promise<void> => {
    return await invoke<void>("update_command", {
      id,
      name: params.name,
      command: params.command,
      sudo: params.sudo,
      workingDirectory: params.working_directory,
      url: params.url,
      notificationWhenFinished: params.notification_when_finished,
    });
  },

  /**
   * 删除命令
   */
  delete: async (id: number): Promise<void> => {
    return await invoke<void>("delete_command", { id });
  },

  /**
   * 批量更新命令排序
   * @param commandIds 命令 ID 数组，按新的排序顺序排列
   */
  updateSortOrders: async (commandIds: number[]): Promise<void> => {
    return await invoke<void>("update_sort_orders", { commandIds });
  },

  /**
   * 导出所有命令为 JSON 字符串
   */
  exportToJson: async (): Promise<string> => {
    return await invoke<string>("export_commands");
  },

  /**
   * 从 JSON 字符串导入命令
   */
  importFromJson: async (jsonData: string): Promise<ImportResult> => {
    return await invoke<ImportResult>("import_commands", { jsonData });
  },
};

// ==================== 系统配置 API ====================

/**
 * 系统配置相关 API
 */
export const configApi = {
  /**
   * 获取单个配置项
   */
  get: async (key: string): Promise<string | null> => {
    return await invoke<string | null>("get_system_config", { key });
  },

  /**
   * 设置配置项
   */
  set: async (key: string, value: string): Promise<void> => {
    return await invoke<void>("set_system_config", { key, value });
  },

  /**
   * 获取所有配置项
   */
  getAll: async (): Promise<Record<string, string>> => {
    return await invoke<Record<string, string>>("get_all_system_configs");
  },
};

// ==================== 命令执行相关 API ====================

/**
 * 命令执行状态
 */
export type CommandStatus = "idle" | "running" | "success" | "failed" | "stopped";

/**
 * 命令状态信息
 */
export interface CommandState {
  command_id: number;
  status: CommandStatus;
  pid?: number;
  start_time?: string;
  exit_code?: number;
}

/**
 * 命令执行相关 API
 */
export const commandExecutionApi = {
  /**
   * 执行命令
   */
  execute: async (commandId: number): Promise<void> => {
    return await invoke<void>("execute_command", { commandId });
  },

  /**
   * 停止命令
   */
  stop: async (commandId: number): Promise<void> => {
    return await invoke<void>("stop_command", { commandId });
  },

  /**
   * 获取命令状态
   */
  getState: async (commandId: number): Promise<CommandState | null> => {
    return await invoke<CommandState | null>("get_command_state", { commandId });
  },

  /**
   * 获取所有命令状态
   */
  getAllStates: async (): Promise<Record<number, CommandState>> => {
    return await invoke<Record<number, CommandState>>("get_all_command_states");
  },

  /**
   * 获取命令执行日志
   */
  getLogs: async (commandId: number): Promise<string[]> => {
    return await invoke<string[]>("get_command_logs", { commandId });
  },

  /**
   * 清空命令执行日志
   */
  clearLogs: async (commandId: number): Promise<void> => {
    return await invoke<void>("clear_command_logs", { commandId });
  },
};

// ==================== 开机自启动 API ====================

/**
 * 开机自启动相关 API
 */
export const autostartApi = {
  /**
   * 启用开机自启动
   */
  enable: async (): Promise<void> => {
    return await invoke<void>("enable_autostart");
  },

  /**
   * 禁用开机自启动
   */
  disable: async (): Promise<void> => {
    return await invoke<void>("disable_autostart");
  },

  /**
   * 检查开机自启动状态
   */
  checkStatus: async (): Promise<boolean> => {
    return await invoke<boolean>("check_autostart_status");
  },
};

// ==================== 配置键常量 ====================

/**
 * 系统配置键常量
 */
export const CONFIG_KEYS = {
  AUTO_START: "auto_start",
  LANGUAGE: "language",
} as const;

