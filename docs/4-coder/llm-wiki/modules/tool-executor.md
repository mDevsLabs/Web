# toolExecutor.ts

- 模块：`main-src/agent/toolExecutor.ts`
- 状态：已根据当前源码校验。
- 主题：Agent 工具的真实执行层。

## 一句话职责

`toolExecutor.ts` 是内置工具和部分动态能力的执行总线，把模型产生的 tool call 落到文件系统、shell、Git、Browser、MCP、子 Agent 和记忆系统上。

## 它为什么关键

如果说 `agentLoop.ts` 决定“什么时候执行工具”，那么 `toolExecutor.ts` 决定“工具到底怎么执行、受什么约束、返回什么结果”。

## 能力范围

从当前实现和依赖看，这里至少覆盖：

- 文件读写与编辑
- 目录遍历、glob、grep
- Bash / PowerShell 命令
- Git 辅助能力
- Browser 工具
- MCP 工具执行
- LSP / symbol 查询
- Todo 存储
- 子 Agent 派发
- 记忆抽取与子 Agent 记忆目录

## 非显而易见的关键点

### 1. 子 Agent 也是工具执行的一部分

`Agent` / `Task` 工具的嵌套执行、后台运行、转录追加、delegate context，都在这里接好。

### 2. Browser 工具比“开网页”复杂得多

这里会调用 `browserController.ts`，支持：

- 导航
- 读取页面
- 截图
- 应用代理和 Header 配置

### 3. 路径安全是底层约束

文件相关工具会经过 `resolveWorkspacePath()` 和工作区边界检查，不允许随意越出工作区。

### 4. 子 Agent 记忆也从这里接入

它会接 `agentMemory.ts` 和 `.mai/memory` 相关逻辑，所以这里不仅有“执行”，也有“长期上下文”的入口。

## 它依赖什么

- `workspace.ts`
- `workspaceSymbolIndex.ts`
- `gitService.ts`
- `browser/browserController.ts`
- `mcp/index.ts`
- `agentMemory.ts`
- `extractMemories.ts`
- `subagentProfile.ts`

## 调试建议

遇到这类问题时先看这里：

- 工具调用参数看起来对，但行为不对
- 某工具返回格式异常
- 子 Agent 没正确派发
- Browser / MCP / shell / Git 工具行为和预期不同
- 文件路径越界或工作区路径异常

## 典型配套文件

- `main-src/agent/agentTools.ts`
- `main-src/agent/agentLoop.ts`
- `main-src/agent/toolApprovalGate.ts`
- `main-src/workspace.ts`

## Primary Sources

- `main-src/agent/toolExecutor.ts`
- `main-src/agent/agentTools.ts`
- `main-src/workspace.ts`
- `main-src/browser/browserController.ts`

## 相关页面

- [Agent 系统](../architecture/agent-system.md)
- [agentLoop.ts](./agent-loop.md)

## 更新触发条件

- 新增工具
- 文件/命令权限模型变化
- 子 Agent 派发方式变化
- Browser / MCP / Git / LSP 工具行为变化
