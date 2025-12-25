import {
  PlayCircleOutlined,
  StopOutlined,
  LinkOutlined,
  HolderOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Dropdown, message, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  CommandItemContainer,
  PlayButton,
  StatusIcon,
  CommandName,
  DragHandle,
} from "./styles";

export interface Command {
  id: string;
  name: string;
  isRunning: boolean;
  url?: string;
  hasLogs?: boolean;
}

interface CommandItemProps {
  command: Command;
  onPlay?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCopy?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewLogs?: (id: string) => void;
}

function CommandItem({
  command,
  onPlay,
  onEdit,
  onCopy,
  onDelete,
  onViewLogs,
}: CommandItemProps) {
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: command.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(command.id);
  };

  const handleItemClick = () => {
    onEdit?.(command.id);
  };

  const handleCopy = () => {
    onCopy?.(command.id);
  };

  const handleDelete = () => {
    onDelete?.(command.id);
  };

  const handleOpenUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (command.url) {
      try {
        await openUrl(command.url);
      } catch (error) {
        console.error("打开链接失败:", error);
        message.error(t("components.commandItem.openUrlFailed"));
      }
    }
  };

  const handleViewLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewLogs?.(command.id);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "copy",
      label: t("components.commandItem.copy"),
      icon: <CopyOutlined />,
      onClick: handleCopy,
    },
    {
      key: "delete",
      label: t("components.commandItem.delete"),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={["contextMenu"]}>
      <CommandItemContainer
        ref={setNodeRef}
        style={style}
        onClick={handleItemClick}
        $isDragging={isDragging}
      >
        <DragHandle {...attributes} {...listeners}>
          <HolderOutlined />
        </DragHandle>
        <PlayButton
          onClick={handlePlay}
          title={
            command.isRunning
              ? t("components.commandItem.stop")
              : t("components.commandItem.run")
          }
          $isRunning={command.isRunning}
        >
          {command.isRunning ? <StopOutlined /> : <PlayCircleOutlined />}
        </PlayButton>
        {(command.isRunning || command.hasLogs) && (
          <StatusIcon
            onClick={handleViewLogs}
            title={t("components.commandItem.viewLogs")}
          >
            <FileTextOutlined />
          </StatusIcon>
        )}
        {command.url && (
          <StatusIcon
            onClick={handleOpenUrl}
            title={t("components.commandItem.openUrl")}
          >
            <LinkOutlined />
          </StatusIcon>
        )}
        <Tooltip title={command.name} placement="top">
          <CommandName>{command.name}</CommandName>
        </Tooltip>
      </CommandItemContainer>
    </Dropdown>
  );
}

export default CommandItem;
