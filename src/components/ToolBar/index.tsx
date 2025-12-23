import { Button } from "antd";
import {
  PlusOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AppRoutes } from "../../constants/routes";
import { ToolBarContainer, LeftActions, RightActions } from "./styles";

interface ToolBarProps {
  onAddCommand?: () => void;
  onSort?: () => void;
  onSettings?: () => void;
}

function ToolBar({ onAddCommand, onSort, onSettings }: ToolBarProps) {
  const { t } = useTranslation();
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
          title={t("components.toolbar.addCommand")}
        />
      </LeftActions>
      <RightActions>
        <Button
          type="text"
          icon={<UnorderedListOutlined />}
          onClick={onSort}
          title={t("components.toolbar.sort")}
        />
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={onSettings}
          title={t("components.toolbar.settings")}
        />
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={handleInfo}
          title={t("components.toolbar.info")}
        />
      </RightActions>
    </ToolBarContainer>
  );
}

export default ToolBar;

