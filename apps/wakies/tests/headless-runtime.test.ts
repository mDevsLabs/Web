import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AgentSubscriber } from '@ag-ui/client';
import { runThreadTurn } from '../src/server/headless.js';
const sdk = vi.hoisted(() => ({
  run: vi.fn(),
  detach: vi.fn(),
  abort: vi.fn(),
  message: vi.fn(),
  config: vi.fn(),
  thread: vi.fn(),
  unsubscribe: vi.fn(),
  subscriber: undefined as AgentSubscriber | undefined,
}));
vi.mock('@copilotkit/core', () => ({
  IntelligenceAgent: class {
    set threadId(id: string) {
      sdk.thread(id);
    }
    constructor(config: unknown) {
      sdk.config(config);
    }
    subscribe(subscriber: AgentSubscriber) {
      sdk.subscriber = subscriber;
      return { unsubscribe: sdk.unsubscribe };
    }
    addMessage(message: unknown) {
      sdk.message(message);
    }
    runAgent() {
      return sdk.run();
    }
    detachActiveRun() {
      return sdk.detach();
    }
    abortRun() {
      sdk.abort();
    }
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  sdk.subscriber = undefined;
});
afterEach(() => {
  vi.unstubAllGlobals();
});
it('executes server turns without browser-only Core discovery and tears down the SDK stream', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      mode: 'intelligence',
      intelligence: { wsUrl: 'wss://example.com/client' },
      agents: { wakie: {} },
    }),
  );
  vi.stubGlobal('fetch', fetcher);
  sdk.run.mockResolvedValue({
    newMessages: [
      { id: 'reply', role: 'assistant', content: 'Confirmed receipt' },
    ],
  });
  expect(
    await runThreadTurn(
      'https://runtime.test',
      { Authorization: 'Bearer test' },
      'wakie',
      'thread',
      'Record my call',
      new AbortController().signal,
      { wakiesSource: 'voice_receipt' },
    ),
  ).toBe('Confirmed receipt');
  expect(fetcher).toHaveBeenCalledWith(
    'https://runtime.test/info',
    expect.objectContaining({ headers: { Authorization: 'Bearer test' } }),
  );
  expect(sdk.config).toHaveBeenCalledWith(
    expect.objectContaining({
      agentId: 'wakie',
      runtimeUrl: 'https://runtime.test',
      url: 'wss://example.com/client',
    }),
  );
  expect(sdk.message).toHaveBeenCalledWith(
    expect.objectContaining({
      id: expect.stringMatching(/^wakies:voice_receipt:/),
      role: 'user',
      content: 'Record my call',
      metadata: { wakiesSource: 'voice_receipt' },
    }),
  );
  expect(sdk.thread).toHaveBeenCalledWith('thread');
  expect(sdk.unsubscribe).toHaveBeenCalledOnce();
  expect(sdk.detach).toHaveBeenCalledOnce();
});
it('rejects failed runtime discovery instead of waiting for browser status indefinitely', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 403 })),
  );
  await expect(
    runThreadTurn(
      'https://runtime.test',
      {},
      'wakie',
      'thread',
      'Call',
      new AbortController().signal,
    ),
  ).rejects.toThrow('HTTP 403');
  expect(sdk.run).not.toHaveBeenCalled();
});
it('rejects a Wakie missing from runtime metadata', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        mode: 'intelligence',
        intelligence: { wsUrl: 'wss://example.com' },
        agents: {},
      }),
    ),
  );
  await expect(
    runThreadTurn(
      'https://runtime.test',
      {},
      'wakie',
      'thread',
      'Call',
      new AbortController().signal,
    ),
  ).rejects.toThrow('Wakie is unavailable');
});

it('aborts the running SDK turn and releases the subscriber on cancellation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        mode: 'intelligence',
        intelligence: { wsUrl: 'wss://example.com/client' },
        agents: { wakie: {} },
      }),
    ),
  );
  const controller = new AbortController();
  sdk.run.mockImplementation(async () => {
    controller.abort(new Error('Call ended'));
    return {
      newMessages: [{ id: 'late', role: 'assistant', content: 'Late answer' }],
    };
  });
  await expect(
    runThreadTurn(
      'https://runtime.test',
      {},
      'wakie',
      'thread',
      'Call',
      controller.signal,
    ),
  ).rejects.toThrow('Call ended');
  expect(sdk.abort).toHaveBeenCalledOnce();
  expect(sdk.unsubscribe).toHaveBeenCalledOnce();
  expect(sdk.detach).toHaveBeenCalledOnce();
  controller.abort();
  expect(sdk.abort).toHaveBeenCalledOnce();
});
it('cleans up rejected SDK turns while preserving the error', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        mode: 'intelligence',
        intelligence: { wsUrl: 'wss://example.com/client' },
        agents: { wakie: {} },
      }),
    ),
  );
  sdk.run.mockRejectedValue(new Error('Runtime socket failed'));
  await expect(
    runThreadTurn(
      'https://runtime.test',
      {},
      'wakie',
      'thread',
      'Call',
      new AbortController().signal,
    ),
  ).rejects.toThrow('Runtime socket failed');
  expect(sdk.unsubscribe).toHaveBeenCalledOnce();
  expect(sdk.detach).toHaveBeenCalledOnce();
});
