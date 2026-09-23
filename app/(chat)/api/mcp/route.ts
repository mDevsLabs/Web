import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import {
  createMcpServer,
  getMcpServersByUserId,
  getMcpStats,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { fetchMcpTools } from "@/lib/mcp/client";
import { toMcpServerDto, toMcpServerDtoList } from "@/lib/mcp/dto";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import {
  countInlineSecrets,
  persistInlineMcpSecrets,
  splitInlineSecrets,
} from "@/lib/mcp/secrets-write";

const createMcpSchema = z.object({
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
    .default("none"),
  command: z.string().optional(),
  description: z.string().max(1000).optional(),
  env: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
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
    .optional(),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).default("sse"),
  url: z.string().optional(),
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

    // prefs globales : respect kill-switch / allowStdio
    try {
      const { getUserMcpPrefs } = await import("@/lib/db/queries");
      const prefs = await getUserMcpPrefs(userId);
      if (prefs.globalKillSwitch) {
        return errorResponse("access_denied", {
          message: "MCP désactivé globalement (kill-switch).",
        });
      }
      if (parsed.transport === "stdio" && !prefs.allowStdio) {
        return errorResponse("access_denied", {
          message: "Transport stdio désactivé dans les paramètres.",
        });
      }
    } catch (prefsErr) {
      logError("Erreur vérification préférences MCP", prefsErr);
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

    // Tentative de découverte automatique des outils à la création
    let discoveredTools: any[] = [];
    try {
      discoveredTools = await fetchMcpTools({
        args: parsed.args,
        authConfig: parsed.authConfig,
        authType: parsed.authType,
        command: parsed.command,
        env: parsed.env,
        headers: parsed.headers,
        name: parsed.name,
        timeoutMs: parsed.timeoutMs,
        transport: parsed.transport,
        url: parsed.url,
      });
    } catch (discoveryErr) {
      // Repli volontaire : ne pas bloquer l'enregistrement si le serveur MCP
      // n'est pas encore en ligne (les outils seront synchronisés plus tard).
      console.warn("Découverte des outils MCP impossible :", discoveryErr);
    }

    const created = await createMcpServer({
      ...(serverRow as Record<string, unknown>),
      toolsCache: discoveredTools,
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
        logError("Échec persistance secrets MCP", secretsErr);
        return errorResponse("service_unavailable", {
          message:
            "Le serveur MCP a été créé mais ses secrets n'ont pas pu être chiffrés : aucune valeur secrète n'a été enregistrée en clair.",
        });
      }
    }

    // Notification MCP créé
    try {
      const { createNotification } = await import("@/lib/db/queries");
      createNotification({
        body: `Le serveur MCP "${created.name}" a été ajouté.`,
        link: "/mcp",
        title: "Nouveau MCP ajouté",
        type: "mcp_created",
        userId,
      }).catch((notifErr) => logError("Échec notification MCP", notifErr));
    } catch (notifImportErr) {
      logError("Échec notification MCP", notifImportErr);
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
    logError("Erreur création serveur MCP", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la création du serveur MCP.",
    });
  }
}
