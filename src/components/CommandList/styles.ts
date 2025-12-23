import styled from "styled-components";

export const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

export const CommandItemContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

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

export const PlayButton = styled.button`
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
  color: #666;
  transition: color 0.2s;

  &:hover {
    color: #1890ff;
  }

  @media (prefers-color-scheme: dark) {
    color: #aaa;

    &:hover {
      color: #40a9ff;
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

  @media (prefers-color-scheme: dark) {
    color: #ddd;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;

  @media (prefers-color-scheme: dark) {
    color: #666;
  }
`;

