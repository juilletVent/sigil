import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Empty } from "antd";
import { useTranslation } from "react-i18next";
import CommandItem, { Command } from "./CommandItem";
import { ListContainer, EmptyStateContainer } from "./styles";

export interface CommandListProps {
  commands: Command[];
  onPlayCommand?: (id: string) => void;
  onEditCommand?: (id: string) => void;
  onCopyCommand?: (id: string) => void;
  onDeleteCommand?: (id: string) => void;
  onViewLogs?: (id: string) => void;
  onReorder?: (commands: Command[]) => void;
}

function CommandList({ commands, onPlayCommand, onEditCommand, onCopyCommand, onDeleteCommand, onViewLogs, onReorder }: CommandListProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 拖动 8px 后才激活，避免与点击冲突
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = commands.findIndex((cmd) => cmd.id === active.id);
      const newIndex = commands.findIndex((cmd) => cmd.id === over.id);

      const newCommands = arrayMove(commands, oldIndex, newIndex);
      onReorder?.(newCommands);
    }
  };

  if (commands.length === 0) {
    return (
      <ListContainer>
        <EmptyStateContainer>
          <Empty
            description={t("components.commandList.emptyDescription")}
          />
        </EmptyStateContainer>
      </ListContainer>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={commands.map((cmd) => cmd.id)}
        strategy={verticalListSortingStrategy}
      >
        <ListContainer>
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              command={command}
              onPlay={onPlayCommand}
              onEdit={onEditCommand}
              onCopy={onCopyCommand}
              onDelete={onDeleteCommand}
              onViewLogs={onViewLogs}
            />
          ))}
        </ListContainer>
      </SortableContext>
    </DndContext>
  );
}

export default CommandList;

