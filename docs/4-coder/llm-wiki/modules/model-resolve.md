# modelResolve.ts

- 模块：`main-src/llm/modelResolve.ts`
- 状态：已根据当前源码校验。
- 主题：把 renderer 里的模型选择 id 解析成真正可用于主进程请求的运行时模型参数。

## 一句话职责

`modelResolve.ts` 是模型选择到模型请求之间的解析层，把 `settings.models` 中的 provider / entry / enabled / thinking 信息整理成真正可发请求的运行时参数。

## 当前公开能力

### `resolveModelRequest()`

返回：

- `requestModelId`
- `paradigm`
- `maxOutputTokens`
- `contextWindowTokens`
- `apiKey`
- `baseURL`
- `proxyUrl`

失败时返回用户可读错误消息。

### `resolveChatModel()`

返回更轻量的：

- `requestModelId`
- `paradigm`

### `resolveThinkingLevelForSelection()`

按当前选择的模型条目 id 解析思考强度。

### `clampMaxOutputTokens()`

统一裁剪输出 token 上限。

## 关键解析步骤

1. 读取 `settings.models.entries`
2. 读取 `settings.models.providers`
3. 检查 `enabledIds`
4. 找出 entry 对应 provider
5. 校验 provider 凭证
6. 生成运行时参数

这说明模型选择并不是简单的“拿一个字符串模型名”，而是一个多步关联解析过程。

## 非显而易见的关键点

### 1. `defaultModel` 不是最终请求参数

`defaultModel` 只是选择器层的 entry id，真正请求前还要经过这里解析成：

- request model name
- provider paradigm
- provider credentials

### 2. provider 凭证解析按 paradigm 分支

- OpenAI-compatible：`apiKey + baseURL + proxyUrl`
- Anthropic：`apiKey + 可选 baseURL`
- Gemini：`apiKey`

### 3. `auto` 在这里被当成无效选择

`resolveModelRequest()` 本身不直接解析 `auto`，而是要求上游传入真实 entry id。

### 4. 上下文窗口只是“可选显式值”

`contextWindowTokens` 若未配置，会留给别的层做进一步解析或启发式推断。

## 调用入口

当前直接调用方包括：

- `main-src/ipc/register.ts`
- `main-src/agent/teamOrchestrator.ts`
- `main-src/bots/botRuntime.ts`
- `main-src/memdir/findRelevantMemories.ts`

这说明它不仅服务普通聊天，也服务：

- Team 模式
- bot 模式
- 记忆检索 / 记忆抽取相关旁路请求

## 修改这个文件时要一起看

- `main-src/settingsStore.ts`
- `src/hooks/useSettings.ts`
- `main-src/llm/modelContext.ts`
- `main-src/ipc/register.ts`

## Primary Sources

- `main-src/llm/modelResolve.ts`
- `main-src/settingsStore.ts`
- `main-src/ipc/register.ts`
- `main-src/agent/teamOrchestrator.ts`
- `main-src/bots/botRuntime.ts`

## 相关页面

- [settingsStore.ts](./settings-store.md)
- [useSettings.ts](./use-settings.md)

## 更新触发条件

- provider / model 结构变化
- `auto` 解析策略变化
- thinking level 解析策略变化
- 上下文窗口或 maxOutputTokens 语义变化
