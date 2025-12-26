// ==================== 单实例检查 ====================

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{CloseHandle, HANDLE};
#[cfg(target_os = "windows")]
use windows::Win32::System::Threading::{CreateMutexW, ReleaseMutex};
#[cfg(target_os = "windows")]
use windows::core::PCWSTR;
#[cfg(target_os = "windows")]
use std::ffi::OsStr;
#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;
#[cfg(target_os = "windows")]
use std::io::{Read, Write};
#[cfg(target_os = "windows")]
use std::net::TcpStream;
#[cfg(target_os = "windows")]
use std::time::Duration;

/// 单实例互斥体名称
const MUTEX_NAME: &str = "Global\\SigilSingleInstanceMutex";

/// 检查是否已有实例在运行
/// 返回 (是否已有实例, 互斥体句柄)
#[cfg(target_os = "windows")]
pub fn check_single_instance() -> (bool, Option<HANDLE>) {
    // 将互斥体名称转换为宽字符串
    let mutex_name: Vec<u16> = OsStr::new(MUTEX_NAME)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        // 创建互斥体（初始拥有权为 true）
        match CreateMutexW(None, true, PCWSTR(mutex_name.as_ptr())) {
            Ok(mutex) => {
                // 检查错误码，如果错误是 ERROR_ALREADY_EXISTS，说明已有实例
                let last_error = windows::Win32::Foundation::GetLastError();
                if last_error == windows::Win32::Foundation::ERROR_ALREADY_EXISTS {
                    CloseHandle(mutex).ok();
                    return (true, None);
                }
                // 成功创建互斥体，这是第一个实例
                (false, Some(mutex))
            }
            Err(_) => {
                // 创建失败，可能已有实例在运行
                (true, None)
            }
        }
    }
}

/// 非 Windows 平台的实现（暂时允许多实例）
#[cfg(not(target_os = "windows"))]
pub fn check_single_instance() -> (bool, Option<()>) {
    // 非 Windows 平台暂时不实现单实例检查
    (false, Some(()))
}

/// 激活已运行实例的主窗口
/// 通过 TCP 连接发送激活消息给原实例，让原实例使用 Tauri API 激活窗口
#[cfg(target_os = "windows")]
pub fn activate_existing_instance() -> bool {
    // 尝试连接到原实例的 IPC 服务器
    match TcpStream::connect_timeout(
        &"127.0.0.1:14201".parse().unwrap(),
        Duration::from_millis(500),
    ) {
        Ok(mut stream) => {
            // 发送激活消息
            let message = b"activate";
            if stream.write_all(message).is_err() {
                return false;
            }
            // 设置读取超时并等待响应
            let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
            let mut buffer = [0u8; 2];
            let _ = stream.read_exact(&mut buffer);
            true
        }
        Err(_) => {
            // 连接失败，原实例可能还没有启动 IPC 服务器
            // 这种情况下，我们不做任何操作，避免破坏 Tauri 的内部状态
            true
        }
    }
}



/// 非 Windows 平台的实现
#[cfg(not(target_os = "windows"))]
pub fn activate_existing_instance() -> bool {
    // 非 Windows 平台暂时不实现
    false
}

/// 释放互斥体
#[cfg(target_os = "windows")]
pub fn release_mutex(mutex: HANDLE) {
    unsafe {
        ReleaseMutex(mutex).ok();
        CloseHandle(mutex).ok();
    }
}

/// 非 Windows 平台的实现
#[cfg(not(target_os = "windows"))]
pub fn release_mutex(_mutex: ()) {
    // 非 Windows 平台不需要释放
}

