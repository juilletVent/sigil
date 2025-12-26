import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommandForm from "./index";
import type { CommandFormValues } from "../../types";

// Mock Tauri API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("CommandForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该渲染表单", () => {
    render(
      <CommandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByPlaceholderText(/components.commandForm.namePlaceholder/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/components.commandForm.commandPlaceholder/)).toBeInTheDocument();
  });

  it("应该显示初始值", () => {
    const initialValues: Partial<CommandFormValues> = {
      name: "测试命令",
      command: "echo test",
      sudo: true,
    };

    render(
      <CommandForm
        initialValues={initialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue("测试命令")).toBeInTheDocument();
    expect(screen.getByDisplayValue("echo test")).toBeInTheDocument();
  });

  it("应该验证必填字段", async () => {
    const user = userEvent.setup();

    render(
      <CommandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const submitButton = screen.getByText(/common.confirm/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it("应该在提交时调用onSubmit", async () => {
    const user = userEvent.setup();

    render(
      <CommandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByPlaceholderText(/components.commandForm.namePlaceholder/);
    const commandInput = screen.getByPlaceholderText(/components.commandForm.commandPlaceholder/);

    await user.type(nameInput, "测试命令");
    await user.type(commandInput, "echo test");

    const submitButton = screen.getByText(/common.confirm/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "测试命令",
          command: "echo test",
        })
      );
    });
  });

  it("应该在取消时调用onCancel", async () => {
    const user = userEvent.setup();

    render(
      <CommandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByText(/common.cancel/);
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});

