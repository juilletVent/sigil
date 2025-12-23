import { Button } from "antd";
import {
  PlusOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { AppRoutes } from "../../constants/routes";
import { ToolBarContainer, LeftActions, RightActions } from "./styles";

interface ToolBarProps {
  onAddCommand?: () => void;
  onSort?: () => void;
  onSettings?: () => void;
}

function ToolBar({ onAddCommand, onSort, onSettings }: ToolBarProps) {
  const navigate = useNavigate();

  const handleInfo = () => {
    navigate(AppRoutes.ABOUT);
  };

  return (
    <ToolBarContainer>
      <LeftActions>
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={onAddCommand}
          title="添加命令"
        />
      </LeftActions>
      <RightActions>
        <Button
          type="text"
          icon={<UnorderedListOutlined />}
          onClick={onSort}
          title="排序"
        />
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={onSettings}
          title="设置"
        />
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={handleInfo}
          title="信息"
        />
      </RightActions>
    </ToolBarContainer>
  );
}

export default ToolBar;

