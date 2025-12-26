/**
 * 应用路由路径枚举
 * 统一管理所有路由路径，避免硬编码
 */
export enum AppRoutes {
  /** 首页 - 命令列表 */
  HOME = "/",
  
  /** 关于页面 - 程序信息 */
  ABOUT = "/about",
  
  /** 设置页面 */
  SETTINGS = "/settings",
  
  /** 系统设置页面 */
  SYSTEM_CONFIG = "/system-config",
  
  /** 命令配置页面 - 新增/编辑命令 */
  CONFIG_EDIT = "/config-edit",
  
  /** 命令日志页面 - 查看命令执行日志 */
  COMMAND_LOG = "/log/:commandId",
}

