# workspaceContextExpand.ts

- 模块：`main-src/llm/workspaceContextExpand.ts`
- 状态：已根据当前源码校验。
- 主题：把工作区文件引用和文件树信息编译进模型上下文的主进程辅助模块。

## 一句话职责

`workspaceContextExpand.ts` 负责把用户消息里的 `@路径`、工作区文件树和模式判断，转成真正送给模型的上下文增强内容。

## 它实际做什么

### 1. 识别 `@路径`

`collectAtWorkspacePathsInText()` 会基于已知工作区相对路径集合，从用户文本中找出被引用的文件路径。

重点：

- 它不是简单正则，而是用“已知路径表”验证
- 渲染端的 `@` 气泡展示是启发式的，但真正发给模型前的确认在主进程这里

### 2. 展开最后一条用户消息

`cloneMessagesWithExpandedLastUser()` 会深拷贝消息列表，并仅把最后一条 user 消息展开成：

- 文件内容
- 图片 Data URL
- 二进制文件说明
- 原始消息正文

这意味着：

- 送给模型的是扩展副本
- 原线程消息本体不会因为上下文扩展被直接改写

### 3. 生成工作区树摘要

`buildWorkspaceTreeSummary()` 会根据工作区文件列表生成压缩树状摘要，并过滤大量 asset/binary 文件。

这是 Plan / Ask / Team 模式里“让模型先大致知道仓库长什么样”的重要辅助手段。

### 4. 判断哪些模式需要扩展

`modeExpandsWorkspaceFileContext()` 当前把这些模式视为需要扩展：

- `agent`
- `plan`
- `team`
- `debug`
- `ask`

## 调用入口

### 直接调用方

- `main-src/llm/llmRouter.ts`
  - 非 Agent 模式统一流式补全前
- `main-src/ipc/register.ts`
  - 聊天主流程中构建工作区树摘要、Agent 前扩展 `@路径`
- `main-src/bots/botRuntime.ts`
  - headless/bot 会话中同样复用

### 间接影响

- Team 模式
- bot 平台会话
- 普通 Ask / Plan / Debug 请求

## 非显而易见的关键点

### 1. 它是“主进程上下文编译器”，不是前端格式化工具

虽然看起来像字符串处理，但它直接影响模型看到的实际上下文，是 prompt pipeline 的组成部分。

### 2. 它依赖 `workspaceFileIndex`

优先取：

- `getIndexedWorkspaceFilesIfFresh()`

拿不到时再回退：

- `listWorkspaceRelativeFiles()`

所以它也是 `workspaceFileIndex` 仍有现实意义的证据之一。

### 3. 图片会被 inline

符合大小和扩展条件的图片会被直接内联成 Data URL，这点对上下文体积和模型输入都很重要。

## 修改这个文件时要一起看

- `main-src/llm/llmRouter.ts`
- `main-src/ipc/register.ts`
- `main-src/bots/botRuntime.ts`
- `main-src/workspaceFileIndex.ts`
- `main-src/workspace.ts`

## Primary Sources

- `main-src/llm/workspaceContextExpand.ts`
- `main-src/llm/llmRouter.ts`
- `main-src/ipc/register.ts`
- `main-src/bots/botRuntime.ts`
- `main-src/workspaceFileIndex.ts`

## 相关页面

- [工作区智能](../architecture/workspace-intelligence.md)
- [workspaceFileIndex.ts](./workspace-file-index.md)

## 更新触发条件

- `@路径` 展开规则变化
- 工作区树摘要生成规则变化
- 需要扩展上下文的模式集合变化
- 图片/二进制文件内联策略变化
