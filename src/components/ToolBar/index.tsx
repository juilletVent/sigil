import { Button } from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ImportOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AppRoutes } from "../../constants/routes";
import { ToolBarContainer, LeftActions, RightActions } from "./styles";

interface ToolBarProps {
  onAddCommand?: () => void;
  onSettings?: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

function ToolBar({ onAddCommand, onSettings, onImport, onExport }: ToolBarProps) {
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
        <Button
          type="text"
          icon={<ImportOutlined />}
          onClick={onImport}
          title={t("components.toolbar.import")}
        />
        <Button
          type="text"
          icon={<ExportOutlined />}
          onClick={onExport}
          title={t("components.toolbar.export")}
        />
      </LeftActions>
      <RightActions>
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
