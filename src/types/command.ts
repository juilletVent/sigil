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
 * 命令表单值
 */
export interface CommandFormValues {
  name: string;
  command: string;
  sudo?: boolean;
  workingDirectory?: string;
  url?: string;
  notificationWhenFinished?: boolean;
}

/**
 * UI层使用的命令项（用于列表显示）
 */
export interface CommandItem {
  id: string;
  name: string;
  isRunning: boolean;
  url?: string;
  hasLogs?: boolean;
}

