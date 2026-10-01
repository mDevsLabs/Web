import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteMcpServer,
  getMcpServerById,
  getUserMcpPrefs,
  toggleMcpServer,
  updateMcpServer,
  upsertMcpServerSecret,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { mcpServerToConfig } from "@/lib/mcp/chat-tools";
import { fetchMcpTools, validateMcpConfig } from "@/lib/mcp/client";
import { toMcpServerDto } from "@/lib/mcp/dto";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import {
  assertMcpRuntimeEnabled,
  toMcpRuntimePreferences,
} from "@/lib/mcp/policy";
import { redactMcpError, redactMcpValue } from "@/lib/mcp/redaction";
import {
  isSecretConfigured,
  loadMcpSecretDescriptors,
  mergeMcpSecrets,
} from "@/lib/mcp/secrets-config";
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
  args: z.array(z.string().max(2000)).max(64).optional(),
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
  command: z.string().max(256).nullable().optional(),
  description: z.string().max(1000).optional(),
  env: z.record(z.string(), z.string().max(16_384)).optional(),
  headers: z.record(z.string(), z.string().max(8192)).optional(),
  icon: z.string().max(50).optional(),
  isEnabled: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  rateLimitPerMin: z.number().int().min(1).max(1000).optional(),
  requireApproval: z
    .enum(["always_allow", "ask_permission", "write_only"])
    .optional(),
  timeoutMs: z.number().int().min(1000).max(120_000).optional(),
  toolOverrides: z
    .record(z.string(), toolOverrideSchema)
    .refine(
      (value) =>
        Object.keys(value).every((name) =>
          /^[A-Za-z0-9_.:-]{1,200}$/.test(name)
        ),
      "Nom d'outil MCP invalide"
    )
    .optional(),
  toolsCache: z.array(z.any()).optional(),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).optional(),
  url: z.string().max(4096).nullable().optional(),
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
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return errorResponse("not_found", {
          message: "Serveur MCP introuvable.",
        });
      }
      if (!server.isEnabled) {
        const rawPrefs = await getUserMcpPrefs(userId);
        const prefs = toMcpRuntimePreferences(rawPrefs);
        try {
          assertMcpRuntimeEnabled(
            {
              args: server.args as string[] | undefined,
              command: server.command,
              env: server.env as Record<string, string> | undefined,
              // La ligne est actuellement désactivée ; on contrôle la
              // politique de la future activation, pas son état courant.
              isEnabled: true,
              transport: server.transport as any,
            },
            prefs
          );
        } catch (policyError) {
          return errorResponse("access_denied", {
            message:
              policyError instanceof Error
                ? policyError.message
                : "Activation MCP refusée par la politique de sécurité.",
          });
        }
        const descriptors = await loadMcpSecretDescriptors({
          serverId: id,
          userId,
        });
        const template = server.templateId
          ? (await import("@/lib/mcp-templates/catalog")).getMcpTemplate(
              server.templateId
            )
          : undefined;
        if (
          template &&
          !template.credentials
            .filter((credential) => credential.required)
            .every((credential) =>
              isSecretConfigured(descriptors, credential.key)
            )
        ) {
          return errorResponse("conflict", {
            message: "Renseignez tous les credentials requis avant activation.",
          });
        }
        const effective = mergeMcpSecrets({
          authConfig: server.authConfig,
          authType: server.authType,
          env: server.env,
          headers: server.headers,
          secrets: descriptors,
        });
        validateMcpConfig(
          mcpServerToConfig({
            ...server,
            authConfig: effective.authConfig,
            env: effective.env,
            headers: effective.headers,
          })
        );
      }
      const updated = await toggleMcpServer({ id, userId });
      return Response.json(toMcpServerDto(updated));
    }

    // 1b. Toggle per-tool
    if (json.toggleTool) {
      const toolName = String(json.toggleTool);
      if (!/^[A-Za-z0-9_.:-]{1,200}$/.test(toolName)) {
        return errorResponse("invalid_request", {
          message: "Nom d'outil MCP invalide.",
        });
      }
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return errorResponse("not_found", {
          message: "Serveur MCP introuvable.",
        });
      }
      const overrides = (server.toolOverrides as Record<string, any>) ?? {};
      const current = overrides[toolName]?.enabled ?? true;
      const next = {
        ...overrides,
        [toolName]: {
          enabled: !current,
          requireApproval: overrides[toolName]?.requireApproval ?? null,
        },
      };
      const updated = await updateMcpServer({
        data: { toolOverrides: next } as any,
        id,
        userId,
      });
      return Response.json(toMcpServerDto(updated));
    }

    // 1c. Set per-tool approval
    if (json.setToolApproval) {
      const { toolName, requireApproval } = json.setToolApproval;
      if (
        typeof toolName !== "string" ||
        !/^[A-Za-z0-9_.:-]{1,200}$/.test(toolName) ||
        (requireApproval !== null &&
          !["always_allow", "write_only", "ask_permission"].includes(
            requireApproval
          ))
      ) {
        return errorResponse("invalid_request", {
          message: "Override d'approbation MCP invalide.",
        });
      }
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
      // La politique est relue au moment de l'exécution et fail-closed si
      // elle ne peut pas être vérifiée.
      const rawPrefs = await getUserMcpPrefs(userId).catch((prefsError) => {
        logError("Erreur lecture préférences MCP", {
          reason: redactMcpError(prefsError),
        });
        return null;
      });
      const prefs = toMcpRuntimePreferences(rawPrefs);
      try {
        assertMcpRuntimeEnabled(
          {
            args: server.args as string[] | undefined,
            command: server.command,
            env: server.env as Record<string, string> | undefined,
            isEnabled: server.isEnabled,
            transport: server.transport as any,
          },
          prefs
        );
      } catch (policyError) {
        return errorResponse("access_denied", {
          message:
            policyError instanceof Error
              ? policyError.message
              : "Actualisation MCP refusée par la politique de sécurité.",
        });
      }
      const timeoutMs = (server as any).timeoutMs ?? 15_000;
      const rateLimitPerMin = (server as any).rateLimitPerMin ?? 60;
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
      const effectiveConfig = {
        args: server.args as string[],
        authConfig: effective.authConfig as any,
        authType: server.authType as any,
        command: server.command,
        env: effective.env,
        headers: effective.headers,
        id: server.id,
        name: server.name,
        rateLimitPerMin,
        requireApproval: server.requireApproval as any,
        timeoutMs,
        toolOverrides: server.toolOverrides as any,
        toolsCache: server.toolsCache as any,
        transport: server.transport as any,
        url: server.url,
      };
      validateMcpConfig(effectiveConfig);
      const tools = await fetchMcpTools(effectiveConfig, prefs);

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
        tools: redactMcpValue(tools),
      });
    }

    // 2b. Bulk secrets chiffrés. Le kind (env/auth/header) vient du modèle
    // d'origine (templateId) : chaque credential déclare sa destination à
    // l'appel. Le secret est chiffré ici (AES-256-GCM) et JAMAIS renvoyé,
    // journalisé ni stocké en clair dans la ligne McpServer.
    if (json.encryptedSecrets) {
      const { encrypt } = await import("@/lib/mcp/encryption");
      const { getMcpTemplate } = await import("@/lib/mcp-templates/catalog");
      const current = await getMcpServerById({ id, userId });
      if (!current) {
        return errorResponse("not_found", {
          message: "Serveur MCP introuvable.",
        });
      }
      const template = current.templateId
        ? getMcpTemplate(current.templateId)
        : undefined;
      const input = json.encryptedSecrets as Record<string, unknown>;
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return errorResponse("invalid_request", {
          message: "Secrets MCP invalides.",
        });
      }
      const entries = Object.entries(input).filter(
        ([, value]) => typeof value === "string" && value.trim().length > 0
      ) as Array<[string, string]>;
      if (entries.length > 0 && !isEncryptionConfigured()) {
        return errorResponse("service_unavailable", {
          message:
            "Chiffrement des secrets MCP non configuré sur ce serveur (MCP_ENCRYPTION_KEY absente).",
        });
      }
      for (const [key, value] of entries) {
        if (
          !/^[A-Za-z_][A-Za-z0-9_-]{0,127}$/.test(key) ||
          value.length > 16_384
        ) {
          return errorResponse("invalid_request", {
            message: "Champ de secret MCP invalide.",
          });
        }
        const declared = template?.credentials.find(
          (credential) => credential.key === key
        );
        if (template && !declared) {
          return errorResponse("invalid_request", {
            message: "Champ de secret non déclaré par ce modèle.",
          });
        }
        await upsertMcpServerSecret({
          encryptedValue: encrypt(value),
          key,
          kind: declared?.kind ?? "env",
          serverId: id,
          userId,
        });
      }

      // Recharge l'état complet : un formulaire peut avoir laissé certains
      // champs vides pour les conserver, et l'activation ne doit regarder que
      // les secrets réellement présents.
      const { loadMcpSecretDescriptors } = await import(
        "@/lib/mcp/secrets-config"
      );
      const descriptors = await loadMcpSecretDescriptors({
        serverId: id,
        userId,
      });
      if (!current.isEnabled && template) {
        const nowConfigured = template.credentials
          .filter((credential) => credential.required)
          .every((credential) =>
            descriptors.some((descriptor) => descriptor.key === credential.key)
          );
        let activationAllowed = true;
        try {
          const prefs = toMcpRuntimePreferences(await getUserMcpPrefs(userId));
          assertMcpRuntimeEnabled(
            {
              args: current.args as string[] | undefined,
              command: current.command,
              env: current.env as Record<string, string> | undefined,
              isEnabled: true,
              transport: current.transport as any,
            },
            prefs
          );
        } catch {
          activationAllowed = false;
        }
        if (nowConfigured && activationAllowed) {
          await updateMcpServer({ data: { isEnabled: true }, id, userId });
        }
      }
      return Response.json({ count: entries.length, success: true });
    }

    const current = await getMcpServerById({ id, userId });
    if (!current) {
      return errorResponse("not_found", {
        message: "Serveur MCP introuvable.",
      });
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
    const split = splitInlineSecrets(parsed as Record<string, unknown>);
    const serverRow = split.row;
    const existingDescriptors = await loadMcpSecretDescriptors({
      serverId: id,
      userId,
    });
    const effective = mergeMcpSecrets({
      authConfig: parsed.authConfig ?? current.authConfig,
      authType: parsed.authType ?? current.authType,
      env: parsed.env ?? current.env,
      headers: parsed.headers ?? current.headers,
      secrets: [...existingDescriptors, ...split.values],
    });
    const candidate = {
      ...current,
      ...serverRow,
      authConfig: effective.authConfig,
      authType: parsed.authType ?? current.authType,
      env: effective.env,
      headers: effective.headers,
    } as any;
    const effectiveConfig = mcpServerToConfig(candidate);
    let prefs: ReturnType<typeof toMcpRuntimePreferences>;
    try {
      prefs = toMcpRuntimePreferences(await getUserMcpPrefs(userId));
      assertMcpRuntimeEnabled({ ...effectiveConfig, isEnabled: true }, prefs);
    } catch (policyError) {
      return errorResponse("access_denied", {
        message:
          policyError instanceof Error
            ? policyError.message
            : "Configuration MCP refusée par la politique de sécurité.",
      });
    }
    validateMcpConfig(effectiveConfig);
    if (candidate.isEnabled && current.templateId) {
      const { getMcpTemplate } = await import("@/lib/mcp-templates/catalog");
      const template = getMcpTemplate(current.templateId);
      const allDescriptors = [...existingDescriptors, ...split.values];
      if (
        template &&
        !template.credentials
          .filter((credential) => credential.required)
          .every((credential) =>
            isSecretConfigured(allDescriptors, credential.key)
          )
      ) {
        return errorResponse("conflict", {
          message: "Renseignez tous les credentials requis avant activation.",
        });
      }
    }
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
          preserveExisting: true,
          serverId: id,
          userId,
        });
      } catch (secretsErr) {
        logError("Échec persistance secrets MCP", {
          reason: redactMcpError(secretsErr),
          serverId: id,
        });
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
    logError("Erreur mise à jour serveur MCP", {
      reason: redactMcpError(err),
      serverId: id,
    });
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
