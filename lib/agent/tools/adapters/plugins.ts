import "server-only";

import type { Tool } from "ai";
import type { ZodType } from "zod";
import { defineTool, toRegisteredTool } from "@/lib/agent/tools/define-tool";
import {
  type AgentSource,
  type ToolFailure,
  toolFailure,
  toolSuccess,
} from "@/lib/agent/types";
import { getPluginInstallationsByUserId } from "@/lib/db/queries";
import { getPluginManifest } from "@/lib/plugins/catalog";
import {
  createPluginTools,
  PLUGIN_DEFINITION_LIST,
} from "@/lib/plugins/server";
import { canUsePlugin } from "@/lib/plugins/tier-lock";

type PublicReference = { title?: unknown; url?: unknown };

function resultSources(
  output: unknown,
  pluginId: string,
  toolId: string
): AgentSource[] {
  if (!output || typeof output !== "object") return [];
  const value = output as { source?: unknown; sources?: unknown };
  const references = [
    ...(Array.isArray(value.sources) ? value.sources : []),
    ...(value.source ? [value.source] : []),
  ] as PublicReference[];
  return references.flatMap((reference, index) => {
    if (
      typeof reference?.url !== "string" ||
      !reference.url.startsWith("https://")
    )
      return [];
    let url: string;
    try {
      url = new URL(reference.url).href;
    } catch {
      return [];
    }
    return [
      {
        id: `${pluginId}-${toolId}-${index + 1}`,
        kind: "plugin",
        metadata: { pluginId, toolId },
        title:
          typeof reference.title === "string"
            ? reference.title.slice(0, 160)
            : pluginId,
        toolId,
        url,
      },
    ];
  });
}

function legacyPluginFailure(output: unknown): ToolFailure | null {
  if (!output || typeof output !== "object") return null;
  const error = (output as { error?: unknown }).error;
  if (typeof error !== "string" || error.trim().length === 0) return null;
  const normalized = error.toLowerCase();
  const category =
    normalized.includes("429") || normalized.includes("limite")
      ? "transient"
      : normalized.includes("délai") ||
          normalized.includes("timeout") ||
          /service indisponible|http 5\d\d|temporaire/.test(normalized)
        ? "transient"
        : normalized.includes("réseau") || normalized.includes("network")
          ? "transient"
          : "permanent";
  const retryMatch = error.match(/réessayez dans\s+(\d+)/i);
  const retryAfterMs = retryMatch ? Number(retryMatch[1]) * 1000 : undefined;
  return toolFailure(
    category === "permanent"
      ? "plugin_upstream_error"
      : "plugin_transient_error",
    error,
    {
      category,
      ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
      retryable: category === "transient",
    }
  );
}

function pluginTiers(minTier: string): "all" | string[] {
  if (minTier === "free") return "all";
  if (minTier === "pro") return ["pro", "max"];
  if (minTier === "max") return ["max"];
  return ["plus", "pro", "max"];
}

export function listPluginAgentTools(pluginIds: string[]) {
  const allowed = new Set(pluginIds);
  const implementations = createPluginTools({ channel: "agent" }, pluginIds);
  return PLUGIN_DEFINITION_LIST.filter((definition) =>
    allowed.has(definition.manifest.id)
  ).flatMap((definition) =>
    definition.manifest.tools.flatMap((manifestTool) => {
      const implementation = implementations[manifestTool.id] as
        | Tool
        | undefined;
      if (!implementation?.execute || !implementation.inputSchema) return [];
      const name = `${definition.manifest.name} · ${manifestTool.label}`;
      const agentTool = defineTool<unknown>({
        availability: {
          categories: ["plugins"],
          requires: { tools: true },
          tiers: pluginTiers(definition.manifest.minTier),
        },
        category: "plugins",
        description: `${definition.manifest.name} — ${manifestTool.description} ${manifestTool.systemHint}`,
        execute: async (input, context) => {
          const output: unknown = await implementation.execute!(
            input as never,
            {
              abortSignal: context.signal,
              context: undefined,
              messages: [],
              toolCallId: context.toolCallId,
            }
          );
          const failure = legacyPluginFailure(output);
          if (failure) return failure;
          return toolSuccess(
            output,
            resultSources(output, definition.manifest.id, manifestTool.id)
          );
        },
        id: manifestTool.id,
        name,
        permissions:
          definition.manifest.permissions.writesUserData ||
          definition.manifest.permissions.requiresApproval
            ? { default: "ask", impact: "external_mutation", readOnly: false }
            : { default: "auto", impact: "read", readOnly: true },
        schema: implementation.inputSchema as ZodType<unknown>,
        source: "plugin",
      });
      return [toRegisteredTool(agentTool)];
    })
  );
}

export async function listInstalledPluginAgentTools(params: {
  tier: string;
  userId: string;
}) {
  const installations = await getPluginInstallationsByUserId({
    userId: params.userId,
  });
  const pluginIds = installations.flatMap((installation) => {
    if (!installation.isEnabled) return [];
    const plugin = getPluginManifest(installation.pluginId);
    return plugin && canUsePlugin(plugin, params.tier) ? [plugin.id] : [];
  });
  return { pluginIds, tools: listPluginAgentTools(pluginIds) };
}

export function getMentionedPluginToolIds(task: string, pluginIds: string[]) {
  const allowed = new Set(pluginIds);
  return PLUGIN_DEFINITION_LIST.filter((definition) => {
    if (!allowed.has(definition.manifest.id)) return false;
    const escapedName = definition.manifest.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    return new RegExp(`(?:^|\\s)@${escapedName}(?=\\s|$)`, "i").test(task);
  }).flatMap((definition) =>
    definition.manifest.tools.map((pluginTool) => pluginTool.id)
  );
}

const TOOL_INTENT_TERMS: Record<string, string[]> = {
  compareFoodProducts: [
    "comparer des produits",
    "comparaison alimentaire",
    "comparer ces aliments",
  ],
  compareWorldBankCountries: [
    "comparer les pays",
    "comparaison entre pays",
    "écart entre pays",
  ],
  frHolidays: [
    "jour férié français",
    "jours fériés français",
    "pont français",
    "jours ouvrés",
  ],
  getAirQuality: [
    "qualité de l'air",
    "pollution",
    "pollen",
    "pm2.5",
    "indice air",
  ],
  getAuthorBooks: ["livres de", "ouvrages de", "bibliographie de", "auteur"],
  getBookWork: ["détails de l'œuvre", "fiche d'œuvre", "ouvrage olid"],
  getFoodIngredients: ["ingrédients", "allergènes", "traces alimentaires"],
  getFoodProduct: ["code-barres", "code barre", "ean", "produit alimentaire"],
  getGithubRepositorySummary: [
    "dépôt github",
    "repository",
    "repo github",
    "étoiles github",
    "github summary",
  ],
  getHolidayLongWeekends: [
    "week-end prolongé",
    "weekends prolongés",
    "long weekend",
    "ponts",
  ],
  getPublicationByDoi: ["doi", "digital object identifier"],
  getTvSchedule: [
    "programme tv",
    "diffusé le",
    "émissions diffusées",
    "grille télé",
  ],
  getTvShow: [
    "fiche série",
    "détails de la série",
    "informations sur cette série",
  ],
  getWeather: ["météo", "température", "prévision météo", "weather", "pluie"],
  getWorldBankSeries: [
    "série chronologique",
    "évolution de l'indicateur",
    "historique d'indicateur",
  ],
  internationalHolidays: [
    "jours fériés",
    "jour férié",
    "public holidays",
    "calendrier férié",
  ],
  isPublicHoliday: [
    "est férié",
    "jour férié le",
    "date fériée",
    "public holiday on",
  ],
  jsonToolbox: ["json", "minifier json", "valider json", "formater json"],
  listGithubIssues: [
    "issue github",
    "issues github",
    "tickets github",
    "problèmes github",
  ],
  listGithubReleases: [
    "release github",
    "releases",
    "versions github",
    "notes de version",
  ],
  listHolidayCountries: [
    "pays pris en charge",
    "pays disponibles pour les jours fériés",
  ],
  listTvEpisodes: ["épisodes de", "liste des épisodes", "saison et épisode"],
  listWorldBankCountries: [
    "pays banque mondiale",
    "pays et régions",
    "niveau de revenu des pays",
  ],
  quizzly: ["quiz", "questionnaire", "tester mes connaissances"],
  readGithubFile: [
    "fichier github",
    "code github",
    "lire le fichier",
    "contenu du fichier",
  ],
  searchAuthorPublications: [
    "publications de",
    "articles de l'auteur",
    "travaux de recherche de",
  ],
  searchBookByIsbn: ["isbn"],
  searchBooks: [
    "rechercher des livres",
    "chercher un livre",
    "livres sur",
    "catalogue de livres",
  ],
  searchFoodProducts: [
    "rechercher un aliment",
    "chercher un produit",
    "produits alimentaires",
  ],
  searchJournals: [
    "revue scientifique",
    "journal académique",
    "issn",
    "revues académiques",
  ],
  searchPublications: [
    "publication scientifique",
    "article scientifique",
    "recherche bibliographique",
    "littérature scientifique",
  ],
  searchTvShows: [
    "rechercher une série",
    "chercher une série",
    "séries tv",
    "émission télévisée",
  ],
  searchWorldBankIndicators: [
    "indicateur banque mondiale",
    "indicateurs économiques",
    "indicateur de développement",
  ],
};

function normalizeIntent(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function narrowPluginAgentToolsForTask<
  T extends { id: string; source?: string },
>(task: string, tools: T[], pluginIds: string[]): T[] {
  const mentioned = getMentionedPluginToolIds(task, pluginIds);
  const taskText = normalizeIntent(task);
  const selectedPluginIds = new Set(
    mentioned.length > 0
      ? mentioned
      : tools
          .filter((candidate) => candidate.source === "plugin")
          .filter((candidate) =>
            (TOOL_INTENT_TERMS[candidate.id] ?? []).some((term) =>
              taskText.includes(normalizeIntent(term))
            )
          )
          .map((candidate) => candidate.id)
  );
  return tools.filter(
    (candidate) =>
      candidate.source !== "plugin" || selectedPluginIds.has(candidate.id)
  );
}
