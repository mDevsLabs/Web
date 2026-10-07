# threadStore.ts

- 模块：`main-src/threadStore.ts`
- 状态：已根据当前源码校验。
- 主题：线程、消息、计划和多种会话附属状态的本地持久化。

## 一句话职责

`threadStore.ts` 是 Async 对话层的主状态库，负责把线程消息和与线程强绑定的派生状态落到 `threads.json`。

## 当前数据模型

### 存储结构已经是 v2

当前不是简单的单列表，而是：

- `version: 2`
- `buckets`
- 每个 bucket 对应一个工作区维度

所以线程已经具备“按工作区分桶”的语义。

### 单线程不只有消息

`ThreadRecord` 当前还包含：

- `messages`
- `tokenUsage`
- `fileStates`
- `summary`
- `plan`
- `executedPlanFileKeys`
- `teamSession`
- `memoryExtractedMessageCount`
- `agentToolCallsCompleted`
- `memoryExtractionToolBaseline`

这说明它已经承接了大量“和线程高度相关的运行时派生状态”。

## 关键行为

### 1. debounced save

常规写入会进入 100ms 级别的延迟保存，而不是每次立刻同步写盘。

### 2. before-quit flush

真正退出前，主进程会调用 `flushPendingSave()`，确保挂起写入落盘。

### 3. 默认线程自动创建

如果当前工作区 bucket 没线程，会自动生成一个默认线程，并塞入 system prompt。

### 4. 第一条用户消息会影响标题

线程标题会用第一条 user 消息裁剪生成。

## 线程之外但仍附着在线程上的东西

这个模块还顺手管了几类很容易被忽略的数据：

- plan 状态与 step status
- plan 文件执行标记
- Team session 快照
- 记忆抽取进度与 Agent 工具调用基线
- fileStates
- 子 Agent transcript 追加

## 调试建议

如果遇到这些问题，优先看 `threadStore.ts`：

- 线程列表异常
- 对话丢失或切线程后状态不对
- Plan sidebar 和线程状态不一致
- Team 会话快照没同步
- 记忆抽取阈值行为怪异

## 典型配套文件

- `main-src/ipc/register.ts`
- `src/hooks/useThreads.ts`
- `src/hooks/usePlanSystem.ts`
- `main-src/services/extractMemories/extractMemories.ts`

## Primary Sources

- `main-src/threadStore.ts`
- `main-src/ipc/register.ts`
- `main-src/services/extractMemories/extractMemories.ts`

## 相关页面

- [状态与记忆](../architecture/state-and-memory.md)
- [settingsStore.ts](./settings-store.md)

## 更新触发条件

- `ThreadRecord` 字段变化
- 存储结构版本变化
- Plan / Team / memory baseline 数据挂载方式变化
