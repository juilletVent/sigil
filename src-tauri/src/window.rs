use crate::db::Database;
use crate::i18n::{get_language_from_db, Translations};
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
    // 获取数据库以读取语言设置
    let database = app.state::<Database>();
    let language = get_language_from_db(database.inner());
    
    // 获取主窗口
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| Translations::error_get_main_window(language))?;

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
    // 获取数据库以读取语言设置
    let database = app.state::<Database>();
    let language = get_language_from_db(database.inner());
    
    // 创建托盘菜单
    let show_item = MenuItem::with_id(app, "show", Translations::tray_show(language), true, None::<&str>)
        .map_err(|e| Translations::error_create_menu_item(language, &e.to_string()))?;
    let quit_item = MenuItem::with_id(app, "quit", Translations::tray_quit(language), true, None::<&str>)
        .map_err(|e| Translations::error_create_menu_item(language, &e.to_string()))?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])
        .map_err(|e| Translations::error_create_menu(language, &e.to_string()))?;

    let window_for_tray = window.clone();

    // 使用编译时嵌入的图标（确保在打包后也能正确加载）
    let icon = include_bytes!("../icons/128x128.png");
    let icon_image =
        image::load_from_memory(icon).map_err(|e| Translations::error_load_icon(language, &e.to_string()))?;
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
                        // 检查窗口是否最小化
                        let is_minimized = window.is_minimized().unwrap_or(false);
                        let is_visible = window.is_visible().unwrap_or(false);
                        
                        if is_visible && !is_minimized {
                            // 窗口可见且未最小化，则隐藏
                            let _ = window.hide();
                        } else {
                            // 窗口不可见或最小化，则显示并激活
                            if is_minimized {
                                // 如果窗口最小化，先恢复窗口
                                let _ = window.unminimize();
                            }
                            // 如果窗口不可见，先显示
                            if !is_visible {
                                let _ = window.show();
                            }
                            // 激活窗口
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
                    // 检查窗口是否最小化
                    if window_for_tray.is_minimized().unwrap_or(false) {
                        // 如果窗口最小化，先恢复窗口
                        let _ = window_for_tray.unminimize();
                    }
                    
                    // 如果窗口不可见，先显示
                    if !window_for_tray.is_visible().unwrap_or(false) {
                        let _ = window_for_tray.show();
                    }
                    
                    // 激活窗口
                    let _ = window_for_tray.set_focus();
                }
                _ => {}
            }
        })
        .build(app)
        .map_err(|e| Translations::error_build_tray(language, &e.to_string()))?;

    Ok(())
}

// ==================== 日志窗口管理 ====================

/// 创建或显示日志窗口
pub fn create_log_window(
    app: &AppHandle,
    command_id: i64,
    command_name: &str,
) -> Result<(), String> {
    // 获取数据库以读取语言设置
    let database = app.state::<Database>();
    let language = get_language_from_db(database.inner());
    
    let window_label = format!("log-{}", command_id);

    // 检查窗口是否已存在
    if let Some(window) = app.get_webview_window(&window_label) {
        // 窗口已存在，显示并聚焦
        window.show().map_err(|e| Translations::error_show_window(language, &e.to_string()))?;
        window.set_focus().map_err(|e| Translations::error_focus_window(language, &e.to_string()))?;
        return Ok(());
    }

    // 创建新窗口 - 使用路由
    let url_path = format!(
        "/#/log/{}?name={}",
        command_id,
        urlencoding::encode(command_name)
    );
    let title = Translations::log_window_title(language, command_name);

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
    .map_err(|e| Translations::error_create_window(language, &e.to_string()))?;

    Ok(())
}

