import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import styled from "styled-components";
import "./App.css";

// ==================== 类型定义 ====================

interface SystemInfo {
  cpu_usage: number;
  memory_used: number;
  memory_total: number;
  memory_percent: number;
}

interface DiskInfo {
  disk_used: number;
  disk_total: number;
  disk_percent: number;
}

// ==================== 样式组件 ====================

const Container = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 4px 12px;
  display: flex;
  gap: 5px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  z-index: 1000;
  align-items: center;
  justify-content: flex-start;
`;

const MonitorCard = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  margin: 0;
`;

const CardTitle = styled.span`
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: #666;

  @media (prefers-color-scheme: dark) {
    color: #aaa;
  }
`;

const ValueDisplay = styled.span<{ $percent: number }>`
  font-weight: 600;
  font-size: 12px;
  color: ${(props) => {
    if (props.$percent < 60) return "#1861ff";
    if (props.$percent < 80) return "#faad14";
    return "#ff4d4f";
  }};
`;

const Separator = styled.span`
  color: #d0d0d0;
  font-size: 12px;
  user-select: none;

  @media (prefers-color-scheme: dark) {
    color: #4a4a4a;
  }
`;

const DetailText = styled.span`
  font-size: 12px;
  color: #999;
  margin-left: 4px;

  @media (prefers-color-scheme: dark) {
    color: #777;
  }
`;

// ==================== 工具函数 ====================

/**
 * 将字节转换为 GB，保留两位小数
 */
const bytesToGB = (bytes: number): string => {
  return (bytes / 1024 ** 3).toFixed(1);
};

// ==================== 主组件 ====================

function App() {
  // 系统信息状态（CPU + 内存）
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // 磁盘信息状态
  const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);

  // 获取系统信息（CPU + 内存）
  const fetchSystemInfo = async () => {
    try {
      const info = await invoke<SystemInfo>("get_system_info");
      setSystemInfo(info);
    } catch (error) {
      console.error(`获取系统信息失败: ${error}`);
    }
  };

  // 获取磁盘信息
  const fetchDiskInfo = async () => {
    try {
      const info = await invoke<DiskInfo>("get_disk_info");
      setDiskInfo(info);
    } catch (error) {
      console.error(`获取磁盘信息失败: ${error}`);
    }
  };

  // 高频更新：CPU 和内存（1Hz = 1000ms）
  useEffect(() => {
    // 立即获取一次
    fetchSystemInfo();

    // 设置定时器，每 1000ms 获取一次（1Hz）
    const interval = setInterval(() => {
      fetchSystemInfo();
    }, 1500);

    // 清理定时器
    return () => clearInterval(interval);
  }, []);

  // 低频更新：磁盘（每分钟 = 60000ms）
  useEffect(() => {
    // 立即获取一次
    fetchDiskInfo();

    // 设置定时器，每 60000ms 获取一次（1分钟）
    const interval = setInterval(() => {
      fetchDiskInfo();
    }, 60000);

    // 清理定时器
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      {/* CPU 监控 */}
      <MonitorCard>
        <CardTitle>CPU:</CardTitle>
        {systemInfo !== null ? (
          <ValueDisplay $percent={systemInfo.cpu_usage}>
            {systemInfo.cpu_usage.toFixed(1)}%
          </ValueDisplay>
        ) : (
          <ValueDisplay $percent={0}>--</ValueDisplay>
        )}
      </MonitorCard>

      <Separator>|</Separator>

      {/* 内存监控 */}
      <MonitorCard>
        <CardTitle>MEM:</CardTitle>
        {systemInfo !== null ? (
          <>
            <ValueDisplay $percent={systemInfo.memory_percent}>
              {systemInfo.memory_percent.toFixed(1)}%
            </ValueDisplay>
            <DetailText>
              ({bytesToGB(systemInfo.memory_used)} /{" "}
              {bytesToGB(systemInfo.memory_total)} GB)
            </DetailText>
          </>
        ) : (
          <ValueDisplay $percent={0}>--</ValueDisplay>
        )}
      </MonitorCard>

      {/* 磁盘监控 */}
      {/* <MonitorCard>
        <CardTitle>磁盘:</CardTitle>
        {diskInfo !== null ? (
          <>
            <ValueDisplay $percent={diskInfo.disk_percent}>
              {diskInfo.disk_percent.toFixed(1)}%
            </ValueDisplay>
            <DetailText>
              ({bytesToGB(diskInfo.disk_used)} / {bytesToGB(diskInfo.disk_total)} GB)
            </DetailText>
          </>
        ) : (
          <ValueDisplay $percent={0}>--</ValueDisplay>
        )}
      </MonitorCard> */}
    </Container>
  );
}

export default App;
