import "server-only";

import { type AgentFlags, getAgentFlags } from "@/lib/agent/flags";
import type { ChatModel } from "@/lib/ai/models";
import {
  type AgentModelEntry,
  getModelEntry,
  isAgentCompatible,
  isModelAllowedForUser,
  type ModelCapabilities,
} from "@/lib/ai/registry";
import { errorResponse } from "@/lib/api/error-response";
import { isPaidTier } from "@/lib/auth/plan";
import type { ChatAuth } from "@/lib/chat/auth";
import { weeklyQuotaExceeded } from "@/lib/chat/auth";
import { MAI_UPGRADE_URL } from "@/lib/constants";

// Garde d'accès Agent : intégralement côté serveur. Le curseur Chat | Agent est
// visible pour tous, mais l'usage réel est refusé ici — c'est cette fonction,
// et non l'interface, qui fait autorité.

export const AGENT_PLAN_REQUIRED_MESSAGE =
  "Agent est disponible avec mAI Plus, Pro et Max.";

export function buildAgentUpgradeDetails(): {
  limit?: number;
  resetAt?: string;
  upgradeUrl: string;
  used?: number;
} {
  return { upgradeUrl: MAI_UPGRADE_URL };
}

export type AgentAccess =
  | { allowed: true; flags: AgentFlags; tier: string }
  | { allowed: false; response: Response };

// Tier impossible à résoudre côté users.tier : refus explicite (utilisateur
// absent de la table, valeur inconnue, base injoignable). Jamais de repli
// implicite : ces cas ne doivent accorder aucun privilège.
export type AgentTierFailure = "missing" | "invalid" | "unavailable";

export function agentTierFailureResponse(reason: AgentTierFailure): Response {
  const details =
    reason === "missing"
      ? "Aucun compte correspondant n'a été trouvé."
      : reason === "invalid"
        ? "Le forfait enregistré pour ce compte est inconnu ou invalide."
        : "Le forfait n'a pas pu être vérifié pour le moment.";
  return errorResponse("plan_required", {
    details: {
      reason,
      ...buildAgentUpgradeDetails(),
    },
    message: `L'accès à Agent requiert un forfait valide. ${details}`,
  });
}

export function checkAgentAccess(auth: ChatAuth): AgentAccess {
  const flags = getAgentFlags();

  if (!flags["agent.enabled"]) {
    return {
      allowed: false,
      response: errorResponse("service_unavailable", {
        message: "L'espace Agent est momentanément indisponible.",
      }),
    };
  }

  if (!isPaidTier(auth.maiUser.tier)) {
    return {
      allowed: false,
      response: errorResponse("plan_required", {
        details: buildAgentUpgradeDetails(),
        message: AGENT_PLAN_REQUIRED_MESSAGE,
      }),
    };
  }

  if (weeklyQuotaExceeded(auth.maiUser)) {
    return {
      allowed: false,
      response: errorResponse("quota_exceeded", {
        details: {
          limit: auth.maiUser.limit,
          resetAt: auth.maiUser.resetAt,
          upgradeUrl: MAI_UPGRADE_URL,
          used: auth.maiUser.tokensUsed,
        },
        message:
          "Votre limite hebdomadaire de tokens est atteinte. Agent réutilise le même quota que le Chat.",
      }),
    };
  }

  return { allowed: true, flags, tier: auth.maiUser.tier };
}

export type AgentModelAccess = {
  capabilities: ModelCapabilities;
  error?: string;
  model: string;
};

// Validation du modèle : disponibilité pour le forfait, support des outils
// (indispensable à Agent) et niveau de réflexion réellement accepté.
export function checkAgentModelAccess(params: {
  // L'entrée résolue est la source de vérité lorsqu'elle est fournie. Elle
  // évite de perdre les capacités et la compatibilité en relisant un autre
  // catalogue (en particulier le fallback local).
  entry?: AgentModelEntry;
  // Catalogue optionnel pour les appelants qui ne transportent pas encore
  // l'entrée complète. Il est transmis à getModelEntry au lieu d'être ignoré.
  models?: ChatModel[];
  // Conservé pour compatibilité avec les appelants qui fournissent seulement
  // les capacités. L'entrée complète reste prioritaire.
  capabilitiesOverride?: ModelCapabilities;
  flags: AgentFlags;
  modelId: string;
  tier: string;
}): AgentModelAccess {
  const entry = params.entry ?? getModelEntry(params.modelId, params.models);
  const capabilities =
    params.entry?.capabilities ??
    params.capabilitiesOverride ??
    entry.capabilities;

  if (!isModelAllowedForUser(entry.id, params.tier)) {
    return {
      capabilities,
      error: `Le modèle « ${entry.name} » n'est pas disponible avec votre forfait.`,
      model: entry.id,
    };
  }

  if (!capabilities.tools) {
    return {
      capabilities,
      error: `Le modèle « ${entry.name} » ne prend pas en charge les outils : Agent ne peut pas fonctionner avec lui. Choisissez un autre modèle.`,
      model: entry.id,
    };
  }

  if (!isAgentCompatible(entry)) {
    return {
      capabilities,
      error: `Le modèle « ${entry.name} » ne prend pas en charge la boucle d'outils Agent.`,
      model: entry.id,
    };
  }

  return { capabilities, model: entry.id };
}

export function normalizeAgentReasoningLevel(params: {
  capabilities: ModelCapabilities;
  flags: AgentFlags;
  requested: unknown;
  fallback: string;
}): "low" | "medium" | "high" {
  const normalized =
    typeof params.requested === "string" ? params.requested : params.fallback;

  if (!params.flags["agent.reasoning"] || !params.capabilities.reasoning) {
    return "medium";
  }
  if (normalized === "low" || normalized === "high") {
    return normalized;
  }
  return "medium";
}
