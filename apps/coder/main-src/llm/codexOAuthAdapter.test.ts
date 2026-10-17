import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ProviderOAuthAuthRecord,
  ShellSettings,
} from "../settingsStore.js";
import {
  runCodexOAuthResponseText,
  streamCodexOAuth,
} from "./codexOAuthAdapter.js";
import type { SendableMessage } from "./sendResolved.js";
import type { UnifiedChatOptions } from "./types.js";

const mocks = vi.hoisted(() => ({
  electronNetFetch: vi.fn(),
  ensureFreshOAuthAuthForRequest: vi.fn(),
}));

vi.mock("./electronNetFetch.js", () => ({
  electronNetFetch: mocks.electronNetFetch,
}));

vi.mock("./providerOAuthLogin.js", () => ({
  ensureFreshOAuthAuthForRequest: mocks.ensureFreshOAuthAuthForRequest,
}));

function sseResponse(events: Record<string, unknown>[]): Response {
  return new Response(
    events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
    {
      headers: { "content-type": "text/event-stream" },
      status: 200,
    }
  );
}

function capturedBody(): Record<string, unknown> {
  const init = mocks.electronNetFetch.mock.calls[0]?.[1] as
    | { body?: unknown }
    | undefined;
  return JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
}

describe("Codex OAuth Responses requests", () => {
  const auth: ProviderOAuthAuthRecord = {
    accessToken: "codex-access-token",
    accountId: "account-id",
    lastRefreshAt: 0,
    provider: "codex",
    refreshToken: "codex-refresh-token",
  };

  beforeEach(() => {
    mocks.electronNetFetch.mockReset();
    mocks.ensureFreshOAuthAuthForRequest.mockReset();
    mocks.ensureFreshOAuthAuthForRequest.mockImplementation(
      async (
        _providerId: string | undefined,
        inputAuth: ProviderOAuthAuthRecord
      ) => inputAuth
    );
  });

  it("matches Codex Responses body compatibility on text helper requests", async () => {
    mocks.electronNetFetch.mockResolvedValueOnce(
      sseResponse([
        {
          response: {
            output: [{ content: [{ text: "ok" }] }],
          },
          type: "response.completed",
        },
      ])
    );

    await runCodexOAuthResponseText({
      auth,
      input: "hello",
      instructions: "Summarize.",
      maxOutputTokens: 100,
      model: "gpt-5.3-codex",
      temperature: 0,
    });

    const body = capturedBody();
    expect(body.store).toBe(false);
    expect(body.parallel_tool_calls).toBe(true);
    expect(body.include).toEqual(["reasoning.encrypted_content"]);
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("max_output_tokens");
  });

  it("matches Codex Responses body compatibility on chat streaming requests", async () => {
    mocks.electronNetFetch.mockResolvedValueOnce(
      sseResponse([
        { delta: "ok", type: "response.output_text.delta" },
        {
          response: { usage: { input_tokens: 1, output_tokens: 1 } },
          type: "response.completed",
        },
      ])
    );
    const done = vi.fn();
    const messages: SendableMessage[] = [
      { content: "system", role: "system" },
      { content: "hello", role: "user" },
    ];
    const options = {
      maxOutputTokens: 100,
      mode: "ask",
      requestModelId: "gpt-5.3-codex",
      requestOAuthAuth: auth,
      requestProviderId: "provider-id",
      signal: new AbortController().signal,
      temperature: 0.4,
      temperatureMode: "custom",
      thinkingLevel: "off",
    } as UnifiedChatOptions;

    await streamCodexOAuth(
      {} as ShellSettings,
      messages,
      options,
      {
        onDelta: vi.fn(),
        onDone: done,
        onError: vi.fn(),
      },
      auth
    );

    const body = capturedBody();
    expect(body.store).toBe(false);
    expect(body.parallel_tool_calls).toBe(true);
    expect(body.include).toEqual(["reasoning.encrypted_content"]);
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("max_output_tokens");
    expect(done).toHaveBeenCalled();
  });
});
