import styled from "styled-components";

export const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

export const CommandItemContainer = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: ${(props) => (props.$isDragging ? 1000 : "auto")};

  &:hover {
    background-color: #f5f5f5;
  }

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
    border-bottom-color: #2a2a2a;

    &:hover {
      background-color: #2a2a2a;
    }
  }
`;

export const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: grab;
  color: #bbb;
  font-size: 14px;
  transition: color 0.2s;

  &:hover {
    color: #666;
  }

  &:active {
    cursor: grabbing;
  }

  @media (prefers-color-scheme: dark) {
    color: #555;

    &:hover {
      color: #999;
    }
  }
`;

export const PlayButton = styled.button<{ $isRunning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-size: 20px;
  color: ${(props) => (props.$isRunning ? "#ff4d4f" : "#666")};
  transition: color 0.2s;

  &:hover {
    color: ${(props) => (props.$isRunning ? "#ff7875" : "#1890ff")};
  }

  @media (prefers-color-scheme: dark) {
    color: ${(props) => (props.$isRunning ? "#ff4d4f" : "#aaa")};

    &:hover {
      color: ${(props) => (props.$isRunning ? "#ff7875" : "#40a9ff")};
    }
  }
`;

export const StatusIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 14px;
  color: #999;

  @media (prefers-color-scheme: dark) {
    color: #777;
  }
`;

export const CommandName = styled.span`
  flex: 1;
  font-size: 14px;
  color: #333;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (prefers-color-scheme: dark) {
    color: #ddd;
  }
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 300px;
`;

