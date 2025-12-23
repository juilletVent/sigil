import { useState } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import StatusBar from "../components/StatusBar";
import ToolBar from "../components/ToolBar";
import CommandList from "../components/CommandList";
import { Command } from "../components/CommandList/CommandItem";
import { AppRoutes } from "../constants/routes";

// ==================== 样式组件 ====================

const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px); /* 减去底部状态栏高度 */
  padding-top: 40px; /* 为固定的顶部导航栏留出空间 */
`;

// ==================== 主组件 ====================

function Home() {
  const navigate = useNavigate();

  // 初始命令数据
  const [commands, setCommands] = useState<Command[]>([
    { id: "1", name: "gpw-test3", isRunning: false },
    { id: "2", name: "xcj-show1", isRunning: false },
  ]);

  // 处理添加命令
  const handleAddCommand = () => {
    navigate(AppRoutes.CONFIG_EDIT);
  };

  // 处理排序
  const handleSort = () => {
    console.log("排序命令");
    // TODO: 实现排序逻辑
  };

  // 处理设置
  const handleSettings = () => {
    navigate(AppRoutes.SYSTEM_CONFIG);
  };

  // 处理播放命令
  const handlePlayCommand = (id: string) => {
    console.log("播放命令:", id);
    // TODO: 实现命令执行逻辑
    setCommands((prev) =>
      prev.map((cmd) =>
        cmd.id === id ? { ...cmd, isRunning: !cmd.isRunning } : cmd
      )
    );
  };

  // 处理编辑命令
  const handleEditCommand = (id: string) => {
    navigate(`${AppRoutes.CONFIG_EDIT}?id=${id}`);
  };

  return (
    <HomeContainer>
      <MainContent>
        <ToolBar
          onAddCommand={handleAddCommand}
          onSort={handleSort}
          onSettings={handleSettings}
        />
        <CommandList
          commands={commands}
          onPlayCommand={handlePlayCommand}
          onEditCommand={handleEditCommand}
        />
      </MainContent>
      <StatusBar />
    </HomeContainer>
  );
}

export default Home;
