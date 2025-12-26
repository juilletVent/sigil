# 贡献指南

感谢您对 Sigil 项目的关注！我们欢迎所有形式的贡献。

## 开发环境设置

### 前置要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0（推荐）或 npm/yarn
- **Rust** >= 1.70.0
- **Git**

### 克隆仓库

```bash
git clone https://github.com/your-username/sigil.git
cd sigil
```

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 启动开发服务器

```bash
pnpm dev
# 或
pnpm tauri dev
```

## 代码规范

### TypeScript/JavaScript

项目使用 ESLint 和 Prettier 进行代码格式化。

#### 运行检查

```bash
# 检查代码规范
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

#### 代码风格

- 使用 2 个空格缩进
- 使用单引号（字符串）
- 使用分号
- 使用尾随逗号（多行）
- 最大行长度：100 字符

### Rust

项目遵循 Rust 官方代码风格，使用 `rustfmt` 进行格式化。

```bash
# 格式化 Rust 代码
cd src-tauri
cargo fmt

# 检查代码
cargo clippy
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范提交信息。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复 bug）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置文件和脚本的变动

### 示例

```bash
feat(command): 添加命令执行日志功能

实现了命令执行时的实时日志输出功能，用户可以查看命令执行的详细过程。

Closes #123
```

## 测试要求

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并查看覆盖率
pnpm test:coverage

# 使用 UI 模式运行测试
pnpm test:ui
```

### 编写测试

- 为新功能添加单元测试
- 为修复的 bug 添加回归测试
- 确保测试覆盖率不低于 70%
- 测试文件应放在与被测试文件相同的目录，命名为 `*.test.ts` 或 `*.test.tsx`

### 测试示例

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("应该正确渲染", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## Pull Request 流程

1. **Fork 仓库**并创建新分支

   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **进行更改**并提交

   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

3. **推送分支**到您的 Fork

   ```bash
   git push origin feat/my-new-feature
   ```

4. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写清晰的标题和描述
   - 关联相关 Issue（如果有）

5. **代码审查**
   - 等待维护者审查
   - 根据反馈进行修改
   - 确保所有 CI 检查通过

### PR 检查清单

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] 没有引入新的警告或错误

## 问题报告

### 报告 Bug

使用 GitHub Issues 报告 bug，请包含：

- **问题描述**：清晰描述问题
- **复现步骤**：如何复现问题
- **预期行为**：应该发生什么
- **实际行为**：实际发生了什么
- **环境信息**：
  - 操作系统版本
  - Node.js 版本
  - Rust 版本
  - 应用版本
- **截图**（如果适用）

### 功能请求

使用 GitHub Issues 提出功能请求，请包含：

- **功能描述**：清晰描述想要的功能
- **使用场景**：为什么需要这个功能
- **可能的实现方案**（可选）

## 开发指南

### 项目结构

```
sigil/
├── src/                    # 前端源代码
│   ├── api/               # API 接口
│   ├── components/        # React 组件
│   ├── hooks/             # React Hooks
│   ├── pages/             # 页面组件
│   ├── services/          # 业务逻辑服务
│   └── utils/             # 工具函数
├── src-tauri/             # Tauri 后端
│   └── src/               # Rust 源代码
└── tests/                 # 测试文件
```

### 添加新功能

1. 在 `src/` 或 `src-tauri/src/` 中创建新文件
2. 实现功能逻辑
3. 添加单元测试
4. 更新相关文档
5. 确保所有测试通过

### 添加新组件

1. 在 `src/components/` 中创建组件目录
2. 创建 `index.tsx` 和 `styles.ts` 文件
3. 导出组件
4. 添加组件测试

### 国际化

添加新文本时，请同时更新：

- `src/i18n/locales/zh-CN.json`
- `src/i18n/locales/en-US.json`

## 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重所有贡献者
- 接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击、侮辱性/贬损性评论
- 公开或私下骚扰
- 发布他人的私人信息
- 其他在专业环境中不适当的行为

## 联系方式

如有问题，请通过以下方式联系：

- 创建 GitHub Issue
- 发送邮件（如果项目有维护者邮箱）

## 许可证

通过贡献，您同意您的贡献将在与项目相同的 [MIT License](LICENSE) 下授权。

---

再次感谢您的贡献！🎉

