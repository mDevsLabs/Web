# useStreamingChat.ts

- 模块：`src/hooks/useStreamingChat.ts`
- 状态：已根据当前源码校验。
- 主题：renderer 侧流式聊天的基础状态、发送控制和 IPC 订阅分发。

## 一句话职责

`useStreamingChat.ts` 不是单个 hook，而是一组流式聊天基础设施：负责“建立流式会话状态、发送/中止请求、消费主进程聊天流事件并分发到 UI”。

## 文件内的三层结构

### 1. `useStreamingChat()`

负责基础流式状态：

- `streaming`
- `awaitingReply`
- thought 秒数
- toast
- 当前流式线程 refs
- nonce / off-thread drafts / timing refs

它更像是“流式运行时底座”。

### 2. `useStreamingChatControls()`

负责：

- `sendMessage()`
- `abortActiveStream()`

这里会把：

- composer mode
- 当前模型
- resend 逻辑
- Team 模式检查
- plan 执行标记
- shell IPC 调用

统一编排进发送控制流。

### 3. `useStreamingChatSubscription()`

负责订阅 `shell.subscribeChat()`，并把主进程回来的流式 payload 映射到 renderer 状态：

- 普通 delta / thinking
- tool_input_delta / tool_call / tool_result / tool_progress
- plan question
- Team payload
- done / error / background sub-agent done

## 关键行为

### 1. nonce 防迟到回包串流

它通过 `ipcStreamNonceRef` 丢弃上一轮迟到的 `done/error` 或其他回包，避免串流。

### 2. off-thread drafts 支持切线程后后台继续流

即使当前切到了别的线程，后台流式结果仍可先存入 `offThreadStreamDraftsRef`，避免直接丢失。

### 3. Team 流和普通流在这里分叉

只要 payload 带 `teamRoleScope`，就会交给 `applyTeamPayload()`，而不是走普通 assistant 正文流。

### 4. plan draft 工具在 renderer 里也会被即时持久化

例如 `plan_submit_draft` 的 tool call 到达时，这里会尝试解析参数，并触发 plan 文件 / 结构化 plan 的保存。

## 非显而易见的关键点

### 1. 这不是“纯展示状态”

这个文件直接决定：

- 什么时候发 IPC
- 什么时候 abort
- 怎么把主进程 payload 映射进 live blocks / tool preview / thought timer

它是流式聊天在 renderer 的主控层之一。

### 2. Team 模式的 UI 启动点也在这里

发送 Team 消息时，`useStreamingChatControls()` 会先调用 `startTeamSession()`，因此 Team UI 的本地会话初始化并不只依赖主进程回包。

### 3. 普通流与 Team 流并不共享同一条状态落点

- 普通流主要写 `streaming` / `liveAssistantBlocks`
- Team 流主要写 `useTeamSession()` 的 session state

## 上层调用关系

- `src/App.tsx` 同时调用：
  - `useStreamingChat()`
  - `useStreamingChatControls()`
  - `useStreamingChatSubscription()`
- `useStreamingChatSubscription()` 又会调用 `applyTeamPayload()` 等外部回调

## 修改这个文件时要一起看

- `src/App.tsx`
- `src/hooks/useTeamSession.ts`
- `src/liveAgentBlocks.ts`
- `main-src/ipc/register.ts`
- `main-src/agent/agentLoop.ts`

## Primary Sources

- `src/hooks/useStreamingChat.ts`
- `src/App.tsx`
- `src/hooks/useTeamSession.ts`
- `main-src/ipc/register.ts`

## 相关页面

- [useTeamSession.ts](./use-team-session.md)
- [agentLoop.ts](./agent-loop.md)
- [运行时架构](../architecture/runtime-architecture.md)

## 更新触发条件

- 流式 payload 类型变化
- Team / 普通流分发逻辑变化
- resend / abort / nonce 策略变化
- live blocks 或 tool preview 映射方式变化
