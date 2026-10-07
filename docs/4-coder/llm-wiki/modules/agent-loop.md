# agentLoop.ts

- 模块：`main-src/agent/agentLoop.ts`
- 状态：已根据当前源码校验。
- 主题：Agent 多轮工具循环的核心引擎。

## 一句话职责

`agentLoop.ts` 负责把“线程消息 + 工具池 + provider 适配 + 流式回调”编排成真正可运行的多轮 Agent 会话。

## 它实际做什么

### 1. 规范化消息再发给模型

在真正调用模型前，它会处理：

- 结构化 assistant 消息展开
- OpenAI / Anthropic 工具配对修复
- 相邻 user 消息合并
- API 对话修复与兜底

这意味着它不只是“调 SDK”，还是 provider 兼容层的重要一段。

### 2. 组装工具池

工具池来源主要有两类：

- 内置 Agent 工具
- MCP 动态工具

而且它会按模式裁剪工具：

- `agent` / `team`：完整工具循环
- `plan`：更偏只读与规划工具
- `ask` / 非 agent：不走这里的多轮工具循环

### 3. 管理流式事件

它对 UI 暴露的事件很多，包括：

- 文本增量
- thinking 增量
- tool_input_delta
- tool_progress
- tool_call
- tool_result
- done / error

所以渲染层看到的“工具卡片逐步展开”，本质上是这里在持续发事件。

### 4. 执行多轮循环

核心回合逻辑是：

1. 调模型
2. 如果出现工具调用，则交给 `toolExecutor.ts`
3. 把工具结果补回会话
4. 再次请求模型
5. 直到只剩文本回复，或达到中止条件

## 它依赖什么

- `agentToolPool.ts`
- `agentTools.ts`
- `toolExecutor.ts`
- `structuredAssistantToApi.ts`
- `apiConversationRepair.ts`
- `messageNormalizeForApi.ts`
- `mcp/*`
- `llm/*`

## 非显而易见的关键点

### MCP 不是 UI 才接入

`runAgentLoop()` 在进入 provider loop 之前会调用 `prepareMcpConnectionsForSession()`，也就是模型真正开跑前就会准备 MCP 连接。

### 连续失败暂停逻辑在这里受控

“工具连续失败多少次后暂停并问用户”这类体验，并不是单独 UI 逻辑，而是在这里结合 `mistakeLimit` 机制控制。

### 流式 tool 参数展示也是这里发出的

很多写入卡片能边生成边预览，不是 renderer 自己猜的，而是这里持续推送 `onToolInputDelta`。

## 典型调用入口

- `main-src/ipc/register.ts` 在聊天主流程里调用
- Team 模式会通过 team orchestrator 间接复用
- 子 Agent / 背景 Agent 也会走这套循环

## 修改这个文件时要一起看

- `main-src/agent/toolExecutor.ts`
- `main-src/agent/agentTools.ts`
- `main-src/agent/structuredAssistantToApi.ts`
- `main-src/agent/apiConversationRepair.ts`
- `main-src/ipc/register.ts`

## Primary Sources

- `main-src/agent/agentLoop.ts`
- `main-src/ipc/register.ts`
- `main-src/agent/teamOrchestrator.ts`

## 相关页面

- [Agent 系统](../architecture/agent-system.md)
- [toolExecutor.ts](./tool-executor.md)

## 更新触发条件

- 多轮循环策略变化
- provider 适配变化
- tool 输入增量或错误恢复机制变化
- MCP 准备逻辑变化
