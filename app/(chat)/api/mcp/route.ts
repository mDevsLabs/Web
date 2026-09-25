import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import {
  createMcpServer,
  getMcpServersByUserId,
  getMcpStats,
  getUserMcpPrefs,
  updateMcpServer,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { fetchMcpTools, validateMcpConfig } from "@/lib/mcp/client";
import { toMcpServerDto, toMcpServerDtoList } from "@/lib/mcp/dto";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import {
  assertMcpRuntimeEnabled,
  toMcpRuntimePreferences,
} from "@/lib/mcp/policy";
import { redactMcpError, redactMcpText } from "@/lib/mcp/redaction";
import {
  loadMcpSecretDescriptors,
  mergeMcpSecrets,
} from "@/lib/mcp/secrets-config";
import {
  countInlineSecrets,
  persistInlineMcpSecrets,
  splitInlineSecrets,
} from "@/lib/mcp/secrets-write";
import type { McpServerConfig } from "@/lib/mcp/types";

const createMcpSchema = z.object({
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
    .default("none"),
  command: z.string().max(256).optional(),
  description: z.string().max(1000).optional(),
  env: z.record(z.string(), z.string().max(16_384)).optional(),
  headers: z.record(z.string(), z.string().max(8192)).optional(),
  icon: z.string().max(50).optional(),
  isEnabled: z.boolean().optional(),
  name: z.string().min(1).max(100),
  rateLimitPerMin: z.number().int().min(1).max(1000).optional(),
  requireApproval: z
    .enum(["always_allow", "ask_permission", "write_only"])
    .default("write_only"),
  timeoutMs: z.number().int().min(1000).max(120_000).optional(),
  toolOverrides: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean(),
        requireApproval: z
          .enum(["always_allow", "write_only", "ask_permission"])
          .nullable()
          .optional(),
      })
    )
    .refine(
      (value) =>
        Object.keys(value).every((name) =>
          /^[A-Za-z0-9_.:-]{1,200}$/.test(name)
        ),
      "Nom d'outil MCP invalide"
    )
    .optional(),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).default("sse"),
  url: z.string().max(4096).optional(),
});

export async function GET() {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  const [servers, stats] = await Promise.all([
    getMcpServersByUserId({ userId }),
    getMcpStats({ userId }),
  ]);

  return Response.json({
    // DTO redacté : les colonnes sensibles (authConfig/env/headers) ne
    // repartent jamais vers le client, même si la base en contient encore.
    servers: toMcpServerDtoList(servers),
    stats,
  });
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    const json = await request.json();
    const parsed = createMcpSchema.parse(json);

    // Les préférences sont une autorisation runtime : une erreur de lecture
    // ne doit jamais ouvrir MCP par défaut.
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
          args: parsed.args,
          command: parsed.command,
          env: parsed.env,
          // Création d'une configuration désactivée : le contrôle porte sur
          // les préférences, pas sur l'état futur de la ligne.
          isEnabled: true,
          transport: parsed.transport,
        },
        prefs
      );
    } catch (policyError) {
      return errorResponse("access_denied", {
        message:
          policyError instanceof Error
            ? policyError.message
            : "Configuration MCP refusée par la politique de sécurité.",
      });
    }

    // Validation de transport/auth avant toute écriture : une configuration
    // bearer sans token ou une URL non HTTPS ne doit pas créer un serveur
    // activé qui ne pourra jamais être appelé.
    try {
      validateMcpConfig(parsed as McpServerConfig);
    } catch (validationError) {
      return errorResponse("invalid_request", {
        message: redactMcpError(validationError, "Configuration MCP invalide."),
      });
    }

    // Secrets : refus AVANT toute écriture si le chiffrement dédié n'est pas
    // configuré. L'ancien comportement écrivait une copie EN CLAIR dans les
    // colonnes JSON de McpServer, ce qui rendait le chiffrement purement
    // cosmétique et faisait fuiter les valeurs par les réponses API.
    const inlineSecretCount = countInlineSecrets(parsed);
    if (inlineSecretCount > 0 && !isEncryptionConfigured()) {
      return errorResponse("service_unavailable", {
        message:
          "Chiffrement des secrets MCP non configuré sur ce serveur (MCP_ENCRYPTION_KEY absente) : aucune valeur secrète n'a été enregistrée.",
      });
    }
    const { row: serverRow } = splitInlineSecrets(
      parsed as Record<string, unknown>
    );

    // La ligne est créée sans secrets. La découverte est déclenchée après
    // leur persistance, puis recharge les secrets chiffrés : le payload HTTP
    // brut n'est jamais envoyé au fournisseur.
    let created = await createMcpServer({
      ...(serverRow as Record<string, unknown>),
      toolsCache: [],
      userId,
    } as any);

    // Persister les secrets UNIQUEMENT dans le stockage chiffré dédié.
    if (inlineSecretCount > 0) {
      try {
        await persistInlineMcpSecrets({
          authConfig: parsed.authConfig,
          env: parsed.env,
          headers: parsed.headers,
          serverId: created.id,
          userId,
        });
      } catch (secretsErr) {
        logError("Échec persistance secrets MCP", {
          reason: redactMcpError(secretsErr),
          serverId: created.id,
        });
        return errorResponse("service_unavailable", {
          message:
            "Le serveur MCP a été créé mais ses secrets n'ont pas pu être chiffrés : aucune valeur secrète n'a été enregistrée en clair.",
        });
      }
    }

    // Découverte après chargement des secrets. En cas d'indisponibilité du
    // fournisseur, la ligne reste installée et pourra être synchronisée plus
    // tard via PATCH /api/mcp/:id.
    if (created.isEnabled) {
      try {
        const descriptors = await loadMcpSecretDescriptors({
          serverId: created.id,
          userId,
        });
        const effective = mergeMcpSecrets({
          authConfig: created.authConfig,
          authType: created.authType,
          env: created.env,
          headers: created.headers,
          secrets: descriptors,
        });
        const effectiveConfig = {
          ...(created as any),
          authConfig: effective.authConfig,
          env: effective.env,
          headers: effective.headers,
          toolsCache: [],
        };
        validateMcpConfig(effectiveConfig);
        const discoveredTools = await fetchMcpTools(effectiveConfig, prefs);
        const updated = await updateMcpServer({
          data: { toolsCache: discoveredTools },
          id: created.id,
          userId,
        });
        created = updated ?? { ...created, toolsCache: discoveredTools };
      } catch (discoveryError: unknown) {
        console.warn(
          `[mcp] create_discovery_failed server=${created.id} reason=${redactMcpError(discoveryError)}`
        );
      }
    }

    // Notification MCP créé
    try {
      const { createNotification } = await import("@/lib/db/queries");
      createNotification({
        body: `Le serveur MCP « ${redactMcpText(created.name, 120)} » a été ajouté.`,
        link: "/mcp",
        title: "Nouveau MCP ajouté",
        type: "mcp_created",
        userId,
      }).catch((notifErr) =>
        logError("Échec notification MCP", {
          reason: redactMcpError(notifErr),
        })
      );
    } catch (notifImportErr) {
      logError("Échec notification MCP", {
        reason: redactMcpError(notifImportErr),
      });
    }

    return Response.json(toMcpServerDto(created), { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur création serveur MCP", {
      reason: redactMcpError(err),
    });
    return errorResponse("internal_error", {
      message: "Erreur lors de la création du serveur MCP.",
    });
  }
}
