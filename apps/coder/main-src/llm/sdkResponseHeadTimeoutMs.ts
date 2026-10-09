/**
 * 响应头等待超时配置：
 * `parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10)`
 */
export function llmSdkResponseHeadTimeoutMs(): number {
  return Number.parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10);
}
