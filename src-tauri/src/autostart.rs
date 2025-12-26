// ==================== 开机自启动模块 ====================

#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;

/// 启用开机自启动
#[cfg(target_os = "windows")]
pub fn enable_autostart(app_name: &str, app_path: &str) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
    
    let (key, _) = hkcu
        .create_subkey(path)
        .map_err(|e| format!("无法打开注册表: {}", e))?;
    
    key.set_value(app_name, &app_path)
        .map_err(|e| format!("无法设置注册表值: {}", e))?;
    
    Ok(())
}

/// 禁用开机自启动
#[cfg(target_os = "windows")]
pub fn disable_autostart(app_name: &str) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
    
    // 使用 create_subkey 以获取写权限，如果键不存在则创建，存在则打开
    let (key, _) = hkcu
        .create_subkey(path)
        .map_err(|e| format!("无法打开注册表: {}", e))?;
    
    // 尝试删除值，如果值不存在则忽略错误（可能已经被删除）
    match key.delete_value(app_name) {
        Ok(_) => Ok(()),
        Err(e) => {
            let error_str = e.to_string();
            // 如果值不存在（已经被删除），不算错误
            if error_str.contains("not found") || error_str.contains("系统找不到") {
                Ok(())
            } else {
                Err(format!("无法删除注册表值: {}", e))
            }
        }
    }
}

/// 检查开机自启动是否已启用
#[cfg(target_os = "windows")]
pub fn is_autostart_enabled(app_name: &str) -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
    
    let key = hkcu
        .open_subkey(path)
        .map_err(|e| format!("无法打开注册表: {}", e))?;
    
    match key.get_value::<String, _>(app_name) {
        Ok(_) => Ok(true),
        Err(e) => {
            // 检查是否是文件未找到错误（表示注册表项不存在）
            let error_str = e.to_string();
            if error_str.contains("not found") || error_str.contains("系统找不到") {
                Ok(false)
            } else {
                Err(format!("无法读取注册表值: {}", e))
            }
        }
    }
}

/// 非 Windows 平台的空实现
#[cfg(not(target_os = "windows"))]
pub fn enable_autostart(_app_name: &str, _app_path: &str) -> Result<(), String> {
    Err("开机自启动功能仅在 Windows 平台可用".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn disable_autostart(_app_name: &str) -> Result<(), String> {
    Err("开机自启动功能仅在 Windows 平台可用".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn is_autostart_enabled(_app_name: &str) -> Result<bool, String> {
    Ok(false)
}

