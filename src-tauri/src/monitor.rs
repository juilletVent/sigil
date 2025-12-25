use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::{Disks, System};
use tauri::{AppHandle, Manager};

// ==================== 数据结构定义 ====================

/// 系统信息（CPU + 内存）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_usage: f32,      // CPU 占用百分比
    pub memory_used: u64,    // 内存使用量（字节）
    pub memory_total: u64,   // 内存总量（字节）
    pub memory_percent: f32, // 内存占用百分比
}

/// 磁盘信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub disk_used: u64,    // 磁盘使用量（字节）
    pub disk_total: u64,   // 磁盘总量（字节）
    pub disk_percent: f32, // 磁盘占用百分比
}

// ==================== 监控状态管理 ====================

/// 高频监控状态（CPU + 内存）- 1Hz 更新
pub struct MonitorState {
    pub system_info: Arc<Mutex<SystemInfo>>,
    pub monitoring_thread: Arc<AtomicBool>,
}

impl Default for MonitorState {
    fn default() -> Self {
        Self {
            system_info: Arc::new(Mutex::new(SystemInfo {
                cpu_usage: 0.0,
                memory_used: 0,
                memory_total: 0,
                memory_percent: 0.0,
            })),
            monitoring_thread: Arc::new(AtomicBool::new(false)),
        }
    }
}

/// 低频监控状态（磁盘）- 每分钟更新
pub struct DiskMonitorState {
    pub disk_info: Arc<Mutex<DiskInfo>>,
    pub monitoring_thread: Arc<AtomicBool>,
}

impl Default for DiskMonitorState {
    fn default() -> Self {
        Self {
            disk_info: Arc::new(Mutex::new(DiskInfo {
                disk_used: 0,
                disk_total: 0,
                disk_percent: 0.0,
            })),
            monitoring_thread: Arc::new(AtomicBool::new(false)),
        }
    }
}

// ==================== 后台监控线程 ====================

/// 启动高频监控线程（CPU + 内存）- 1Hz
pub fn start_high_frequency_monitor(app: AppHandle) {
    let state = app.state::<MonitorState>();

    // 如果已经在监控，直接返回
    if state.monitoring_thread.load(Ordering::Relaxed) {
        return;
    }

    state.monitoring_thread.store(true, Ordering::Relaxed);

    let system_info_arc = state.system_info.clone();
    let monitoring_flag = state.monitoring_thread.clone();

    thread::spawn(move || {
        let mut system = System::new_all();

        // 第一次刷新
        system.refresh_all();
        thread::sleep(Duration::from_millis(200));

        while monitoring_flag.load(Ordering::Relaxed) {
            // 刷新 CPU 和内存信息
            system.refresh_cpu();
            system.refresh_memory();

            // 获取 CPU 使用率
            let cpu_usage = system.global_cpu_info().cpu_usage();

            // 获取内存信息
            let memory_used = system.used_memory();
            let memory_total = system.total_memory();
            let memory_percent = if memory_total > 0 {
                (memory_used as f32 / memory_total as f32) * 100.0
            } else {
                0.0
            };

            // 更新共享状态
            if let Ok(mut info) = system_info_arc.lock() {
                info.cpu_usage = cpu_usage;
                info.memory_used = memory_used;
                info.memory_total = memory_total;
                info.memory_percent = memory_percent;
            }

            // 每 1000ms 更新一次（1Hz）
            thread::sleep(Duration::from_millis(1000));
        }
    });
}

/// 启动低频监控线程（磁盘）- 每分钟
pub fn start_low_frequency_monitor(app: AppHandle) {
    let state = app.state::<DiskMonitorState>();

    // 如果已经在监控，直接返回
    if state.monitoring_thread.load(Ordering::Relaxed) {
        return;
    }

    state.monitoring_thread.store(true, Ordering::Relaxed);

    let disk_info_arc = state.disk_info.clone();
    let monitoring_flag = state.monitoring_thread.clone();

    thread::spawn(move || {
        let mut disks = Disks::new_with_refreshed_list();

        while monitoring_flag.load(Ordering::Relaxed) {
            // 刷新磁盘信息
            disks.refresh();

            // 汇总所有磁盘的总量和使用量
            let mut disk_total: u64 = 0;
            let mut disk_used: u64 = 0;

            for disk in disks.list() {
                disk_total += disk.total_space();
                disk_used += disk.total_space() - disk.available_space();
            }

            let disk_percent = if disk_total > 0 {
                (disk_used as f32 / disk_total as f32) * 100.0
            } else {
                0.0
            };

            // 更新共享状态
            if let Ok(mut info) = disk_info_arc.lock() {
                info.disk_used = disk_used;
                info.disk_total = disk_total;
                info.disk_percent = disk_percent;
            }

            // 每 60000ms 更新一次（1分钟）
            thread::sleep(Duration::from_millis(60000));
        }
    });
}

