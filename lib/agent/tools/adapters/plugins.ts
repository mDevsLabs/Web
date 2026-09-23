import "server-only";

import type { Tool } from "ai";
import type { ZodType } from "zod";
import { defineTool, toRegisteredTool } from "@/lib/agent/tools/define-tool";
import { toolSuccess, type AgentSource } from "@/lib/agent/types";
import { getPluginInstallationsByUserId } from "@/lib/db/queries";
import { getPluginManifest } from "@/lib/plugins/catalog";
import { PLUGIN_DEFINITION_LIST, createPluginTools } from "@/lib/plugins/server";
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
    if (typeof reference?.url !== "string" || !reference.url.startsWith("https://")) return [];
    let url: string;
    try {
      url = new URL(reference.url).href;
    } catch {
      return [];
    }
    return [{
      id: `${pluginId}-${toolId}-${index + 1}`,
      kind: "plugin",
      metadata: { pluginId, toolId },
      title: typeof reference.title === "string" ? reference.title.slice(0, 160) : pluginId,
      toolId,
      url,
    }];
  });
}

export function listPluginAgentTools(pluginIds: string[]) {
  const allowed = new Set(pluginIds);
  const implementations = createPluginTools({}, pluginIds);
  return PLUGIN_DEFINITION_LIST.filter((definition) => allowed.has(definition.manifest.id))
    .flatMap((definition) => definition.manifest.tools.flatMap((manifestTool) => {
      const implementation = implementations[manifestTool.id] as Tool | undefined;
      if (!implementation?.execute || !implementation.inputSchema) return [];
      const name = `${definition.manifest.name} · ${manifestTool.label}`;
      const agentTool = defineTool<unknown>({
        availability: {
          categories: ["plugins"],
          requires: { tools: true },
          tiers: ["plus", "pro", "max"],
        },
        category: "plugins",
        description: `${definition.manifest.name} — ${manifestTool.description} ${manifestTool.systemHint}`,
        execute: async (input, context) => {
          const output: unknown = await implementation.execute!(input as never, {
            abortSignal: context.signal,
            context: undefined,
            messages: [],
            toolCallId: context.toolCallId,
          });
          return toolSuccess(output, resultSources(output, definition.manifest.id, manifestTool.id));
        },
        id: manifestTool.id,
        name,
        permissions: definition.manifest.permissions.writesUserData || definition.manifest.permissions.requiresApproval
          ? { default: "ask", impact: "external_mutation", readOnly: false }
          : { default: "auto", impact: "read", readOnly: true },
        schema: implementation.inputSchema as ZodType<unknown>,
        source: "plugin",
      });
      return [toRegisteredTool(agentTool)];
    }));
}

export async function listInstalledPluginAgentTools(params: {
  tier: string;
  userId: string;
}) {
  const installations = await getPluginInstallationsByUserId({ userId: params.userId });
  const pluginIds = installations
    .flatMap((installation) => {
      if (!installation.isEnabled) return [];
      const plugin = getPluginManifest(installation.pluginId);
      return plugin && canUsePlugin(plugin, params.tier) ? [plugin.id] : [];
    });
  return { pluginIds, tools: listPluginAgentTools(pluginIds) };
}

export function getMentionedPluginToolIds(task: string, pluginIds: string[]) {
  const allowed = new Set(pluginIds);
  return PLUGIN_DEFINITION_LIST
    .filter((definition) => {
      if (!allowed.has(definition.manifest.id)) return false;
      const escapedName = definition.manifest.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|\\s)@${escapedName}(?=\\s|$)`, "i").test(task);
    })
    .flatMap((definition) => definition.manifest.tools.map((pluginTool) => pluginTool.id));
}

const TOOL_INTENT_TERMS: Record<string, string[]> = {
  getWeather: ["météo", "température", "prévision météo", "weather", "pluie"],
  getAirQuality: ["qualité de l'air", "pollution", "pollen", "pm2.5", "indice air"],
  quizzly: ["quiz", "questionnaire", "tester mes connaissances"],
  jsonToolbox: ["json", "minifier json", "valider json", "formater json"],
  frHolidays: ["jour férié français", "jours fériés français", "pont français", "jours ouvrés"],
  internationalHolidays: ["jours fériés", "jour férié", "public holidays", "calendrier férié"],
  isPublicHoliday: ["est férié", "jour férié le", "date fériée", "public holiday on"],
  getHolidayLongWeekends: ["week-end prolongé", "weekends prolongés", "long weekend", "ponts"],
  listHolidayCountries: ["pays pris en charge", "pays disponibles pour les jours fériés"],
  getGithubRepositorySummary: ["dépôt github", "repository", "repo github", "étoiles github", "github summary"],
  listGithubIssues: ["issue github", "issues github", "tickets github", "problèmes github"],
  listGithubReleases: ["release github", "releases", "versions github", "notes de version"],
  readGithubFile: ["fichier github", "code github", "lire le fichier", "contenu du fichier"],
  getFoodProduct: ["code-barres", "code barre", "ean", "produit alimentaire"],
  searchFoodProducts: ["rechercher un aliment", "chercher un produit", "produits alimentaires"],
  compareFoodProducts: ["comparer des produits", "comparaison alimentaire", "comparer ces aliments"],
  getFoodIngredients: ["ingrédients", "allergènes", "traces alimentaires"],
  searchBooks: ["rechercher des livres", "chercher un livre", "livres sur", "catalogue de livres"],
  searchBookByIsbn: ["isbn"],
  getBookWork: ["détails de l'œuvre", "fiche d'œuvre", "ouvrage olid"],
  getAuthorBooks: ["livres de", "ouvrages de", "bibliographie de", "auteur"],
  searchPublications: ["publication scientifique", "article scientifique", "recherche bibliographique", "littérature scientifique"],
  getPublicationByDoi: ["doi", "digital object identifier"],
  searchAuthorPublications: ["publications de", "articles de l'auteur", "travaux de recherche de"],
  searchJournals: ["revue scientifique", "journal académique", "issn", "revues académiques"],
  listWorldBankCountries: ["pays banque mondiale", "pays et régions", "niveau de revenu des pays"],
  searchWorldBankIndicators: ["indicateur banque mondiale", "indicateurs économiques", "indicateur de développement"],
  getWorldBankSeries: ["série chronologique", "évolution de l'indicateur", "historique d'indicateur"],
  compareWorldBankCountries: ["comparer les pays", "comparaison entre pays", "écart entre pays"],
  searchTvShows: ["rechercher une série", "chercher une série", "séries tv", "émission télévisée"],
  getTvShow: ["fiche série", "détails de la série", "informations sur cette série"],
  listTvEpisodes: ["épisodes de", "liste des épisodes", "saison et épisode"],
  getTvSchedule: ["programme tv", "diffusé le", "émissions diffusées", "grille télé"],
};

function normalizeIntent(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function narrowPluginAgentToolsForTask<T extends { id: string; source?: string }>(
  task: string,
  tools: T[],
  pluginIds: string[]
): T[] {
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
    (candidate) => candidate.source !== "plugin" || selectedPluginIds.has(candidate.id)
  );
}
