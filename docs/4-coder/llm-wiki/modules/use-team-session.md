# useTeamSession.ts

- 模块：`src/hooks/useTeamSession.ts`
- 状态：已根据当前源码校验。
- 主题：把 Team 模式的主进程流事件整理成 renderer 可消费的会话状态机。

## 一句话职责

`useTeamSession.ts` 是 Team 模式在 renderer 侧的状态汇聚层，把 `teamOrchestrator.ts` 发出的流式事件压缩成一份稳定的 `sessionsByThread` 状态，供 Team UI 展示和交互。

## 它实际管理什么

单个 `TeamSessionState` 当前包含：

- phase
- tasks
- leaderMessage / leaderWorkflow
- planSummary
- review / preflight 结果
- planProposal / planRevisions
- pendingQuestion
- selectedTaskId / reviewerTaskId
- `roleWorkflowByTaskId`
- timelineEntries

这说明它不是简单“把流事件存起来”，而是 Team UI 的本地状态模型。

## 关键行为

### 1. 把流事件归一为 session state

`applyTeamPayload()` 会消费：

- `team_*` 事件
- 带 `teamRoleScope` 的普通 delta / thinking / tool 事件

并将它们写入：

- leader workflow
- specialist/reviewer workflow
- task 卡片
- plan proposal / revision
- timeline

### 2. 带节流的 flush

它通过：

- `sessionsRef`
- `dirtyThreadsRef`
- `scheduleFlush()`
- `FLUSH_INTERVAL_MS`

把高频流式事件先写进可变引用，再批量快照进 React state，减少频繁重渲染。

### 3. Team timeline 是这里组装的

leader message、plan proposal、plan revision、task card 等 timeline entry 都是在这里插入和去重的。

### 4. role workflow 和 task card 是分开的

同一个 Team 会话里：

- `tasks` 用于任务层状态
- `roleWorkflowByTaskId` / `leaderWorkflow` 用于每个角色的流式运行内容

这是 Team UI 能同时显示“任务卡片”和“专家实时输出”的原因。

## 非显而易见的关键点

### 1. 它不直接跑 Team 模式，只消费结果

真正的编排在主进程 `teamOrchestrator.ts`，这里是 renderer 的消费与状态整形层。

### 2. `teamRoleScope` 事件优先级很高

只要 payload 上带 `teamRoleScope`，它就会优先写入对应角色工作流，而不是走普通聊天流。

### 3. 它同时处理 proposal / revision / reviewer 语义

并不是只有 specialist 状态，审批、修订和 reviewer 流程也都在这里落 UI 状态。

## 上层调用关系

- `src/App.tsx` 直接调用 `useTeamSession()`
- 其返回值中的 `applyTeamPayload()` 会被 `useStreamingChatSubscription()` 调用
- Team 相关 UI 最终读取这里产出的 session state

## 修改这个文件时要一起看

- `main-src/agent/teamOrchestrator.ts`
- `src/hooks/useStreamingChat.ts`
- `src/App.tsx`
- `src/teamWorkflowText.ts`
- `src/liveAgentBlocks.ts`

## Primary Sources

- `src/hooks/useTeamSession.ts`
- `src/App.tsx`
- `src/hooks/useStreamingChat.ts`
- `main-src/agent/teamOrchestrator.ts`

## 相关页面

- [teamOrchestrator.ts](./team-orchestrator.md)
- [Agent 系统](../architecture/agent-system.md)

## 更新触发条件

- Team 流事件类型变化
- Team UI 会话模型变化
- timeline / workflow / proposal 状态结构变化
