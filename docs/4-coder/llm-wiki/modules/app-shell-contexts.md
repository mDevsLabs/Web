# appShellContexts.tsx

- 模块：`src/app/appShellContexts.tsx`
- 状态：已根据当前源码校验。
- 主题：将大体量 App 状态拆成多个 Context，降低根组件重渲染成本的壳层切片模块。

## 一句话职责

`appShellContexts.tsx` 负责把 `App.tsx` 里汇总出来的 chrome、workspace、git、settings 状态拆成多组 Context，并提供受控的 `useAppShell*` 访问入口。

## 它为什么重要

这个文件不是“为了代码好看”的 context 封装，而是一个明确的性能切片层。

从注释和实现可见，它的目标是：

- 避免 Git 大对象变化导致整棵 App 重渲
- 让子树只订阅自己真正需要的那一块状态

## 当前上下文分层

### Chrome

- shell
- i18n / locale
- 布局模式
- color mode
- appearance settings

### Workspace

- 当前工作区
- 文件列表懒加载接口
- 搜索接口
- recents / aliases / hidden/collapsed 状态

### Git

拆成三层：

- `Actions`
- `Meta`
- `Files`

这是一种有意的颗粒化设计，不是随便拆。

### Settings

- 模型
- Agent customization
- editor / MCP / Team / bot
- settings page 开关

## 非显而易见的关键点

### 1. Git 被刻意拆成三块

这是这个文件最重要的性能设计之一：

- `Actions` 引用尽量稳定
- `Meta` 放中等体量状态
- `Files` 放 diff / path status 等大对象

这样只订阅 `Actions` 的组件不会因为 fullStatus 更新而频繁重渲。

### 2. `AppShellGitContextBridge` 自己会调用 `useGitIntegration`

也就是说 Git 状态并不是在 `App.tsx` 顶层统一算好再往下传，而是被挂在 Workspace Context 之下单独桥接。

### 3. `AppShellProviders` 是真正的壳层拼装入口

它把：

- chrome
- workspace
- settings

传入后，再由内部桥接出 Git 相关上下文。

## 上层调用关系

- `src/App.tsx` 提供 `chrome / workspace / settings`
- `AppShellProviders` 负责把它们挂进 Context
- 其他组件通过：
  - `useAppShellChrome()`
  - `useAppShellWorkspace()`
  - `useAppShellGit*()`
  - `useAppShellSettings()`
  消费

## 修改这个文件时要一起看

- `src/App.tsx`
- `src/hooks/useSettings.ts`
- `src/hooks/useWorkspaceManager.ts`
- `src/hooks/useGitIntegration.ts`

## Primary Sources

- `src/app/appShellContexts.tsx`
- `src/App.tsx`
- `src/hooks/useSettings.ts`
- `src/hooks/useWorkspaceManager.ts`
- `src/hooks/useGitIntegration.ts`

## 相关页面

- [useSettings.ts](./use-settings.md)
- [useWorkspaceManager.ts](./use-workspace-manager.md)
- [运行时架构](../architecture/runtime-architecture.md)

## 更新触发条件

- Context 切片方式变化
- Git 状态桥接层变化
- `AppShellProviders` 输入/输出结构变化
