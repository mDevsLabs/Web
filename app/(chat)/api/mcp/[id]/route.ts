import { z } from "zod";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteMcpServer,
  getMcpServerById,
  toggleMcpServer,
  updateMcpServer,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { fetchMcpTools } from "@/lib/mcp/client";

const toolOverrideSchema = z.object({
  enabled: z.boolean(),
  requireApproval: z
    .enum(["always_allow", "write_only", "ask_permission"])
    .nullable()
    .optional(),
});

const updateMcpSchema = z.object({
  args: z.array(z.string()).optional(),
  authConfig: z
    .object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      tokenUrl: z.string().optional(),
      username: z.string().optional(),
    })
    .optional(),
  authType: z
    .enum(["none", "bearer", "basic", "oauth2", "custom_headers"])
    .optional(),
  command: z.string().nullable().optional(),
  description: z.string().max(1000).optional(),
  env: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  icon: z.string().max(50).optional(),
  isEnabled: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  rateLimitPerMin: z.number().int().min(1).max(1000).optional(),
  requireApproval: z
    .enum(["always_allow", "ask_permission", "write_only"])
    .optional(),
  timeoutMs: z.number().int().min(1000).max(120_000).optional(),
  toolOverrides: z.record(z.string(), toolOverrideSchema).optional(),
  toolsCache: z.array(z.any()).optional(),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).optional(),
  url: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  const found = await getMcpServerById({ id, userId });
  if (!found) {
    return Response.json({ error: "Serveur MCP introuvable" }, { status: 404 });
  }

  return Response.json(found);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;

  try {
    const json = await request.json();

    // 1. Bascule d'activation rapide
    if (json.toggleEnabled) {
      const updated = await toggleMcpServer({ id, userId });
      return Response.json(updated);
    }

    // 1b. Toggle per-tool
    if (json.toggleTool) {
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return Response.json(
          { error: "Serveur MCP introuvable" },
          { status: 404 }
        );
      }
      const overrides = (server.toolOverrides as Record<string, any>) ?? {};
      const current = overrides[json.toggleTool]?.enabled ?? true;
      const next = {
        ...overrides,
        [json.toggleTool]: {
          enabled: !current,
          requireApproval: overrides[json.toggleTool]?.requireApproval ?? null,
        },
      };
      const updated = await updateMcpServer({
        data: { toolOverrides: next } as any,
        id,
        userId,
      });
      return Response.json(updated);
    }

    // 1c. Set per-tool approval
    if (json.setToolApproval) {
      const { toolName, requireApproval } = json.setToolApproval;
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return Response.json(
          { error: "Serveur MCP introuvable" },
          { status: 404 }
        );
      }
      const overrides = (server.toolOverrides as Record<string, any>) ?? {};
      const next = {
        ...overrides,
        [toolName]: {
          enabled: overrides[toolName]?.enabled ?? true,
          requireApproval: requireApproval ?? null,
        },
      };
      const updated = await updateMcpServer({
        data: { toolOverrides: next } as any,
        id,
        userId,
      });
      return Response.json(updated);
    }

    // 2. Rafraîchissement des outils en cache
    if (json.refreshTools) {
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return Response.json(
          { error: "Serveur MCP introuvable" },
          { status: 404 }
        );
      }
      // check global kill-switch / allowStdio
      try {
        const { getUserMcpPrefs } = await import("@/lib/db/queries");
        const prefs = await getUserMcpPrefs(userId);
        if (prefs.globalKillSwitch) {
          throw new Error("MCP désactivé globalement");
        }
        if (server.transport === "stdio" && !prefs.allowStdio) {
          throw new Error("Transport stdio désactivé");
        }
      } catch (e: any) {
        if (e.message?.includes("désactivé")) {
          return Response.json({ error: e.message }, { status: 403 });
        }
      }
      const timeoutMs = (server as any).timeoutMs ?? 15_000;
      const tools = await fetchMcpTools({
        args: server.args as string[],
        authConfig: server.authConfig as any,
        authType: server.authType as any,
        command: server.command,
        env: server.env as Record<string, string>,
        headers: server.headers as Record<string, string>,
        name: server.name,
        timeoutMs,
        transport: server.transport as any,
        url: server.url,
      });

      // decrypt env/auth if needed via secrets table
      const updated = await updateMcpServer({
        data: {
          lastSyncAt: new Date(),
          toolsCache: tools,
          uptimeStatus: "online",
        } as any,
        id,
        userId,
      });

      return Response.json({
        message: `${tools.length} outil(s) synchronisé(s)`,
        server: updated,
        tools,
      });
    }

    // 2b. Bulk env chiffré
    if (json.encryptedSecrets) {
      const { encrypt } = await import("@/lib/mcp/encryption");
      const { setMcpServerSecrets } = await import("@/lib/db/queries");
      const secrets: Array<{
        kind: "env" | "auth" | "header";
        key: string;
        encryptedValue: string;
      }> = [];
      for (const [k, v] of Object.entries(
        (json.encryptedSecrets as Record<string, string>) || {}
      )) {
        if (!v) {
          continue;
        }
        secrets.push({
          encryptedValue: encrypt(v as string),
          key: k,
          kind: "env",
        });
      }
      await setMcpServerSecrets({ secrets, serverId: id, userId });
      return Response.json({ count: secrets.length, success: true });
    }

    const parsed = updateMcpSchema.parse(json);
    const updated = await updateMcpServer({
      data: parsed as any,
      id,
      userId,
    });

    if (!updated) {
      return Response.json(
        { error: "Serveur MCP introuvable" },
        { status: 404 }
      );
    }

    return Response.json(updated);
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Erreur lors de la mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;

  const deleted = await deleteMcpServer({ id, userId });
  if (!deleted) {
    return Response.json({ error: "Serveur MCP introuvable" }, { status: 404 });
  }

  return Response.json({
    message: "Serveur MCP supprimé avec succès",
    success: true,
  });
}
