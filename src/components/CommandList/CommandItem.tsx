import { PlayCircleOutlined, FileOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  CommandItemContainer,
  PlayButton,
  StatusIcon,
  CommandName,
} from "./styles";

export interface Command {
  id: string;
  name: string;
  isRunning: boolean;
}

interface CommandItemProps {
  command: Command;
  onPlay?: (id: string) => void;
  onEdit?: (id: string) => void;
}

function CommandItem({ command, onPlay, onEdit }: CommandItemProps) {
  const { t } = useTranslation();
  
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(command.id);
  };

  const handleItemClick = () => {
    onEdit?.(command.id);
  };

  return (
    <CommandItemContainer onClick={handleItemClick}>
      <PlayButton onClick={handlePlay} title={t("components.commandItem.run")}>
        <PlayCircleOutlined />
      </PlayButton>
      <StatusIcon title={t("components.commandItem.status")}>
        <FileOutlined />
      </StatusIcon>
      <CommandName>{command.name}</CommandName>
    </CommandItemContainer>
  );
}

export default CommandItem;

