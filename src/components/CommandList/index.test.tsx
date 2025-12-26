import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommandList from "./index";
import type { CommandItem } from "../../types";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock CommandItem component
vi.mock("./CommandItem", () => ({
  default: ({ command, onPlay, onEdit, onCopy, onDelete, onViewLogs }: any) => (
    <div data-testid={`command-item-${command.id}`}>
      <span>{command.name}</span>
      <button onClick={() => onPlay?.(command.id)}>Play</button>
      <button onClick={() => onEdit?.(command.id)}>Edit</button>
      <button onClick={() => onCopy?.(command.id)}>Copy</button>
      <button onClick={() => onDelete?.(command.id)}>Delete</button>
      <button onClick={() => onViewLogs?.(command.id)}>ViewLogs</button>
    </div>
  ),
}));

describe("CommandList", () => {
  const mockCommands: CommandItem[] = [
    {
      id: "1",
      name: "命令1",
      isRunning: false,
      hasLogs: false,
    },
    {
      id: "2",
      name: "命令2",
      isRunning: true,
      hasLogs: true,
    },
  ];

  it("应该渲染空状态", () => {
    render(<CommandList commands={[]} />);
    expect(screen.getByText(/components.commandList.emptyDescription/)).toBeInTheDocument();
  });

  it("应该渲染命令列表", () => {
    render(<CommandList commands={mockCommands} />);

    expect(screen.getByTestId("command-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("command-item-2")).toBeInTheDocument();
    expect(screen.getByText("命令1")).toBeInTheDocument();
    expect(screen.getByText("命令2")).toBeInTheDocument();
  });

  it("应该调用onPlayCommand回调", async () => {
    const mockOnPlay = vi.fn();
    const user = userEvent.setup();

    render(<CommandList commands={mockCommands} onPlayCommand={mockOnPlay} />);

    const playButtons = screen.getAllByText("Play");
    await user.click(playButtons[0]);

    expect(mockOnPlay).toHaveBeenCalledWith("1");
  });

  it("应该调用onEditCommand回调", async () => {
    const mockOnEdit = vi.fn();
    const user = userEvent.setup();

    render(<CommandList commands={mockCommands} onEditCommand={mockOnEdit} />);

    const editButtons = screen.getAllByText("Edit");
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith("1");
  });

  it("应该调用onDeleteCommand回调", async () => {
    const mockOnDelete = vi.fn();
    const user = userEvent.setup();

    render(<CommandList commands={mockCommands} onDeleteCommand={mockOnDelete} />);

    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith("1");
  });
});

