import "server-only";

import { tierMeetsMinimum } from "@/lib/auth/plan";
import {
  createMcpServer,
  getMcpServerByTemplateId,
  getUserMcpPrefs,
} from "@/lib/db/queries";
import { getMcpTemplate } from "./catalog";
import type { McpTemplateManifest } from "./types";

// Installation d'un modèle MCP : une seule implémentation pour la route
// `/api/mcp/templates` (écran /mcp) et `/api/mcp/templates/install` (page
// Applications → MCP). Aucun secret n'est écrit ici : la configuration est
// créée sans token, désactivée tant qu'un credential requis manque, et
// l'utilisateur renseigne ensuite les valeurs via le stockage chiffré.
export type McpTemplateInstallFailure = {
  code:
    | "access_denied"
    | "conflict"
    | "internal_error"
    | "not_found"
    | "plan_required";
  message: string;
  ok: false;
};

export type McpTemplateInstallSuccess = {
  ok: true;
  /** Un serveur issu de ce modèle existait déjà : rien n'a été dupliqué. */
  alreadyInstalled: boolean;
  message: string;
  server: Awaited<ReturnType<typeof createMcpServer>>;
  template: McpTemplateManifest;
  /** Des credentials restent à renseigner avant activation. */
  requiresConfiguration: boolean;
};

export type McpTemplateInstallResult =
  | McpTemplateInstallSuccess
  | McpTemplateInstallFailure;

export function splitTemplateArgs(args?: string): string[] {
  return args ? args.split(" ").filter(Boolean) : [];
}

export function templateRequiresConfiguration(
  template: McpTemplateManifest
): boolean {
  return template.credentials.some((credential) => credential.required);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function installMcpTemplate(params: {
  templateId: string;
  tier: string | null | undefined;
  userId: string;
}): Promise<McpTemplateInstallResult> {
  const template = getMcpTemplate(params.templateId);
  if (!template) {
    return {
      code: "not_found",
      message: "Modèle MCP introuvable.",
      ok: false,
    };
  }

  if (!tierMeetsMinimum(params.tier, template.minTier)) {
    return {
      code: "plan_required",
      message: `Ce modèle nécessite le forfait ${template.minTier}.`,
      ok: false,
    };
  }

  // Intégration réelle mais non installable (OAuth interactif non implémenté) :
  // on refuse explicitement au lieu de créer un serveur inerte.
  if (template.activation === "requires_oauth_flow") {
    return {
      code: "conflict",
      message: `« ${template.name} » utilise un flux OAuth 2.0 interactif qui n'est pas encore pris en charge par mAI Web. Consultez la fiche du modèle pour l'alternative recommandée.`,
      ok: false,
    };
  }

  try {
    const prefs = await getUserMcpPrefs(params.userId);
    if (prefs.globalKillSwitch) {
      return {
        code: "access_denied",
        message: "MCP désactivé globalement par l'administrateur.",
        ok: false,
      };
    }
    if (template.transport === "stdio" && !prefs.allowStdio) {
      return {
        code: "access_denied",
        message: "Transport stdio désactivé dans vos paramètres MCP.",
        ok: false,
      };
    }
  } catch {
    // Préférences indisponibles : la création se poursuit (aucune capacité
    // supplémentaire n'est accordée par ce chemin).
  }

  // Installation idempotente : un serveur déjà issu de ce modèle est réutilisé
  // (index unique partiel « McpServer_userId_templateId_key », migration 0019).
  const existing = await getMcpServerByTemplateId({
    templateId: template.id,
    userId: params.userId,
  });
  if (existing) {
    return {
      alreadyInstalled: true,
      message: `Le serveur « ${existing.name} » est déjà installé depuis ce modèle.`,
      ok: true,
      requiresConfiguration: !existing.isEnabled,
      server: existing,
      template,
    };
  }

  const requiresConfiguration = templateRequiresConfiguration(template);
  const readOnlyPolicy =
    template.readOnly && template.requireApproval === "always_allow";

  let server: Awaited<ReturnType<typeof createMcpServer>>;
  try {
    server = await createMcpServer({
      args: splitTemplateArgs(template.args),
      authType: template.authType,
      command: template.command ?? undefined,
      description: template.description,
      // Uniquement des variables NON sensibles déclarées par le modèle.
      env: template.env ?? undefined,
      icon: template.icon.name.toLowerCase(),
      // Un serveur qui attend un token n'est pas activé tant qu'il manque : cela
      // évite des appels voués à l'échec et un faux état « connecté ».
      isEnabled: !requiresConfiguration,
      name: template.name,
      rateLimitPerMin: 60,
      requireApproval: readOnlyPolicy
        ? "always_allow"
        : template.requireApproval,
      templateId: template.id,
      timeoutMs: 20_000,
      transport: template.transport,
      url: template.url ?? undefined,
      userId: params.userId,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const concurrent = await getMcpServerByTemplateId({
        templateId: template.id,
        userId: params.userId,
      });
      if (concurrent) {
        return {
          alreadyInstalled: true,
          message: `Le serveur « ${concurrent.name} » est déjà installé depuis ce modèle.`,
          ok: true,
          requiresConfiguration: !concurrent.isEnabled,
          server: concurrent,
          template,
        };
      }
    }
    return {
      code: "internal_error",
      message:
        "L'installation du serveur MCP a échoué. Réessayez dans un instant.",
      ok: false,
    };
  }

  return {
    alreadyInstalled: false,
    message: requiresConfiguration
      ? `Serveur « ${template.name} » installé (désactivé). Renseignez ${
          template.credentials.filter((credential) => credential.required)
            .length > 1
            ? "les tokens"
            : "le token"
        } dans la fiche du serveur, puis activez-le.`
      : `Serveur « ${template.name} » installé et activé.`,
    ok: true,
    requiresConfiguration,
    server,
    template,
  };
}
