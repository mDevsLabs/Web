import "server-only";

import { and, eq, sql } from "drizzle-orm";
import {
  createMcpServer,
  deleteMcpServer,
  getDb,
  updateMcpServer,
} from "@/lib/db/queries";
import {
  type McpServer,
  mcpServer,
  mcpServerSecret,
  userPlugin,
  userPluginSecret,
} from "@/lib/db/schema";
import { decrypt, encrypt, isEncryptionConfigured } from "@/lib/mcp/encryption";
import { persistInlineMcpSecrets } from "@/lib/mcp/secrets-write";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";
import { validateAndResolveUrl } from "@/lib/web/ssrf";
import { boundedFetchJson } from "./shared/bounded-fetch";
import { describeFailure } from "./shared/public-api";
import type {
  UserPluginCreateInput,
  UserPluginUpdateInput,
  UserPluginView,
} from "./user-plugin-input";

const MAX_USER_PLUGINS = 40;

export class UserPluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserPluginError";
  }
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function lucideIcon(raw: string | null | undefined): string {
  const name = raw?.trim() ?? "";
  const match = ["Puzzle", "Server", "KeyRound", "Globe", "Wrench"].find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase()
  );
  if (match && isLucideIconName(match)) {
    return match;
  }
  return isLucideIconName(name) ? name : "Puzzle";
}

async function assertHttps(raw: string, label: string): Promise<URL> {
  const checked = await validateAndResolveUrl(raw);
  if (checked.error || !checked.host) {
    throw new UserPluginError(checked.error ?? `${label} refusée.`);
  }
  if (checked.host.url.protocol !== "https:") {
    throw new UserPluginError(`${label} doit utiliser HTTPS.`);
  }
  if (checked.host.url.username || checked.host.url.password) {
    throw new UserPluginError(`${label} ne doit pas contenir d'identifiants.`);
  }
  return checked.host.url;
}

function hostsFor(base: URL, extra: string[]): string[] {
  const hosts = new Set<string>([base.host.toLowerCase()]);
  for (const host of extra) {
    hosts.add(host.toLowerCase());
  }
  if (hosts.size > 5) {
    throw new UserPluginError("Cinq hôtes au maximum.");
  }
  return [...hosts];
}

async function requireVault(needed: boolean) {
  if (needed && !isEncryptionConfigured()) {
    throw new UserPluginError(
      "Le coffre de secrets n'est pas configuré sur cette instance : MCP_ENCRYPTION_KEY doit être posée sur le serveur."
    );
  }
}

export async function linkMcpServerAsPlugin(server: McpServer) {
  const database = await getDb();
  const [created] = await database
    .insert(userPlugin)
    .values({
      authType: server.authType,
      description: server.description ?? "",
      icon: lucideIcon(server.icon),
      isEnabled: server.isEnabled,
      kind: "mcp",
      mcpServerId: server.id,
      name: server.name,
      rateLimitPerMin: server.rateLimitPerMin,
      requireApproval: server.requireApproval,
      timeoutMs: server.timeoutMs,
      transport: server.transport,
      url: server.url,
      userId: server.userId,
      version: "1.0.0",
    })
    .onConflictDoNothing({ target: userPlugin.mcpServerId })
    .returning();
  if (created) {
    return created;
  }
  const [existing] = await database
    .select()
    .from(userPlugin)
    .where(eq(userPlugin.mcpServerId, server.id))
    .limit(1);
  return existing ?? null;
}

async function loadViews(userId: string): Promise<UserPluginView[]> {
  const database = await getDb();
  const rows = await database
    .select()
    .from(userPlugin)
    .where(eq(userPlugin.userId, userId));
  const servers = await database
    .select()
    .from(mcpServer)
    .where(eq(mcpServer.userId, userId));
  const serverById = new Map(servers.map((server) => [server.id, server]));
  const pluginSecrets = await database
    .select({
      key: userPluginSecret.key,
      pluginId: userPluginSecret.pluginId,
    })
    .from(userPluginSecret)
    .where(eq(userPluginSecret.userId, userId));
  const serverSecrets = await database
    .select({
      key: mcpServerSecret.key,
      serverId: mcpServerSecret.serverId,
    })
    .from(mcpServerSecret)
    .where(eq(mcpServerSecret.userId, userId));
  const secretKeys = new Set(
    pluginSecrets.map((row) => `${row.pluginId}:${row.key}`)
  );
  const serverHasSecret = new Set(serverSecrets.map((row) => row.serverId));

  return rows
    .map((row) => {
      const server = row.mcpServerId
        ? serverById.get(row.mcpServerId)
        : undefined;
      const cache = Array.isArray(server?.toolsCache) ? server.toolsCache : [];
      const tools = cache.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const record = item as { description?: unknown; name?: unknown };
        if (typeof record.name !== "string") return [];
        return [
          {
            description:
              typeof record.description === "string"
                ? record.description.slice(0, 240)
                : "",
            name: record.name.slice(0, 80),
          },
        ];
      });
      const connected =
        row.kind === "oauth" && secretKeys.has(`${row.id}:access_token`);
      const hasSecret =
        secretKeys.has(`${row.id}:client_secret`) ||
        (row.mcpServerId ? serverHasSecret.has(row.mcpServerId) : false);
      return {
        apiBaseUrl: row.apiBaseUrl,
        authorizeUrl: row.authorizeUrl,
        authType: row.authType,
        clientId: row.clientId,
        connected,
        connectedAccount: row.connectedAccount,
        description: row.description,
        hasSecret,
        hosts: asStringList(row.hosts),
        icon: row.icon,
        id: row.id,
        isEnabled: row.isEnabled,
        kind: row.kind,
        mcpServerId: row.mcpServerId,
        name: row.name,
        rateLimitPerMin: row.rateLimitPerMin,
        requireApproval: row.requireApproval,
        scopes: row.scopes,
        templateId: server?.templateId ?? null,
        timeoutMs: row.timeoutMs,
        tokenUrl: row.tokenUrl,
        tools,
        transport: row.transport,
        url: row.url,
        version: row.version,
      } satisfies UserPluginView;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function listUserPlugins(userId: string) {
  return loadViews(userId);
}

export async function getUserPlugin(userId: string, id: string) {
  const views = await loadViews(userId);
  return views.find((plugin) => plugin.id === id) ?? null;
}

async function countPlugins(userId: string) {
  const database = await getDb();
  const [row] = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(userPlugin)
    .where(eq(userPlugin.userId, userId));
  return row?.total ?? 0;
}

export async function createUserPlugin(
  userId: string,
  input: UserPluginCreateInput
) {
  if ((await countPlugins(userId)) >= MAX_USER_PLUGINS) {
    throw new UserPluginError(
      `Vous avez atteint ${MAX_USER_PLUGINS} plugins personnels.`
    );
  }
  if (input.kind === "mcp") {
    return createMcpPlugin(userId, input);
  }
  return createOauthPlugin(userId, input);
}

async function createMcpPlugin(
  userId: string,
  input: Extract<UserPluginCreateInput, { kind: "mcp" }>
) {
  const url = await assertHttps(input.url, "L'URL du serveur");
  const token = input.token?.trim() ?? "";
  const headers = input.headers ?? [];
  if (input.authType === "bearer" && !token) {
    throw new UserPluginError("Le jeton bearer est requis.");
  }
  if (input.authType === "custom_headers" && headers.length === 0) {
    throw new UserPluginError("Ajoutez au moins un en-tête.");
  }
  await requireVault(input.authType !== "none");
  const server = await createMcpServer({
    authType: input.authType,
    description: input.description,
    icon: input.icon,
    isEnabled: true,
    name: input.name,
    rateLimitPerMin: input.rateLimitPerMin,
    requireApproval: input.requireApproval,
    timeoutMs: input.timeoutMs,
    transport: input.transport,
    url: url.toString(),
    userId,
  });
  try {
    if (input.authType === "bearer") {
      await persistInlineMcpSecrets({
        authConfig: { token },
        serverId: server.id,
        userId,
      });
    }
    if (input.authType === "custom_headers") {
      await persistInlineMcpSecrets({
        headers: Object.fromEntries(
          headers.map((header) => [header.name, header.value])
        ),
        serverId: server.id,
        userId,
      });
    }
    await linkMcpServerAsPlugin({
      ...server,
      description: input.description,
      icon: input.icon,
      name: input.name,
      url: url.toString(),
    });
    const database = await getDb();
    await database
      .update(userPlugin)
      .set({ version: input.version })
      .where(
        and(
          eq(userPlugin.mcpServerId, server.id),
          eq(userPlugin.userId, userId)
        )
      );
  } catch (error) {
    await deleteMcpServer({ id: server.id, userId }).catch(() => undefined);
    throw error;
  }
  const view = (await listUserPlugins(userId)).find(
    (plugin) => plugin.mcpServerId === server.id
  );
  if (!view) {
    throw new UserPluginError("Le plugin n'a pas pu être enregistré.");
  }
  return view;
}

async function createOauthPlugin(
  userId: string,
  input: Extract<UserPluginCreateInput, { kind: "oauth" }>
) {
  await requireVault(true);
  const authorize = await assertHttps(
    input.authorizeUrl,
    "L'URL d'autorisation"
  );
  const tokenUrl = await assertHttps(input.tokenUrl, "L'URL de jeton");
  const apiBase = await assertHttps(input.apiBaseUrl, "L'URL d'API");
  const hosts = hostsFor(apiBase, input.hosts);
  const database = await getDb();
  const [row] = await database
    .insert(userPlugin)
    .values({
      apiBaseUrl: apiBase.toString().replace(/\/$/, ""),
      authorizeUrl: authorize.toString(),
      clientId: input.clientId,
      description: input.description,
      hosts,
      icon: input.icon,
      isEnabled: false,
      kind: "oauth",
      name: input.name,
      scopes: input.scopes,
      tokenUrl: tokenUrl.toString(),
      userId,
      version: input.version,
    })
    .returning();
  if (!row) {
    throw new UserPluginError("Le plugin n'a pas pu être enregistré.");
  }
  try {
    await upsertPluginSecret({
      key: "client_secret",
      kind: "auth",
      pluginId: row.id,
      userId,
      value: input.clientSecret,
    });
  } catch (error) {
    await database.delete(userPlugin).where(eq(userPlugin.id, row.id));
    throw error;
  }
  const view = await getUserPlugin(userId, row.id);
  if (!view) {
    throw new UserPluginError("Le plugin n'a pas pu être enregistré.");
  }
  return view;
}

async function upsertPluginSecret(params: {
  key: string;
  kind: "auth" | "env" | "header";
  pluginId: string;
  userId: string;
  value: string;
}) {
  await requireVault(true);
  const database = await getDb();
  await database
    .insert(userPluginSecret)
    .values({
      encryptedValue: encrypt(params.value),
      key: params.key,
      kind: params.kind,
      pluginId: params.pluginId,
      userId: params.userId,
    })
    .onConflictDoUpdate({
      set: { encryptedValue: encrypt(params.value) },
      target: [
        userPluginSecret.pluginId,
        userPluginSecret.kind,
        userPluginSecret.key,
      ],
    });
}

export async function updateUserPlugin(
  userId: string,
  id: string,
  input: UserPluginUpdateInput
) {
  const current = await getOwnedRow(userId, id);
  if (!current) {
    return null;
  }
  if (
    current.kind === "mcp" &&
    current.transport &&
    !["http", "sse"].includes(current.transport) &&
    (input.url || input.transport || input.authType || input.token)
  ) {
    throw new UserPluginError(
      "Ce plugin historique n'utilise pas un transport HTTP. Seuls le nom, l'icône, la version et l'activation peuvent changer."
    );
  }
  const patch: Partial<typeof userPlugin.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.icon) patch.icon = input.icon;
  if (input.version) patch.version = input.version;
  if (input.isEnabled !== undefined) patch.isEnabled = input.isEnabled;
  if (current.kind === "mcp") {
    if (input.requireApproval) patch.requireApproval = input.requireApproval;
    if (input.timeoutMs) patch.timeoutMs = input.timeoutMs;
    if (input.rateLimitPerMin) patch.rateLimitPerMin = input.rateLimitPerMin;
    if (input.transport) patch.transport = input.transport;
    if (input.authType) patch.authType = input.authType;
    if (input.url) {
      const url = await assertHttps(input.url, "L'URL du serveur");
      patch.url = url.toString();
    }
  }
  if (current.kind === "oauth") {
    if (input.clientId) patch.clientId = input.clientId;
    if (input.scopes !== undefined) patch.scopes = input.scopes;
    if (input.authorizeUrl) {
      patch.authorizeUrl = (
        await assertHttps(input.authorizeUrl, "L'URL d'autorisation")
      ).toString();
    }
    if (input.tokenUrl) {
      patch.tokenUrl = (
        await assertHttps(input.tokenUrl, "L'URL de jeton")
      ).toString();
    }
    if (input.apiBaseUrl || input.hosts) {
      const base = await assertHttps(
        input.apiBaseUrl ?? current.apiBaseUrl ?? "",
        "L'URL d'API"
      );
      patch.apiBaseUrl = base.toString().replace(/\/$/, "");
      patch.hosts = hostsFor(base, input.hosts ?? asStringList(current.hosts));
    }
  }
  const database = await getDb();
  await database
    .update(userPlugin)
    .set(patch)
    .where(and(eq(userPlugin.id, id), eq(userPlugin.userId, userId)));
  if (current.kind === "mcp" && current.mcpServerId) {
    const authType = patch.authType;
    const requireApproval = patch.requireApproval;
    const transport = patch.transport;
    await updateMcpServer({
      data: {
        ...(patch.description === undefined
          ? {}
          : { description: patch.description }),
        ...(patch.icon ? { icon: patch.icon } : {}),
        ...(patch.isEnabled === undefined
          ? {}
          : { isEnabled: patch.isEnabled }),
        ...(patch.name ? { name: patch.name } : {}),
        ...(patch.rateLimitPerMin
          ? { rateLimitPerMin: patch.rateLimitPerMin }
          : {}),
        ...(patch.timeoutMs ? { timeoutMs: patch.timeoutMs } : {}),
        ...(patch.url ? { url: patch.url } : {}),
        ...(authType === "none" ||
        authType === "bearer" ||
        authType === "custom_headers"
          ? { authType }
          : {}),
        ...(requireApproval === "always_allow" ||
        requireApproval === "ask_permission" ||
        requireApproval === "write_only"
          ? { requireApproval }
          : {}),
        ...(transport === "http" || transport === "sse" ? { transport } : {}),
      },
      id: current.mcpServerId,
      userId,
    });
    if (input.token) {
      await persistInlineMcpSecrets({
        authConfig: { token: input.token },
        preserveExisting: true,
        serverId: current.mcpServerId,
        userId,
      });
    }
    if (input.headers && input.headers.length > 0) {
      await persistInlineMcpSecrets({
        headers: Object.fromEntries(
          input.headers.map((header) => [header.name, header.value])
        ),
        preserveExisting: true,
        serverId: current.mcpServerId,
        userId,
      });
    }
  }
  if (current.kind === "oauth" && input.clientSecret) {
    await upsertPluginSecret({
      key: "client_secret",
      kind: "auth",
      pluginId: id,
      userId,
      value: input.clientSecret,
    });
  }
  return getUserPlugin(userId, id);
}

export async function deleteUserPlugin(userId: string, id: string) {
  const current = await getOwnedRow(userId, id);
  if (!current) {
    return false;
  }
  const database = await getDb();
  await database
    .delete(userPlugin)
    .where(and(eq(userPlugin.id, id), eq(userPlugin.userId, userId)));
  if (current.mcpServerId) {
    await deleteMcpServer({ id: current.mcpServerId, userId });
  }
  return true;
}

async function getOwnedRow(userId: string, id: string) {
  const database = await getDb();
  const [row] = await database
    .select()
    .from(userPlugin)
    .where(and(eq(userPlugin.id, id), eq(userPlugin.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function readPluginSecret(params: {
  key: string;
  pluginId: string;
  userId: string;
}) {
  const database = await getDb();
  const [row] = await database
    .select()
    .from(userPluginSecret)
    .where(
      and(
        eq(userPluginSecret.pluginId, params.pluginId),
        eq(userPluginSecret.userId, params.userId),
        eq(userPluginSecret.key, params.key)
      )
    )
    .limit(1);
  if (!row) {
    return null;
  }
  const value = decrypt(row.encryptedValue);
  return value || null;
}

export async function storeOauthAccessToken(params: {
  accessToken: string;
  accountLabel: string;
  pluginId: string;
  userId: string;
}) {
  await upsertPluginSecret({
    key: "access_token",
    kind: "auth",
    pluginId: params.pluginId,
    userId: params.userId,
    value: params.accessToken,
  });
  const database = await getDb();
  await database
    .update(userPlugin)
    .set({
      connectedAccount: params.accountLabel.slice(0, 120),
      isEnabled: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userPlugin.id, params.pluginId),
        eq(userPlugin.userId, params.userId)
      )
    );
}

const PATH_OK = /^\/(?!\/)(?!.*\.\.)[A-Za-z0-9._~!$&'()*+,;=:@%/-]{0,300}$/;
const QUERY_KEY = /^[A-Za-z0-9_-]{1,40}$/;

export async function readUserOauthResource(params: {
  path: string;
  pluginId: string;
  query?: Record<string, string>;
  userId: string;
}) {
  const row = await getOwnedRow(params.userId, params.pluginId);
  if (!row) {
    return { error: "Plugin OAuth introuvable ou désactivé." };
  }
  if (row.kind !== "oauth" || !row.isEnabled) {
    return { error: "Plugin OAuth introuvable ou désactivé." };
  }
  if (!row.apiBaseUrl || !PATH_OK.test(params.path)) {
    return { error: "Chemin refusé." };
  }
  const token = await readPluginSecret({
    key: "access_token",
    pluginId: row.id,
    userId: params.userId,
  });
  if (!token) {
    return {
      error: `Le plugin « ${row.name} » n'est pas connecté. Ouvrez sa fiche et lancez la connexion OAuth.`,
    };
  }
  let url: URL;
  try {
    const base = new URL(row.apiBaseUrl);
    const prefix = base.pathname.replace(/\/$/, "");
    url = new URL(base.origin);
    url.pathname = `${prefix}${params.path}`;
  } catch {
    return { error: "Adresse d'API invalide." };
  }
  const allowed = new Set(asStringList(row.hosts));
  if (url.protocol !== "https:" || !allowed.has(url.host)) {
    return { error: "Hôte non déclaré pour ce plugin." };
  }
  const query = params.query ?? {};
  const keys = Object.keys(query);
  if (keys.length > 12 || keys.some((key) => !QUERY_KEY.test(key))) {
    return { error: "Paramètres de requête refusés." };
  }
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value.slice(0, 200));
  }
  const checked = await validateAndResolveUrl(url.toString());
  if (checked.error || !checked.host) {
    return { error: checked.error ?? "Hôte refusé." };
  }
  const result = await boundedFetchJson<unknown>(checked.host.url, {
    headers: { Authorization: `Bearer ${token}` },
    maxBytes: 1_000_000,
    timeoutMs: 12_000,
  });
  if (!result.ok) {
    return { error: describeFailure(result, 12_000) };
  }
  const text = JSON.stringify(result.data);
  return {
    plugin: row.name,
    result: text.length > 12_000 ? `${text.slice(0, 12_000)}…` : result.data,
    source: { title: row.name, url: url.origin + url.pathname },
  };
}
