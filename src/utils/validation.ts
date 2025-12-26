/**
 * 验证工具函数
 */

/**
 * 验证命令名称
 */
export function validateCommandName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "命令名称不能为空" };
  }

  if (name.length > 100) {
    return { valid: false, error: "命令名称不能超过100个字符" };
  }

  return { valid: true };
}

/**
 * 验证命令内容
 */
export function validateCommand(command: string): { valid: boolean; error?: string } {
  if (!command || command.trim().length === 0) {
    return { valid: false, error: "命令内容不能为空" };
  }

  if (command.length > 10000) {
    return { valid: false, error: "命令内容不能超过10000个字符" };
  }

  return { valid: true };
}

/**
 * 验证URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: true }; // URL是可选的
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "URL格式不正确" };
  }
}

/**
 * 验证工作目录路径
 */
export function validateWorkingDirectory(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim().length === 0) {
    return { valid: true }; // 工作目录是可选的
  }

  // 基本路径验证（实际路径验证由后端完成）
  if (path.length > 500) {
    return { valid: false, error: "路径长度不能超过500个字符" };
  }

  return { valid: true };
}

