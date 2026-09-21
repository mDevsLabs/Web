import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
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
import { toMcpServerDto } from "@/lib/mcp/dto";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import {
  countInlineSecrets,
  persistInlineMcpSecrets,
  splitInlineSecrets,
} from "@/lib/mcp/secrets-write";

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
    return errorResponse("not_found", {
      message: "Serveur MCP introuvable.",
    });
  }

  // DTO redacté : jamais de valeur secrète dans la réponse, quel que soit
  // l'historique de la ligne en base.
  return Response.json(toMcpServerDto(found));
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
      return Response.json(toMcpServerDto(updated));
    }

    // 1b. Toggle per-tool
    if (json.toggleTool) {
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return errorResponse("not_found", {
          message: "Serveur MCP introuvable.",
        });
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
        return errorResponse("not_found", {
          message: "Serveur MCP introuvable.",
        });
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
      return Response.json(toMcpServerDto(updated));
    }

    // 2. Rafraîchissement des outils en cache
    if (json.refreshTools) {
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return errorResponse("not_found", {
          message: "Serveur MCP introuvable.",
        });
      }
      // check global kill-switch / allowStdio
      try {
        const { getUserMcpPrefs } = await import("@/lib/db/queries");
        const prefs = await getUserMcpPrefs(userId);
        if (prefs.globalKillSwitch) {
          return errorResponse("access_denied", {
            message: "MCP désactivé globalement par l'administrateur.",
          });
        }
        if (server.transport === "stdio" && !prefs.allowStdio) {
          return errorResponse("access_denied", {
            message: "Transport stdio désactivé dans les paramètres.",
          });
        }
      } catch (prefsErr) {
        logError("Erreur vérification préférences MCP", prefsErr);
      }
      const timeoutMs = (server as any).timeoutMs ?? 15_000;
      // Les valeurs réelles viennent du stockage chiffré : la ligne McpServer ne
      // porte plus de secret en clair (colonnes vidées à l'écriture).
      const { loadMcpSecretDescriptors, mergeMcpSecrets } = await import(
        "@/lib/mcp/secrets-config"
      );
      const descriptors = await loadMcpSecretDescriptors({
        serverId: id,
        userId,
      });
      const effective = mergeMcpSecrets({
        authConfig: server.authConfig,
        authType: server.authType,
        env: server.env,
        headers: server.headers,
        secrets: descriptors,
      });
      const tools = await fetchMcpTools({
        args: server.args as string[],
        authConfig: effective.authConfig as any,
        authType: server.authType as any,
        command: server.command,
        env: effective.env,
        headers: effective.headers,
        name: server.name,
        timeoutMs,
        transport: server.transport as any,
        url: server.url,
      });

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
        server: toMcpServerDto(updated),
        tools,
      });
    }

    // 2b. Bulk secrets chiffrés. Le kind (env/auth/header) vient du modèle
    // d'origine (templateId) : chaque credential déclare sa destination à
    // l'appel. Le secret est chiffré ici (AES-256-GCM) et JAMAIS renvoyé,
    // journalisé ni stocké en clair dans la ligne McpServer.
    if (json.encryptedSecrets) {
      const { encrypt } = await import("@/lib/mcp/encryption");
      const { setMcpServerSecrets, getMcpServerById } = await import(
        "@/lib/db/queries"
      );
      const { getMcpTemplate } = await import("@/lib/mcp-templates/catalog");
      const current = await getMcpServerById({ id, userId });
      const template = current?.templateId
        ? getMcpTemplate(current.templateId)
        : undefined;
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
        const declared = template?.credentials.find((c) => c.key === k);
        // Sans modèle déclaré (serveur créé à la main), repli "env" :
        // comportement historique conservé.
        secrets.push({
          encryptedValue: encrypt(v as string),
          key: k,
          kind: declared?.kind ?? "env",
        });
      }
      await setMcpServerSecrets({ secrets, serverId: id, userId });
      // Un serveur qui reçoit son credential requis devient activable : on
      // n'active pas à la place de l'utilisateur, on lève juste le verrou
      // d'incomplétude posé à l'installation.
      if (current && !current.isEnabled && template) {
        const required = template.credentials.filter((c) => c.required);
        const nowConfigured = required.every((c) =>
          secrets.some((s) => s.key === c.key)
        );
        if (required.length > 0 && nowConfigured) {
          const { updateMcpServer } = await import("@/lib/db/queries");
          await updateMcpServer({ data: { isEnabled: true }, id, userId });
        }
      }
      return Response.json({ count: secrets.length, success: true });
    }

    const parsed = updateMcpSchema.parse(json);
    const inlineSecretCount = countInlineSecrets(parsed);
    if (inlineSecretCount > 0 && !isEncryptionConfigured()) {
      return errorResponse("service_unavailable", {
        message:
          "Chiffrement des secrets MCP non configuré sur ce serveur (MCP_ENCRYPTION_KEY absente) : aucune valeur secrète n'a été enregistrée.",
      });
    }
    // Les colonnes JSON sensibles sont vidées dans la ligne : les valeurs
    // partent exclusivement dans `mcp_server_secret` (chiffrées).
    const { row: serverRow } = splitInlineSecrets(
      parsed as Record<string, unknown>
    );
    const updated = await updateMcpServer({
      data: serverRow as any,
      id,
      userId,
    });

    if (!updated) {
      return errorResponse("not_found", {
        message: "Serveur MCP introuvable.",
      });
    }

    if (inlineSecretCount > 0) {
      try {
        await persistInlineMcpSecrets({
          authConfig: parsed.authConfig,
          env: parsed.env,
          headers: parsed.headers,
          serverId: id,
          userId,
        });
      } catch (secretsErr) {
        logError("Échec persistance secrets MCP", secretsErr);
        return errorResponse("service_unavailable", {
          message:
            "Les réglages ont été enregistrés mais les secrets n'ont pas pu être chiffrés : aucune valeur secrète n'a été conservée en clair.",
        });
      }
    }

    return Response.json(toMcpServerDto(updated));
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur mise à jour serveur MCP", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour du serveur MCP.",
    });
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
    return errorResponse("not_found", {
      message: "Serveur MCP introuvable.",
    });
  }

  return Response.json({
    message: "Serveur MCP supprimé avec succès",
    success: true,
  });
}
