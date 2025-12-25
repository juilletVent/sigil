use image::GenericImageView;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{App, AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::GetSystemMenu;

// ==================== 窗口设置 ====================

/// 禁用窗口系统菜单（Windows平台）
#[cfg(target_os = "windows")]
fn disable_system_menu(window: &tauri::WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let hwnd = HWND(hwnd.0 as *mut std::ffi::c_void);
            // 使用 true 参数完全删除系统菜单
            let _ = GetSystemMenu(hwnd, true);
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn disable_system_menu(_window: &tauri::WebviewWindow) {
    // 非 Windows 平台不需要处理
}

/// 设置主窗口
pub fn setup_main_window(app: &App) -> Result<tauri::WebviewWindow, String> {
    // 获取主窗口
    let window = app
        .get_webview_window("main")
        .ok_or("无法获取主窗口")?;

    // 禁用系统菜单
    disable_system_menu(&window);

    // 监听窗口关闭事件
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            // 阻止窗口关闭
            api.prevent_close();
            // 隐藏窗口而不是退出
            let _ = window_clone.hide();
        }
    });

    Ok(window)
}

// ==================== 托盘设置 ====================

/// 设置系统托盘
pub fn setup_tray(app: &App, window: tauri::WebviewWindow) -> Result<(), String> {
    // 创建托盘菜单
    let show_item = MenuItem::with_id(app, "show", "显示/隐藏", true, None::<&str>)
        .map_err(|e| format!("创建菜单项失败: {}", e))?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)
        .map_err(|e| format!("创建菜单项失败: {}", e))?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])
        .map_err(|e| format!("创建菜单失败: {}", e))?;

    let window_for_tray = window.clone();

    // 使用编译时嵌入的图标（确保在打包后也能正确加载）
    let icon = include_bytes!("../icons/128x128.png");
    let icon_image =
        image::load_from_memory(icon).map_err(|e| format!("加载图标失败: {}", e))?;
    let (width, height) = icon_image.dimensions();
    let rgba = icon_image.to_rgba8().into_raw();
    let tray_icon = tauri::image::Image::new_owned(rgba, width, height);

    // 构建托盘图标
    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(tray_icon)
        .tooltip("Sigil")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            match event.id.as_ref() {
                "show" => {
                    // 切换窗口显示/隐藏
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                "quit" => {
                    // 退出应用程序
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(move |_tray, event| {
            match event {
                tauri::tray::TrayIconEvent::Click {
                    button: tauri::tray::MouseButton::Left,
                    ..
                } => {
                    // 左键单击：显示并激活窗口
                    if !window_for_tray.is_visible().unwrap_or(false) {
                        let _ = window_for_tray.show();
                    }
                    let _ = window_for_tray.set_focus();
                }
                _ => {}
            }
        })
        .build(app)
        .map_err(|e| format!("构建托盘失败: {}", e))?;

    Ok(())
}

// ==================== 日志窗口管理 ====================

/// 创建或显示日志窗口
pub fn create_log_window(
    app: &AppHandle,
    command_id: i64,
    command_name: &str,
) -> Result<(), String> {
    let window_label = format!("log-{}", command_id);

    // 检查窗口是否已存在
    if let Some(window) = app.get_webview_window(&window_label) {
        // 窗口已存在，显示并聚焦
        window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
        window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))?;
        return Ok(());
    }

    // 创建新窗口 - 使用路由
    let url_path = format!(
        "/#/log/{}?name={}",
        command_id,
        urlencoding::encode(command_name)
    );
    let title = format!("命令日志 - {}", command_name);

    WebviewWindowBuilder::new(
        app,
        &window_label,
        WebviewUrl::App(url_path.parse().unwrap())
    )
    .title(title)
    .inner_size(800.0, 600.0)
    .min_inner_size(200.0, 200.0)
    .resizable(true)
    .build()
    .map_err(|e| format!("创建窗口失败: {}", e))?;

    Ok(())
}

