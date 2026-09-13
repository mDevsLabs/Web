import "server-only";

import { type AgentFlags, getAgentFlags } from "@/lib/agent/flags";
import {
  getModelEntry,
  isModelAllowedForUser,
  type ModelCapabilities,
} from "@/lib/ai/registry";
import { errorResponse } from "@/lib/api/error-response";
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
  flags: AgentFlags;
  modelId: string;
  tier: string;
}): AgentModelAccess {
  const entry = getModelEntry(params.modelId);

  if (!isModelAllowedForUser(entry.id, params.tier)) {
    return {
      capabilities: entry.capabilities,
      error: `Le modèle « ${entry.name} » n'est pas disponible avec votre forfait.`,
      model: entry.id,
    };
  }

  if (!entry.capabilities.tools) {
    return {
      capabilities: entry.capabilities,
      error: `Le modèle « ${entry.name} » ne prend pas en charge les outils : Agent ne peut pas fonctionner avec lui. Choisissez un autre modèle.`,
      model: entry.id,
    };
  }

  return { capabilities: entry.capabilities, model: entry.id };
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
