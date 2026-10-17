# useSettings.ts

- 模块：`src/hooks/useSettings.ts`
- 状态：已根据当前源码校验。
- 主题：渲染层设置状态的聚合 hook，以及“全局设置 + 项目级 Agent 切片 + 工作区磁盘技能”的合流点。

## 一句话职责

`useSettings.ts` 是 renderer 侧的设置中枢 hook，把主进程设置快照、本地 UI 状态、项目级 Agent 切片和工作区磁盘技能整合成可供 `App.tsx` 使用的一组状态与回调。

## 它实际管理什么

### 模型相关状态

- `modelProviders`
- `defaultModel`
- `modelEntries`
- `enabledModelIds`
- `thinkingByModelId`
- `modelPickerItems`
- `modelPillLabel`

### Agent 自定义

- 全局 `agentCustomization`
- 工作区级 `projectAgentSlice`
- 工作区磁盘技能 `workspaceDiskSkills`
- 合并后的 `mergedAgentCustomization`

### 其他设置块

- `editorSettings`
- `mcpServers`
- `mcpStatuses`
- `teamSettings`
- `botIntegrations`
- 设置页开关与初始导航状态

## 关键价值

这个 hook 最重要的不是“存了一堆 state”，而是它统一了三层来源：

1. 主进程 `settings.json`
2. 工作区 `.mai/agent.json`
3. 工作区磁盘扫描到的技能

这让 renderer 侧最终拿到的是“可用于当前工作区”的有效设置视图，而不是单一来源的原始数据。

## 非显而易见的关键点

### 1. 项目级 Agent 切片不会直接混写回全局设置

`onChangeMergedAgentCustomization()` 会把内容重新拆回：

- user origin
- project origin
- workspace disk skill

并把 project 部分通过 `workspaceAgent:set` 写回工作区，而不是塞回全局 settings。

### 2. `mergedAgentCustomization` 是运行时组合结果

它会把：

- 全局 rules / skills / subagents
- 项目级切片
- 工作区磁盘技能

合并成一份供 UI 和对话使用的配置。

### 3. 它不是直接渲染设置页本身

它只是设置状态中枢，真正消费它的是：

- `src/App.tsx`
- `src/app/appShellContexts.tsx`
- 设置页和模型选择器等下游 UI

### 4. `applyLoadedSettings()` 是进入 renderer 的关键入口之一

主进程返回的设置快照进入 renderer 后，会在这里做结构化落地与默认值补齐。

## 上层调用关系

- `src/App.tsx` 直接调用 `useSettings(shell, workspace, t)`
- 随后通过 `src/app/appShellContexts.tsx` 拆成 `AppShellSettingsContext`
- 其他组件通过 `useAppShellSettings()` 间接消费

## 修改这个文件时要一起看

- `main-src/settingsStore.ts`
- `main-src/workspaceAgentStore.ts`
- `src/App.tsx`
- `src/app/appShellContexts.tsx`
- `src/modelCatalog.ts`

## Primary Sources

- `src/hooks/useSettings.ts`
- `src/App.tsx`
- `src/app/appShellContexts.tsx`
- `main-src/settingsStore.ts`
- `main-src/workspaceAgentStore.ts`

## 相关页面

- [settingsStore.ts](./settings-store.md)
- [状态与记忆](../architecture/state-and-memory.md)

## 更新触发条件

- 设置项结构变化
- 项目级 Agent 切片合并逻辑变化
- 工作区磁盘技能加载逻辑变化
- `AppShellSettingsContext` 切片方式变化
