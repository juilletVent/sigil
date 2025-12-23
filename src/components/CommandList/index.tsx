import CommandItem, { Command } from "./CommandItem";
import { ListContainer, EmptyState } from "./styles";

export interface CommandListProps {
  commands: Command[];
  onPlayCommand?: (id: string) => void;
  onEditCommand?: (id: string) => void;
}

function CommandList({ commands, onPlayCommand, onEditCommand }: CommandListProps) {
  if (commands.length === 0) {
    return (
      <ListContainer>
        <EmptyState>暂无命令，点击左上角添加按钮创建命令</EmptyState>
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      {commands.map((command) => (
        <CommandItem
          key={command.id}
          command={command}
          onPlay={onPlayCommand}
          onEdit={onEditCommand}
        />
      ))}
    </ListContainer>
  );
}

export default CommandList;

