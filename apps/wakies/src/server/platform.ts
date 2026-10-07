import { ComputerService } from './computer-service.js';
import { PageService } from './page-service.js';
import { randomUUID } from 'node:crypto';
import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotHonoHandler,
  type CopilotHonoApp,
} from '@copilotkit/runtime/v2';
import { createSlackChannel } from './slack-channel.js';
export { slackIdentity } from './slack-channel.js';
import { Store } from './store.js';
import { WorkspaceStore } from './workspace.js';
import { WakieAgent } from './wakie-agent.js';
import { runThreadTurn } from './headless.js';
import { setupStatus, type PlatformConfig } from './platform-config.js';
import { validateRuntimeScope } from './runtime-scope.js';
import { learningSelector } from './learning.js';
export class Platform {
  private channelStartupFailed = false;
  readonly pages: PageService;
  readonly computers: ComputerService;
  readonly intelligence?: CopilotKitIntelligence;
  readonly handler?: CopilotHonoApp;
  constructor(
    readonly store: Store,
    readonly workspace: WorkspaceStore,
    readonly config: PlatformConfig,
  ) {
    this.computers = new ComputerService(
      workspace,
      config,
      () => store.settings().paused,
    );
    this.pages = new PageService(workspace, () => {
      this.requireReady();
      return this.intelligence!;
    });
    if (!config.intelligenceKey) return;
    this.intelligence = new CopilotKitIntelligence({
      apiKey: config.intelligenceKey,
      apiUrl: config.intelligenceApiUrl,
      wsUrl: config.intelligenceWsUrl,
      getLearningContainerId: learningSelector(
        workspace,
        config.slackWakieId ?? workspace.wakies()[0]?.id,
      ),
    });
    const channels = [];
    if (config.slackChannel && config.slackTeam && config.slackUsers.length) {
      const wakieId = config.slackWakieId ?? workspace.wakies()[0].id;
      if (!workspace.wakie(wakieId))
        throw new Error('SLACK_WAKIE_ID does not identify an existing Wakie.');
      const slack = createSlackChannel({
        name: config.slackChannel,
        config,
        ownerId: workspace.ownerId,
        paused: () => store.settings().paused,
        agent: () => new WakieAgent(store, workspace, config, wakieId, true),
      });
      channels.push(slack);
    }
    const runtime = new CopilotRuntime({
      intelligence: this.intelligence,
      identifyUser: async () => ({
        id: workspace.ownerId,
        name: 'Wakies owner',
      }),
      agents: async () =>
        Object.fromEntries(
          workspace
            .wakies()
            .map((wakie) => [
              wakie.id,
              new WakieAgent(store, workspace, config, wakie.id),
            ]),
        ),
      channels,
      generateThreadNames: true,
    });
    this.handler = createCopilotHonoHandler({
      runtime,
      basePath: '/api/copilotkit',
      cors: { origin: [] },
    });
  }
  setup() {
    return setupStatus(
      this.config,
      this.handler?.channels?.status().overall ??
        (this.config.slackChannel ? 'setup_required' : 'not_configured'),
      this.channelStartupFailed,
    );
  }
  requireReady() {
    const missing = this.setup().missing;
    if (missing.length)
      throw new Error(
        `Setup required: ${missing.join(', ')}. Conversations require CopilotKit Intelligence.`,
      );
  }
  async start() {
    if (this.handler?.channels) {
      try {
        await this.handler.channels.ready({ timeoutMs: 15000 });
        this.channelStartupFailed = false;
      } catch (error) {
        this.channelStartupFailed = true;
        throw error;
      }
    }
  }
  async stop() {
    await this.handler?.channels?.stop();
  }
  async createConversation(wakieId: string, title: string) {
    this.requireReady();
    if (!this.workspace.wakie(wakieId)) throw new Error('Wakie not found.');
    const id = randomUUID();
    try {
      await this.intelligence!.createThread({
        threadId: id,
        userId: this.workspace.ownerId,
        agentId: wakieId,
        name: title,
      });
    } catch {
      throw new Error(
        'Intelligence could not create this conversation. Check the runtime key and connection.',
      );
    }
    return this.workspace.bindThread(id, wakieId, title);
  }
  async history(threadId: string): Promise<string> {
    this.requireReady();
    this.workspace.requireThread(threadId);
    const history = await this.intelligence!.getThreadMessages({
      threadId,
      userId: this.workspace.ownerId,
    });
    return history.messages
      .filter((message) => ['user', 'assistant'].includes(message.role))
      .slice(-12)
      .map(
        (message) =>
          `${message.role}: ${typeof message.content === 'string' ? message.content : ''}`,
      )
      .join('\n')
      .slice(-12000);
  }
  async handle(request: Request): Promise<Response> {
    if (!this.handler)
      return Response.json(
        { error: 'Setup required: INTELLIGENCE_API_KEY.' },
        { status: 503 },
      );
    let body: unknown;
    if (request.method !== 'GET' && request.method !== 'HEAD')
      body = await request
        .clone()
        .json()
        .catch(() => null);
    try {
      validateRuntimeScope(request, this.workspace, body);
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Conversation scope denied.',
        },
        { status: 403 },
      );
    }
    return this.handler.fetch(request);
  }
  async turn(
    threadId: string,
    prompt: string,
    signal: AbortSignal,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    this.requireReady();
    const thread = this.workspace.requireThread(threadId);
    return runThreadTurn(
      this.config.runtimeUrl,
      this.config.ownerToken
        ? { Authorization: `Bearer ${this.config.ownerToken}` }
        : {},
      thread.wakieId,
      threadId,
      prompt,
      signal,
      metadata,
    );
  }
}
