# teamOrchestrator.ts

- 模块：`main-src/agent/teamOrchestrator.ts`
- 状态：已根据当前源码校验。
- 主题：Team 模式的规划、审批、并行执行、重规划、评审和交付编排。

## 一句话职责

`teamOrchestrator.ts` 是 Team 模式的主编排器，把单次用户请求升级成“Lead 规划 -> 可选预审 -> 用户审批 -> specialist 执行 -> reviewer 评审 -> 最终交付”的多角色工作流。

## 当前主流程

### Phase 1: Planning

`runTeamSession()` 先让 Team Lead 基于消息和专家配置做规划：

- 可能直接回答
- 可能要求澄清
- 可能产出任务计划

对应关键函数：

- `llmPlanTasks()`
- `materializePlannedTasks()`

### Phase 1.25: Preflight review

如果开启了 preflight review，就会让 reviewer 在执行前先审需求/方案。

关键函数：

- `runPreflightReviewerAgent()`

### Phase 1.5: Plan proposal / approval

若配置要求用户审批，编排器会：

- 发出 `team_plan_proposed`
- 等待用户决策
- 根据批准/拒绝继续或取消

### Phase 2: Dependency-aware execution

执行阶段会：

- 根据依赖挑选可运行任务
- 控制并行度
- 派发 specialist
- 管理 peer request / escalation
- 必要时重规划

它不是简单 `Promise.all`，而是有依赖和失败恢复语义的批处理调度器。

### Phase 3: Review and delivery

执行结束后会进入 reviewer 评审，再给出最终交付文本，并把团队快照回传上层。

## 事件流语义

这个文件会持续发出大量 `TeamEmit` 事件，包括：

- team phase 变化
- specialist / reviewer / lead 的 delta、thinking、tool_progress、tool_result
- plan proposal / revision
- task 生命周期事件
- review verdict

这些事件不是附属细节，而是 renderer 中 Team 工作流 UI 的事实来源。

## 调用入口

### 主桌面聊天

- `main-src/ipc/register.ts`

### bot / headless 会话

- `main-src/bots/botRuntime.ts`

### renderer 侧消费

- `src/hooks/useTeamSession.ts` 负责把流事件整理成 Team 会话 UI 状态

## 非显而易见的关键点

### 1. Team 模式不是“多次 runAgentLoop 简单拼接”

虽然内部大量复用 `runAgentLoop()`，但编排层多了：

- 角色划分
- task 依赖
- plan approval
- preflight review
- escalation
- revision/replan

### 2. 专家并行度不是写死的

最大并行度会综合：

- team preset
- 旧配置兼容字段 `maxParallelExperts`

### 3. 它不仅返回文本，还返回团队快照

`onDone()` 除了最终交付文本，还可以带 `TeamSessionSnapshot`，随后通常会写回线程存储。

### 4. CJK / 中文请求也有专门分支照顾

它会根据请求文本判断 CJK，生成更合适的 fallback 或 clarification 叙述。

## 修改这个文件时要一起看

- `main-src/agent/agentLoop.ts`
- `main-src/agent/teamPlanApprovalTool.ts`
- `main-src/agent/teamPlanDecideTool.ts`
- `main-src/agent/teamEscalateTool.ts`
- `main-src/agent/teamPeerRequestTool.ts`
- `main-src/ipc/register.ts`
- `main-src/bots/botRuntime.ts`
- `src/hooks/useTeamSession.ts`

## Primary Sources

- `main-src/agent/teamOrchestrator.ts`
- `main-src/ipc/register.ts`
- `main-src/bots/botRuntime.ts`
- `src/hooks/useTeamSession.ts`

## 相关页面

- [Agent 系统](../architecture/agent-system.md)
- [agentLoop.ts](./agent-loop.md)

## 更新触发条件

- Team phase 流程变化
- 审批/预审/重规划逻辑变化
- specialist 并行与依赖调度变化
- renderer 对 Team 流事件的消费模型变化
