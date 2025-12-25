import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import styled from "styled-components";
import { Button, Modal, message, Empty } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { commandExecutionApi } from "../api/database";

// ==================== 样式组件 ====================

const LogContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #d4d4d4;
`;

const LogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
`;

const LogTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #d4d4d4;
`;

const LogContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
`;

const LogLine = styled.div<{ $isError?: boolean }>`
  margin-bottom: 4px;
  color: ${(props) => (props.$isError ? "#f48771" : "#d4d4d4")};
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
`;

const EmptyContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

// ==================== 日志行数据接口 ====================

interface LogLine {
  command_id: number;
  line: string;
  stream: string;
}

// ==================== 主组件 ====================

function CommandLog() {
  const { t } = useTranslation();
  const { commandId } = useParams<{ commandId: string }>();
  const [searchParams] = useSearchParams();
  const commandName = searchParams.get("name") || "Unknown";
  
  const [logs, setLogs] = useState<string[]>([]);
  const logContentRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // 加载历史日志
  useEffect(() => {
    const loadLogs = async () => {
      if (commandId) {
        try {
          const historicalLogs = await commandExecutionApi.getLogs(parseInt(commandId));
          setLogs(historicalLogs);
        } catch (error) {
          console.error("加载日志失败:", error);
        }
      }
    };

    loadLogs();
  }, [commandId]);

  // 监听实时日志更新
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      unlistenFn = await listen<LogLine>("command-log-update", (event) => {
        const logLine = event.payload;
        if (commandId && logLine.command_id === parseInt(commandId)) {
          const formattedLine = `[${logLine.stream}] ${logLine.line}`;
          setLogs((prev) => [...prev, formattedLine]);
        }
      });
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [commandId]);

  // 自动滚动到底部
  useEffect(() => {
    if (shouldAutoScrollRef.current && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [logs]);

  // 处理滚动事件，检测用户是否手动滚动
  const handleScroll = () => {
    if (logContentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContentRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldAutoScrollRef.current = isAtBottom;
    }
  };

  // 清空日志
  const handleClearLogs = () => {
    Modal.confirm({
      title: t("pages.commandLog.clearLogsConfirm"),
      onOk: async () => {
        try {
          if (commandId) {
            await commandExecutionApi.clearLogs(parseInt(commandId));
            setLogs([]);
            message.success(t("pages.commandLog.clearSuccess"));
          }
        } catch (error) {
          console.error("清空日志失败:", error);
          message.error(t("pages.commandLog.clearFailed"));
        }
      },
    });
  };

  // 判断是否是错误日志
  const isErrorLog = (log: string) => {
    return log.startsWith("[stderr]");
  };

  return (
    <LogContainer>
      <LogHeader>
        <LogTitle>{t("pages.commandLog.title")} - {commandName}</LogTitle>
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={handleClearLogs}
          title={t("pages.commandLog.clearLogs")}
          style={{ color: "#d4d4d4" }}
        >
          {t("pages.commandLog.clearLogs")}
        </Button>
      </LogHeader>
      <LogContent ref={logContentRef} onScroll={handleScroll}>
        {logs.length === 0 ? (
          <EmptyContainer>
            <Empty
              description={t("pages.commandLog.noLogs")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ color: "#888" }}
            />
          </EmptyContainer>
        ) : (
          logs.map((log, index) => (
            <LogLine key={index} $isError={isErrorLog(log)}>
              {log}
            </LogLine>
          ))
        )}
      </LogContent>
    </LogContainer>
  );
}

export default CommandLog;

