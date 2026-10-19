/**
 * Présentation et validation du statut des services, partagées par les deux
 * affichages du Site : la section détaillée du support et la pastille du site
 * vitrine.
 *
 * Ce module existe parce que les deux composants consument la MÊME réponse de
 * `/api/site/v1/status` et doivent donc dire les mêmes mots pour le même état.
 * La duplication de ce genre de table est ce qui a produit le défaut d'origine :
 * la pastille avait son propre vocabulaire de couleurs et son propre état
 * initial, optimiste, qu'aucune erreur ne venait corriger.
 *
 * Pas de `"use client"` : le fichier ne contient que des constantes et des
 * garde-fous, importables côté serveur comme côté client.
 */

import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from "@mdevs/icons";
import {
  SUPPORT_STATUS_VALUES,
  type SupportStatus,
  type SupportStatusResponse,
  type SupportStatusService,
} from "@/components/site/support/support-status-types";

export const STATUS_PRESENTATION: Record<
  SupportStatus,
  {
    label: string;
    description: string;
    dot: string;
    text: string;
    background: string;
    icon: typeof CheckCircle2Icon;
  }
> = {
  HASISSUES: {
    background: "bg-amber-50 border-amber-200",
    description: "Certains services rencontrent des difficultés.",
    dot: "bg-amber-500",
    icon: AlertTriangleIcon,
    label: "Services dégradés",
    text: "text-amber-700",
  },
  MAJOROUTAGE: {
    background: "bg-red-50 border-red-200",
    description: "Une interruption importante est signalée.",
    dot: "bg-red-500",
    icon: AlertTriangleIcon,
    label: "Incident majeur",
    text: "text-red-700",
  },
  MINOROUTAGE: {
    background: "bg-orange-50 border-orange-200",
    description: "Une perturbation mineure est signalée.",
    dot: "bg-orange-500",
    icon: AlertTriangleIcon,
    label: "Incident mineur",
    text: "text-orange-700",
  },
  UNDERMAINTENANCE: {
    background: "bg-blue-50 border-blue-200",
    description: "Une opération de maintenance est en cours.",
    dot: "bg-blue-500",
    icon: InfoIcon,
    label: "Maintenance",
    text: "text-blue-700",
  },
  UNKNOWN: {
    background: "bg-slate-50 border-slate-200",
    description: "Le fournisseur de statut n'a pas répondu.",
    dot: "bg-slate-400",
    icon: InfoIcon,
    label: "État indisponible",
    text: "text-slate-600",
  },
  UP: {
    background: "bg-emerald-50 border-emerald-200",
    description: "Aucun incident majeur signalé.",
    dot: "bg-emerald-500",
    icon: CheckCircle2Icon,
    label: "Opérationnels",
    text: "text-emerald-700",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSupportStatus(value: unknown): value is SupportStatus {
  return (
    typeof value === "string" &&
    (SUPPORT_STATUS_VALUES as readonly string[]).includes(value)
  );
}

function isService(value: unknown): value is SupportStatusService {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isSupportStatus(value.status) &&
    typeof value.description === "string"
  );
}

/**
 * La réponse normalisée de notre propre API, validée avant usage : une page
 * d'erreur HTML ou une réponse d'un autre service ne doit jamais se rendre comme
 * un instantané de statut.
 */
export function isStatusResponse(
  value: unknown
): value is SupportStatusResponse {
  if (!isRecord(value) || !isRecord(value.page)) return false;
  if (
    typeof value.page.name !== "string" ||
    typeof value.page.url !== "string" ||
    !isSupportStatus(value.page.status) ||
    !Array.isArray(value.services) ||
    !value.services.every(isService) ||
    !Array.isArray(value.components) ||
    !value.components.every(isService) ||
    typeof value.updatedAt !== "string" ||
    (value.source !== "instatus" &&
      value.source !== "cache" &&
      value.source !== "fallback") ||
    typeof value.stale !== "boolean"
  ) {
    return false;
  }
  return value.error === undefined || typeof value.error === "string";
}

export function isAbortError(reason: unknown): boolean {
  return (
    (reason instanceof DOMException && reason.name === "AbortError") ||
    (reason instanceof Error && reason.name === "AbortError")
  );
}
