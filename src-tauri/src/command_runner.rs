use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, EventTarget, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
use windows::core::PCWSTR;
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{CloseHandle, HANDLE};
#[cfg(target_os = "windows")]
use windows::Win32::System::JobObjects::{
    AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
    SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
};
#[cfg(target_os = "windows")]
use windows::Win32::System::Threading::{OpenProcess, PROCESS_SET_QUOTA, PROCESS_TERMINATE};

// ==================== 数据结构定义 ====================

/// 命令执行状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CommandStatus {
    Idle,    // 空闲状态
    Running, // 正在运行
    Success, // 执行成功
    Failed,  // 执行失败
    Stopped, // 被停止
}

/// 命令运行时状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandState {
    pub command_id: i64,
    pub status: CommandStatus,
    pub pid: Option<u32>,
    pub start_time: Option<String>,
    pub exit_code: Option<i32>,
}

/// 日志行数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogLine {
    pub command_id: i64,
    pub line: String,
    pub stream: String, // "stdout" or "stderr"
}

/// 命令执行参数
#[derive(Debug, Clone)]
pub struct ExecuteCommandParams {
    pub command_id: i64,
    pub command_name: String,
    pub command: String,
    pub sudo: bool,
    pub working_directory: Option<String>,
    pub notification_when_finished: bool,
}

// ==================== Windows Job Object 包装 ====================

#[cfg(target_os = "windows")]
struct JobHandle(HANDLE);

#[cfg(target_os = "windows")]
impl Drop for JobHandle {
    fn drop(&mut self) {
        unsafe {
            let _ = CloseHandle(self.0);
        }
    }
}

#[cfg(target_os = "windows")]
unsafe impl Send for JobHandle {}
#[cfg(target_os = "windows")]
unsafe impl Sync for JobHandle {}

// ==================== Windows 权限检测 ====================

/// 检测当前进程是否以管理员权限运行
/// 使用简单的方法：尝试执行一个需要管理员权限的命令
#[cfg(target_os = "windows")]
fn is_elevated() -> bool {
    // 使用 net session 命令来检查管理员权限
    // 如果命令成功执行（退出码为 0），说明有管理员权限
    let output = std::process::Command::new("net")
        .args(&["session"])
        .output();
    
    match output {
        Ok(result) => {
            // net session 在非管理员权限下会返回非零退出码
            result.status.success()
        }
        Err(_) => {
            // 如果命令执行失败，假设没有管理员权限
            false
        }
    }
}

// ==================== 命令运行器 ====================

/// 命令运行信息（包含执行参数）
#[derive(Debug, Clone)]
struct CommandInfo {
    params: ExecuteCommandParams,
    #[cfg(target_os = "windows")]
    temp_files: Option<(PathBuf, PathBuf, PathBuf, PathBuf)>, // (batch_file, output_file, error_file, exit_file)
}

/// 命令运行器 - 管理所有命令的执行状态
pub struct CommandRunner {
    states: Arc<Mutex<HashMap<i64, CommandState>>>,
    processes: Arc<Mutex<HashMap<i64, Child>>>,
    command_infos: Arc<Mutex<HashMap<i64, CommandInfo>>>,
    logs: Arc<Mutex<HashMap<i64, Vec<String>>>>,
    #[cfg(target_os = "windows")]
    job_objects: Arc<Mutex<HashMap<i64, JobHandle>>>,
    app_handle: AppHandle,
}

impl CommandRunner {
    /// 创建新的命令运行器
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            states: Arc::new(Mutex::new(HashMap::new())),
            processes: Arc::new(Mutex::new(HashMap::new())),
            command_infos: Arc::new(Mutex::new(HashMap::new())),
            logs: Arc::new(Mutex::new(HashMap::new())),
            #[cfg(target_os = "windows")]
            job_objects: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        }
    }

    /// 获取命令状态
    pub fn get_state(&self, command_id: i64) -> Option<CommandState> {
        let states = self.states.lock().unwrap();
        states.get(&command_id).cloned()
    }

    /// 获取所有命令状态
    pub fn get_all_states(&self) -> HashMap<i64, CommandState> {
        let states = self.states.lock().unwrap();
        states.clone()
    }

    /// 更新命令状态
    fn update_state(
        &self,
        command_id: i64,
        status: CommandStatus,
        pid: Option<u32>,
        exit_code: Option<i32>,
    ) {
        let mut states = self.states.lock().unwrap();

        let start_time = if status == CommandStatus::Running {
            Some(chrono::Local::now().to_rfc3339())
        } else {
            states.get(&command_id).and_then(|s| s.start_time.clone())
        };

        let state = CommandState {
            command_id,
            status: status.clone(),
            pid,
            start_time,
            exit_code,
        };

        states.insert(command_id, state.clone());

        // 发送状态变化事件到前端（广播到所有窗口）
        let _ = self.app_handle.emit_to(EventTarget::Any, "command-status-changed", state);
    }

    /// 执行命令
    pub fn execute(&self, params: ExecuteCommandParams) -> Result<(), String> {
        // 检查命令是否已在运行
        {
            let states = self.states.lock().unwrap();
            if let Some(state) = states.get(&params.command_id) {
                if state.status == CommandStatus::Running {
                    return Err("命令正在运行中".to_string());
                }
            }
        }

        // 构建命令
        // Windows UAC 提升需要使用临时批处理文件来捕获输出
        // 但如果当前进程已有管理员权限，则不需要临时文件
        #[cfg(target_os = "windows")]
        let (temp_batch_file, temp_output_file, temp_error_file, temp_exit_file) = if params.sudo && !is_elevated() {
            // 创建临时文件用于 UAC 提升执行
            let temp_dir = std::env::temp_dir();
            let file_prefix = format!("sigil_cmd_{}", params.command_id);
            
            let batch_file = temp_dir.join(format!("{}.bat", file_prefix));
            let output_file = temp_dir.join(format!("{}_stdout.txt", file_prefix));
            let error_file = temp_dir.join(format!("{}_stderr.txt", file_prefix));
            let exit_file = temp_dir.join(format!("{}_exit.txt", file_prefix));
            
            // 创建批处理文件，将命令输出重定向到临时文件
            let working_dir = params.working_directory.as_ref()
                .map(|wd| wd.replace('"', "\""))
                .unwrap_or_else(|| "%CD%".to_string());
            
            let batch_content = format!(
                "@echo off\n\
                cd /d \"{}\"\n\
                ({}) > \"{}\" 2> \"{}\"\n\
                echo %ERRORLEVEL% > \"{}\"",
                working_dir,
                params.command.replace('"', "\""),
                output_file.to_string_lossy().replace('"', "\""),
                error_file.to_string_lossy().replace('"', "\""),
                exit_file.to_string_lossy().replace('"', "\"")
            );
            
            std::fs::write(&batch_file, batch_content)
                .map_err(|e| {
                    log::error!("创建临时批处理文件失败: {}, 路径: {:?}", e, batch_file);
                    format!("创建临时批处理文件失败: {}", e)
                })?;
            
            (Some(batch_file), Some(output_file), Some(error_file), Some(exit_file))
        } else {
            (None, None, None, None)
        };
        
        let mut cmd = if cfg!(target_os = "windows") {
            if params.sudo {
                // 检测当前进程是否已有管理员权限
                let is_elevated = is_elevated();
                
                if is_elevated {
                    // 如果已有管理员权限，直接执行命令（不需要 UAC 提升和临时文件）
                    let mut c = Command::new("cmd");
                    c.args(["/C", &params.command]);
                    // Windows 进程创建标志：
                    // CREATE_NEW_PROCESS_GROUP = 0x00000200
                    // CREATE_NO_WINDOW = 0x08000000
                    c.creation_flags(0x00000200 | 0x08000000);
                    c
                } else {
                    // 没有管理员权限，需要使用 UAC 提升
                    // 使用 PowerShell 的 -WindowStyle Hidden 来隐藏窗口
                    let batch_file = temp_batch_file.as_ref().unwrap();
                    
                    // 获取完整路径（避免短路径问题）
                    let batch_file_path = match batch_file.canonicalize() {
                        Ok(path) => path,
                        Err(_) => {
                            // 如果无法规范化，使用原始路径
                            batch_file.clone()
                        }
                    };
                    
                    let batch_file_str = batch_file_path.to_string_lossy();
                    
                    let mut c = Command::new("powershell");
                    // 使用 -WindowStyle Hidden 来隐藏 PowerShell 窗口
                    let ps_command = format!(
                        "Start-Process -FilePath \"{}\" -Verb RunAs -Wait -WindowStyle Hidden",
                        batch_file_str.replace("\"", "\"\"")
                    );
                    
                    c.args([
                        "-NoProfile",
                        "-NonInteractive",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-Command",
                        &ps_command,
                    ]);
                    // Windows 进程创建标志：
                    // CREATE_NEW_PROCESS_GROUP = 0x00000200
                    // CREATE_NO_WINDOW = 0x08000000
                    c.creation_flags(0x00000200 | 0x08000000);
                    c
                }
            } else {
                // Windows: 普通执行，使用 cmd /C
                let mut c = Command::new("cmd");
                c.args(["/C", &params.command]);
                // Windows 进程创建标志：
                // CREATE_NEW_PROCESS_GROUP = 0x00000200
                // CREATE_NO_WINDOW = 0x08000000
                c.creation_flags(0x00000200 | 0x08000000);
                c
            }
        } else {
            // Linux/macOS: 根据 sudo 标志决定是否使用 sudo
            if params.sudo {
                let mut c = Command::new("sudo");
                c.args(["-S", "sh", "-c", &params.command]);
                // sudo -S 表示从标准输入读取密码
                // 但这里我们不提供密码输入，让系统提示用户输入
                c
            } else {
                let mut c = Command::new("sh");
                c.args(["-c", &params.command]);
                c
            }
        };

        // 设置工作目录
        // Windows UAC 提升时（且没有管理员权限），工作目录已在批处理文件中设置，不需要在这里设置
        // 但如果已有管理员权限，直接执行命令时，需要设置工作目录
        #[cfg(target_os = "windows")]
        let should_set_working_dir = !(params.sudo && !is_elevated());
        #[cfg(not(target_os = "windows"))]
        let should_set_working_dir = true;
        
        if should_set_working_dir {
            if let Some(wd) = &params.working_directory {
                // 规范化路径，处理 Windows 反斜线和相对路径
                let path = PathBuf::from(wd);

                // 验证路径是否存在
                if !path.exists() {
                    return Err(format!("工作目录不存在: {}", wd));
                }

                if !path.is_dir() {
                    return Err(format!("工作目录路径不是目录: {}", wd));
                }

                cmd.current_dir(&path);
            }
        } else {
            // Windows UAC 提升时，仍然需要验证工作目录存在（批处理文件中会使用）
            if let Some(wd) = &params.working_directory {
                let path = PathBuf::from(wd);
                if !path.exists() {
                    return Err(format!("工作目录不存在: {}", wd));
                }
                if !path.is_dir() {
                    return Err(format!("工作目录路径不是目录: {}", wd));
                }
            }
        }

        // 配置输入输出
        // Windows UAC 提升时（且没有管理员权限），输出被重定向到临时文件，不需要管道
        #[cfg(target_os = "windows")]
        let is_using_temp_files = params.sudo && !is_elevated();
        #[cfg(not(target_os = "windows"))]
        let is_using_temp_files = false;
        
        if !is_using_temp_files {
            cmd.stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .stdin(Stdio::null());
        } else {
            // UAC 提升时，输出重定向到临时文件，但 PowerShell 的输出仍需要捕获
            cmd.stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .stdin(Stdio::null());
        }

        // 启动进程
        let mut child = match cmd.spawn() {
            Ok(child) => child,
            Err(e) => {
                log::error!("启动命令失败: {}", e);
                return Err(format!("启动命令失败: {}", e));
            }
        };

        let pid = child.id();

        // 获取 stdout 和 stderr 句柄用于日志收集
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        // Windows: 创建 Job Object 并将进程添加到其中
        #[cfg(target_os = "windows")]
        {
            unsafe {
                // 创建 Job Object
                let job = match CreateJobObjectW(None, PCWSTR::null()) {
                    Ok(handle) => handle,
                    Err(e) => {
                        log::error!("创建 Job Object 失败: {:?}", e);
                        let _ = child.kill();
                        return Err(format!("创建 Job Object 失败: {:?}", e));
                    }
                };

                // 设置 Job 属性：当 Job 句柄关闭时，终止所有关联的进程
                let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
                info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

                if let Err(e) = SetInformationJobObject(
                    job,
                    JobObjectExtendedLimitInformation,
                    &info as *const _ as *const std::ffi::c_void,
                    std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                ) {
                    let _ = CloseHandle(job);
                    let _ = child.kill();
                    return Err(format!("设置 Job Object 信息失败: {:?}", e));
                }

                // 打开进程句柄
                let process_handle = match OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, false, pid) {
                    Ok(handle) => handle,
                    Err(e) => {
                        let _ = CloseHandle(job);
                        let _ = child.kill();
                        return Err(format!("打开进程句柄失败: {:?}", e));
                    }
                };

                // 将进程添加到 Job
                let assign_result = AssignProcessToJobObject(job, process_handle);
                let _ = CloseHandle(process_handle);

                if let Err(e) = assign_result {
                    let _ = CloseHandle(job);
                    let _ = child.kill();
                    return Err(format!("将进程添加到 Job Object 失败: {:?}", e));
                }

                // 保存 Job Object 句柄
                let mut jobs = self.job_objects.lock().unwrap();
                jobs.insert(params.command_id, JobHandle(job));
            }
        }

        // 更新状态为运行中
        self.update_state(params.command_id, CommandStatus::Running, Some(pid), None);

        // 保存命令信息
        {
            let mut infos = self.command_infos.lock().unwrap();
            #[cfg(target_os = "windows")]
            {
                let temp_files = if params.sudo {
                    temp_batch_file.as_ref().and_then(|bf| {
                        temp_output_file.as_ref().and_then(|of| {
                            temp_error_file.as_ref().and_then(|ef| {
                                temp_exit_file.as_ref().map(|xf| {
                                    (bf.clone(), of.clone(), ef.clone(), xf.clone())
                                })
                            })
                        })
                    })
                } else {
                    None
                };
                infos.insert(params.command_id, CommandInfo {
                    params: params.clone(),
                    temp_files,
                });
            }
            #[cfg(not(target_os = "windows"))]
            {
                infos.insert(params.command_id, CommandInfo { params: params.clone() });
            }
        }

        // 初始化日志缓冲
        {
            let mut logs = self.logs.lock().unwrap();
            logs.insert(params.command_id, Vec::new());
        }

        // 启动日志读取线程（stdout）
        // Windows UAC 提升时，输出被重定向到临时文件，不需要读取 stdout/stderr
        #[cfg(target_os = "windows")]
        let is_using_temp_files = params.sudo;
        #[cfg(not(target_os = "windows"))]
        let is_using_temp_files = false;
        
        if !is_using_temp_files {
            if let Some(stdout) = stdout {
                let command_id = params.command_id;
                let runner = self.clone_for_thread();
                std::thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            runner.append_log(command_id, line, "stdout");
                        }
                    }
                });
            }

            // 启动日志读取线程（stderr）
            if let Some(stderr) = stderr {
                let command_id = params.command_id;
                let runner = self.clone_for_thread();
                std::thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            runner.append_log(command_id, line, "stderr");
                        }
                    }
                });
            }
        } else {
            // Windows UAC 提升时，仍然需要读取 PowerShell 的输出
            if let Some(stderr) = stderr {
                let command_id = params.command_id;
                let runner = self.clone_for_thread();
                std::thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            if !line.trim().is_empty() {
                                runner.append_log(command_id, format!("[PowerShell] {}", line), "stderr");
                            }
                        }
                    }
                });
            }
        }

        // 保存进程句柄
        {
            let mut processes = self.processes.lock().unwrap();
            processes.insert(params.command_id, child);
        }

        // 启动后台线程监控进程
        let command_id = params.command_id;
        let runner = self.clone_for_thread();

        std::thread::spawn(move || {
            runner.monitor_process(command_id);
        });

        Ok(())
    }

    /// 停止命令
    pub fn stop(&self, command_id: i64) -> Result<(), String> {
        // 先更新状态为 Stopped，防止监控线程覆盖状态
        self.update_state(command_id, CommandStatus::Stopped, None, None);

        // 获取命令信息（用于清理临时文件）
        #[cfg(target_os = "windows")]
        let temp_files = {
            let infos = self.command_infos.lock().unwrap();
            infos.get(&command_id).and_then(|info| info.temp_files.clone())
        };

        // 清理命令信息
        {
            let mut infos = self.command_infos.lock().unwrap();
            infos.remove(&command_id);
        }

        // Windows UAC 提升：清理临时文件（如果存在）
        #[cfg(target_os = "windows")]
        if let Some((batch_file, output_file, error_file, exit_file)) = temp_files {
            let _ = std::fs::remove_file(batch_file);
            let _ = std::fs::remove_file(output_file);
            let _ = std::fs::remove_file(error_file);
            let _ = std::fs::remove_file(exit_file);
        }

        // 清理日志数据
        {
            let mut logs = self.logs.lock().unwrap();
            logs.remove(&command_id);
        }

        // 关闭日志窗口（如果存在）
        let window_label = format!("log-{}", command_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            let _ = window.close();
        }

        // Windows: 移除 Job Object，这会自动终止所有关联的进程
        #[cfg(target_os = "windows")]
        let job_existed = {
            let mut jobs = self.job_objects.lock().unwrap();
            if let Some(job) = jobs.remove(&command_id) {
                drop(job); // 触发 Drop trait，关闭 Job Object 句柄
                true
            } else {
                false
            }
        };

        // 移除进程句柄
        let mut processes = self.processes.lock().unwrap();
        if let Some(mut child) = processes.remove(&command_id) {
            drop(processes); // 释放锁

            // 尝试 kill 原始进程（通常 Job Object 已经终止了）
            #[cfg(target_os = "windows")]
            {
                let _ = child.kill();
            }

            #[cfg(not(target_os = "windows"))]
            {
                let _ = child.kill();
            }

            // 等待进程完全结束
            let _ = child.wait();

            Ok(())
        } else {
            // 如果找不到进程句柄，但 Job Object 存在过，说明进程已经被终止了
            #[cfg(target_os = "windows")]
            if job_existed {
                return Ok(());
            }

            Err("命令未在运行".to_string())
        }
    }

    /// 监控进程状态
    fn monitor_process(&self, command_id: i64) {
        // 等待进程结束
        let exit_status = {
            let mut processes = self.processes.lock().unwrap();
            if let Some(child) = processes.get_mut(&command_id) {
                child.wait()
            } else {
                return;
            }
        };

        // 检查当前状态是否已经是 Stopped（被手动停止）
        {
            let states = self.states.lock().unwrap();
            if let Some(state) = states.get(&command_id) {
                if state.status == CommandStatus::Stopped {
                    // 如果已经被手动停止，不要覆盖状态
                    return;
                }
            }
        }

        // 获取命令信息（用于通知和临时文件清理）
        let command_info = {
            let infos = self.command_infos.lock().unwrap();
            infos.get(&command_id).cloned()
        };

        // Windows UAC 提升：从临时文件读取输出
        #[cfg(target_os = "windows")]
        if let Some(ref info) = command_info {
            if let Some(ref temp_files) = info.temp_files {
                let (_, output_file, error_file, _exit_file) = temp_files;
                
                // 等待一下，确保文件写入完成
                std::thread::sleep(std::time::Duration::from_millis(100));
                
                // 读取 stdout
                if let Ok(content) = std::fs::read_to_string(output_file) {
                    for line in content.lines() {
                        self.append_log(command_id, line.to_string(), "stdout");
                    }
                }
                
                // 读取 stderr
                if let Ok(content) = std::fs::read_to_string(error_file) {
                    for line in content.lines() {
                        self.append_log(command_id, line.to_string(), "stderr");
                    }
                }
            }
        }

        // 移除进程句柄
        {
            let mut processes = self.processes.lock().unwrap();
            processes.remove(&command_id);
        }

        // 更新状态并发送通知
        let (final_status, exit_code) = match exit_status {
            Ok(status) => {
                let exit_code = status.code();
                
                // Windows UAC 提升：从临时文件读取退出码
                #[cfg(target_os = "windows")]
                let exit_code = if let Some(ref info) = command_info {
                    if let Some(ref temp_files) = info.temp_files {
                        let (_, _, _, exit_file) = temp_files;
                        if let Ok(content) = std::fs::read_to_string(exit_file) {
                            content.trim().parse::<i32>().ok().or(exit_code)
                        } else {
                            exit_code
                        }
                    } else {
                        exit_code
                    }
                } else {
                    exit_code
                };
                
                let final_status = if status.success() || exit_code == Some(0) {
                    CommandStatus::Success
                } else {
                    CommandStatus::Failed
                };
                
                (final_status, exit_code)
            }
            Err(e) => {
                log::error!("等待进程失败: {:?}", e);
                (CommandStatus::Failed, None)
            }
        };

        self.update_state(command_id, final_status.clone(), None, exit_code);

        // 如果配置了通知，发送通知
        if let Some(ref info) = command_info {
            if info.params.notification_when_finished {
                self.send_notification(&info.params.command_name, &final_status, exit_code);
            }
        }

        // Windows UAC 提升：清理临时文件
        #[cfg(target_os = "windows")]
        if let Some(ref info) = command_info {
            if let Some(ref temp_files) = info.temp_files {
                let (batch_file, output_file, error_file, exit_file) = temp_files;
                let _ = std::fs::remove_file(batch_file);
                let _ = std::fs::remove_file(output_file);
                let _ = std::fs::remove_file(error_file);
                let _ = std::fs::remove_file(exit_file);
            }
        }

        // 清理命令信息
        {
            let mut infos = self.command_infos.lock().unwrap();
            infos.remove(&command_id);
        }
    }

    /// 发送通知
    fn send_notification(&self, command_name: &str, status: &CommandStatus, exit_code: Option<i32>) {
        use tauri_plugin_notification::NotificationExt;

        let (title, body) = match status {
            CommandStatus::Success => (
                "命令执行成功",
                format!("命令 \"{}\" 已成功完成", command_name),
            ),
            CommandStatus::Failed => {
                let msg = if let Some(code) = exit_code {
                    format!("命令 \"{}\" 执行失败 (退出码: {})", command_name, code)
                } else {
                    format!("命令 \"{}\" 执行失败", command_name)
                };
                ("命令执行失败", msg)
            }
            _ => return, // 其他状态不发送通知
        };

        // 发送通知（忽略错误，避免通知失败影响主流程）
        let _ = self.app_handle
            .notification()
            .builder()
            .title(title)
            .body(body)
            .show();
    }

    /// 克隆用于线程传递
    fn clone_for_thread(&self) -> Self {
        Self {
            states: Arc::clone(&self.states),
            processes: Arc::clone(&self.processes),
            command_infos: Arc::clone(&self.command_infos),
            logs: Arc::clone(&self.logs),
            #[cfg(target_os = "windows")]
            job_objects: Arc::clone(&self.job_objects),
            app_handle: self.app_handle.clone(),
        }
    }

    /// 追加日志行
    fn append_log(&self, command_id: i64, line: String, stream: &str) {
        // 追加到日志缓冲
        {
            let mut logs = self.logs.lock().unwrap();
            if let Some(log_vec) = logs.get_mut(&command_id) {
                let formatted_line = format!("[{}] {}", stream, line);
                log_vec.push(formatted_line);
            }
        }

        // 发送日志更新事件（广播到所有窗口）
        let log_line = LogLine {
            command_id,
            line,
            stream: stream.to_string(),
        };
        let _ = self.app_handle.emit_to(EventTarget::Any, "command-log-update", log_line);
    }

    /// 获取命令日志
    pub fn get_logs(&self, command_id: i64) -> Vec<String> {
        let logs = self.logs.lock().unwrap();
        logs.get(&command_id).cloned().unwrap_or_default()
    }

    /// 清空命令日志
    pub fn clear_logs(&self, command_id: i64) {
        let mut logs = self.logs.lock().unwrap();
        if let Some(log_vec) = logs.get_mut(&command_id) {
            log_vec.clear();
        }
    }

    /// 检查命令是否有日志
    #[allow(dead_code)]
    pub fn has_logs(&self, command_id: i64) -> bool {
        let logs = self.logs.lock().unwrap();
        logs.get(&command_id).map(|v| !v.is_empty()).unwrap_or(false)
    }
}
