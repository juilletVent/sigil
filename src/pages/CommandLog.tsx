import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import styled from "styled-components";
import { Button, message, Empty } from "antd";
import {
  DeleteOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
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
  justify-content: flex-end;
  padding: 4px 8px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LogContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
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

  .ant-empty-description {
    color: #d4d4d4 !important;
  }

  .ant-empty-image {
    opacity: 0.6;
  }
`;

const StyledEmpty = styled(Empty)`
  .ant-empty-description {
    color: #d4d4d4 !important;
  }
`;

// ==================== 日志行数据接口 ====================

interface LogLine {
  command_id: number;
  line: string;
  stream: string;
}

// ==================== 主组件 ====================

function CommandLog() {
  const { t, i18n } = useTranslation();
  const { commandId } = useParams<{ commandId: string }>();
  const [searchParams] = useSearchParams();
  const commandName = searchParams.get("name") || t("pages.commandLog.unknownCommand");

  const [logs, setLogs] = useState<string[]>([]);
  const logContentRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const wasAtBottomRef = useRef(true);

  // 监听语言变化事件（从其他窗口广播）
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let cancelled = false;

    const unlistenPromise = listen<string>("language-changed", async (event) => {
      const newLanguage = event.payload;
      i18n.changeLanguage(newLanguage);
    }).then((fn) => {
      unlistenFn = fn;
      if (cancelled) {
        fn();
      }
      return fn;
    });

    return () => {
      cancelled = true;
      if (unlistenFn) {
        unlistenFn();
      } else {
        unlistenPromise.then((fn) => fn());
      }
    };
  }, [i18n]);

  // 监听语言变化，更新窗口标题
  useEffect(() => {
    const updateWindowTitle = async () => {
      if (commandId && commandName) {
        try {
          await invoke("update_log_window_title", {
            commandId: parseInt(commandId),
            commandName: commandName,
          });
        } catch (error) {
          console.error("更新窗口标题失败:", error);
        }
      }
    };

    updateWindowTitle();
  }, [commandId, commandName, i18n.language]);

  // 判断是否在底部（使用5px阈值，更精确）
  const isAtBottom = (element: HTMLDivElement): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    return scrollHeight - scrollTop - clientHeight <= 5;
  };

  // 判断是否需要处理滚动（日志不足一页时不处理）
  const shouldHandleScroll = (element: HTMLDivElement): boolean => {
    const { scrollHeight, clientHeight } = element;
    return scrollHeight > clientHeight;
  };

  // 加载历史日志
  useEffect(() => {
    const loadLogs = async () => {
      if (commandId) {
        try {
          const historicalLogs = await commandExecutionApi.getLogs(
            parseInt(commandId)
          );
          setLogs(historicalLogs);
          // 初始加载后，默认滚动到底部
          wasAtBottomRef.current = true;
        } catch (error) {
          console.error(t("pages.commandLog.loadLogsFailed"), error);
        }
      }
    };

    loadLogs();
  }, [commandId]);

  // 监听实时日志更新
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let cancelled = false;

    const unlistenPromise = listen<LogLine>("command-log-update", (event) => {
      const logLine = event.payload;
      if (commandId && logLine.command_id === parseInt(commandId)) {
        if (logContentRef.current) {
          wasAtBottomRef.current = isAtBottom(logContentRef.current);
        }
        setLogs((prev) => [...prev, logLine.line]);
      }
    }).then((fn) => {
      unlistenFn = fn;
      if (cancelled) {
        fn();
      }
      return fn;
    });

    return () => {
      cancelled = true;
      if (unlistenFn) {
        unlistenFn();
      } else {
        unlistenPromise.then((fn) => fn());
      }
    };
  }, [commandId]);

  // 自动滚动到底部
  useEffect(() => {
    if (logContentRef.current) {
      // 使用双重 requestAnimationFrame 确保在 DOM 完全更新后再检查滚动位置
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (logContentRef.current) {
            // 如果日志不足一页，不处理
            if (!shouldHandleScroll(logContentRef.current)) {
              return;
            }

            // 如果更新前在底部，则滚动到底部
            if (wasAtBottomRef.current) {
              logContentRef.current.scrollTop =
                logContentRef.current.scrollHeight;
            }
          }
        });
      });
    }
  }, [logs]);

  // 处理滚动事件，检测用户是否手动滚动
  const handleScroll = () => {
    if (logContentRef.current) {
      const atBottom = isAtBottom(logContentRef.current);
      shouldAutoScrollRef.current = atBottom;
      wasAtBottomRef.current = atBottom;
    }
  };

  // 平滑滚动函数
  const smoothScrollTo = (targetScrollTop: number, onComplete?: () => void) => {
    if (!logContentRef.current) return;

    const element = logContentRef.current;
    const startScrollTop = element.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const duration = 1000; // 1秒
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用缓动函数（easeInOutCubic）
      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const easedProgress = easeInOutCubic(progress);
      element.scrollTop = startScrollTop + distance * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else if (onComplete) {
        onComplete();
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // 滚动到顶部
  const handleScrollToTop = () => {
    if (logContentRef.current) {
      smoothScrollTo(0, () => {
        wasAtBottomRef.current = false;
      });
    }
  };

  // 滚动到底部
  const handleScrollToBottom = () => {
    if (logContentRef.current) {
      const targetScrollTop = logContentRef.current.scrollHeight;
      smoothScrollTo(targetScrollTop, () => {
        wasAtBottomRef.current = true;
      });
    }
  };

  // 清空日志
  const handleClearLogs = () => {
    (async () => {
      try {
        if (commandId) {
          await commandExecutionApi.clearLogs(parseInt(commandId));
          setLogs([]);
          message.success(t("pages.commandLog.clearSuccess"));
        }
      } catch (error) {
        console.error(t("pages.commandLog.clearFailed"), error);
        message.error(t("pages.commandLog.clearFailed"));
      }
    })();
  };

  // 判断是否是错误日志
  const isErrorLog = (log: string) => {
    return log.startsWith("[stderr]");
  };

  return (
    <LogContainer>
      <LogHeader>
        <ButtonGroup>
          <Button
            type="text"
            icon={<VerticalAlignTopOutlined />}
            onClick={handleScrollToTop}
            title={t("pages.commandLog.scrollToTop")}
            style={{ color: "#d4d4d4" }}
          />
          <Button
            type="text"
            icon={<VerticalAlignBottomOutlined />}
            onClick={handleScrollToBottom}
            title={t("pages.commandLog.scrollToBottom")}
            style={{ color: "#d4d4d4" }}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={handleClearLogs}
            title={t("pages.commandLog.clearLogs")}
            style={{ color: "#d4d4d4" }}
          />
        </ButtonGroup>
      </LogHeader>
      <LogContent ref={logContentRef} onScroll={handleScroll}>
        {logs.length === 0 ? (
          <EmptyContainer>
            <StyledEmpty
              description={t("pages.commandLog.noLogs")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
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
