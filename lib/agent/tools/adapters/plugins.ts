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
import { createIntegrationSecretResolver } from "@/lib/integrations/tokens";
import {
  isProviderToolName,
  pluginAgentToolDescription,
} from "@/lib/mcp/provider-tool-id";
import { getPluginManifest } from "@/lib/plugins/core/catalog";
import {
  createPluginTools,
  PLUGIN_DEFINITION_LIST,
} from "@/lib/plugins/core/server";
import { toolEffect } from "@/lib/plugins/core/tool-effect";
import type { PluginSecretResolver } from "@/lib/plugins/core/types";
import { listCustomPluginAgentTools } from "@/lib/plugins/core/user-plugin-tools";

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

export function listPluginAgentTools(
  pluginIds: string[],
  deps: { secretResolver?: PluginSecretResolver; userId?: string } = {}
) {
  const allowed = new Set(pluginIds);
  const implementations = createPluginTools(
    { channel: "agent", ...deps },
    pluginIds
  );
  return PLUGIN_DEFINITION_LIST.filter((definition) =>
    allowed.has(definition.manifest.id)
  ).flatMap((definition) =>
    definition.manifest.tools.flatMap((manifestTool) => {
      const implementation = implementations[manifestTool.id] as
        | Tool
        | undefined;
      if (!implementation?.execute || !implementation.inputSchema) return [];
      if (!isProviderToolName(manifestTool.id)) return [];
      const name = `${definition.manifest.name} · ${manifestTool.label}`;
      const agentTool = defineTool<unknown>({
        availability: {
          categories: ["plugins"],
          requires: { tools: true },
          tiers: "all",
        },
        category: "plugins",
        description: pluginAgentToolDescription({
          description: manifestTool.description,
          name: definition.manifest.name,
          systemHint: manifestTool.systemHint,
        }),
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
          toolEffect(definition.manifest, manifestTool) === "write"
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
  tier?: string;
  userId: string;
}) {
  const installations = await getPluginInstallationsByUserId({
    userId: params.userId,
  });
  const pluginIds = installations.flatMap((installation) => {
    if (!installation.isEnabled) return [];
    const plugin = getPluginManifest(installation.pluginId);
    return plugin ? [plugin.id] : [];
  });
  return {
    pluginIds,
    tools: [
      ...listPluginAgentTools(pluginIds, {
        secretResolver: createIntegrationSecretResolver({
          userId: params.userId,
        }),
        userId: params.userId,
      }),
      ...(await listCustomPluginAgentTools(params.userId)),
    ],
  };
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
  airtableCreateRecord: [
    "créer une fiche airtable",
    "ajouter dans airtable",
    "nouvel enregistrement airtable",
  ],
  airtableGetBaseSchema: [
    "schéma airtable",
    "colonnes airtable",
    "tables airtable",
  ],
  airtableListBases: ["bases airtable", "mes bases airtable"],
  airtableListRecords: [
    "enregistrements airtable",
    "lignes airtable",
    "lire airtable",
  ],
  arxivGetPaper: ["article arxiv", "préprint arxiv", "fiche arxiv"],
  arxivSearchPapers: [
    "rechercher sur arxiv",
    "papiers arxiv",
    "publications arxiv",
  ],
  asanaCreateTask: ["créer une tâche asana", "nouvelle tâche asana"],
  asanaListTasks: ["tâches asana", "mes tâches asana"],
  asanaListWorkspaces: ["espaces asana", "workspaces asana"],
  braveNewsSearch: ["actualités brave", "news brave"],
  braveWebSearch: ["recherche brave", "brave search", "chercher sur brave"],
  brevoListContacts: ["contacts brevo", "liste contacts brevo"],
  brevoListLists: ["listes brevo", "listes d'envoi brevo"],
  brevoSendEmail: ["envoyer un email brevo", "mail via brevo"],
  cloudflareGetZone: ["détail zone cloudflare", "zone cloudflare"],
  cloudflareListDnsRecords: [
    "dns cloudflare",
    "enregistrements dns cloudflare",
  ],
  cloudflareListWorkers: ["workers cloudflare", "scripts cloudflare"],
  cloudflareListZones: ["zones cloudflare", "domaines cloudflare"],
  commentGithubIssue: [
    "commenter cette issue",
    "répondre sur github",
    "ajouter un commentaire à l'issue",
  ],
  compareEurostatCountries: [
    "comparer les pays eurostat",
    "comparaison entre pays eurostat",
    "classer les pays",
    "écart entre pays eurostat",
  ],
  compareFoodProducts: [
    "comparer des produits",
    "comparaison alimentaire",
    "comparer ces aliments",
  ],
  compareWeather: [
    "comparer la météo",
    "comparer la meteo",
    "comparaison météo",
    "météo dans plusieurs villes",
    "quelle ville fait le plus chaud",
    "comparer des villes",
  ],
  compareWorldBankCountries: [
    "comparer les pays",
    "comparaison entre pays",
    "écart entre pays",
  ],
  createGithubIssue: [
    "ouvrir une issue",
    "crée une issue github",
    "signaler un bug sur github",
  ],
  createGithubPullRequest: [
    "ouvrir une pull request",
    "crée une pr",
    "proposer mes modifications sur github",
  ],
  discordListChannels: ["salons discord", "canaux discord"],
  discordListGuilds: ["serveurs discord", "guildes discord"],
  discordProfile: ["profil discord", "bot discord"],
  discordReadMessages: ["messages discord", "lire discord"],
  discordSendMessage: ["envoyer sur discord", "message discord"],
  dockerCreateRepo: ["créer un dépôt docker", "nouveau repo docker"],
  dockerListRepos: ["dépôts docker", "images docker hub"],
  dockerListTags: ["tags docker", "étiquettes docker"],
  exchangeConvert: ["convertir devise", "conversion devise", "taux de change"],
  exchangeLatestRates: ["taux de change", "cours des devises"],
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
  getAirQualityOutlook: [
    "prévision de pollution",
    "quand sortir",
    "faire du sport dehors",
    "activité en extérieur",
    "meilleur moment pour sortir",
    "prévision qualité de l'air",
  ],
  getAuthorBooks: ["livres de", "ouvrages de", "bibliographie de", "auteur"],
  getBookWork: ["détails de l'œuvre", "fiche d'œuvre", "ouvrage olid"],
  getEurostatData: [
    "eurostat",
    "données eurostat",
    "statistiques européennes",
    "jeu de données eurostat",
  ],
  getEurostatDatasetMetadata: [
    "métadonnées eurostat",
    "jeu eurostat",
    "couverture eurostat",
  ],
  getFoodIngredients: ["ingrédients", "allergènes", "traces alimentaires"],
  getFoodProduct: ["code-barres", "code barre", "ean", "produit alimentaire"],
  getGithubIssue: ["détail issue github", "numéro issue github"],
  getGithubRepositories: [
    "mes dépôts github",
    "mes repositories",
    "liste mes dépôts",
    "dépôts de mon compte",
  ],
  getGithubRepositoryDetails: [
    "dépôt github",
    "repository",
    "repo github",
    "étoiles github",
    "licence de ce dépôt",
  ],
  getGitlabProjectSummary: [
    "projet gitlab",
    "dépôt gitlab",
    "repository gitlab",
    "résumé gitlab",
  ],
  getHolidayLongWeekends: [
    "week-end prolongé",
    "weekends prolongés",
    "long weekend",
    "ponts",
  ],
  getMobilityDatasetDetails: ["détail mobilité", "jeu de données transport"],
  getOpenAlexAuthor: ["auteur openalex", "profil auteur openalex"],
  getOpenAlexWork: [
    "publication openalex",
    "travail openalex",
    "article openalex",
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
  getWikidataEntities: [
    "comparer des entités wikidata",
    "plusieurs entités wikidata",
    "wikidata plusieurs",
  ],
  getWikidataEntity: ["entité wikidata", "fiche wikidata", "id wikidata"],
  getWorldBankSeries: [
    "série chronologique",
    "évolution de l'indicateur",
    "historique d'indicateur",
  ],
  gradeQuiz: [
    "corriger le quiz",
    "corriger mes réponses",
    "noter le quiz",
    "quelle est ma note",
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
  jiraCreateIssue: ["créer ticket jira", "nouveau ticket jira"],
  jiraListProjects: ["projets jira", "clés jira"],
  jiraSearchIssues: ["tickets jira", "issues jira", "jql"],
  jsonToolbox: [
    "json",
    "minifier json",
    "valider json",
    "formater json",
    "extraire un champ json",
    "aplatir le json",
    "fusionner deux json",
  ],
  linearCreateIssue: ["créer issue linear", "nouvelle issue linear"],
  linearGetIssue: ["détail issue linear", "fiche issue linear"],
  linearListIssues: ["issues linear", "tickets linear"],
  linearListTeams: ["équipes linear", "teams linear"],
  listGithubBranches: ["branches github", "branches du dépôt"],
  listGithubCommits: [
    "commits github",
    "historique commits",
    "derniers commits",
  ],
  listGithubDirectory: [
    "fichiers du dépôt",
    "arborescence github",
    "dossier github",
  ],
  listGithubIssueComments: [
    "commentaires issue github",
    "commentaires pr github",
  ],
  listGithubIssues: [
    "issue github",
    "issues github",
    "tickets github",
    "problèmes github",
  ],
  listGithubPullRequests: [
    "pull requests du dépôt",
    "mes pull requests",
    "versions en attente sur github",
  ],
  listGitlabIssues: ["issue gitlab", "issues gitlab", "tickets gitlab"],
  listGitlabReleases: ["release gitlab", "releases gitlab", "versions gitlab"],
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
  makeListOrganizations: ["organisations make", "espaces make"],
  makeListScenarios: ["scénarios make", "automatisations make"],
  makeRunScenario: ["lancer scénario make", "exécuter scénario make"],
  mapboxDirections: ["itinéraire mapbox", "trajet mapbox"],
  mapboxGeocode: ["géocoder mapbox", "coordonnées mapbox"],
  mapboxReverseGeocode: ["géocodage inverse mapbox"],
  mapsDirections: [
    "itinéraire google maps",
    "trajet en voiture",
    "comment aller de",
  ],
  mapsGeocode: ["géocoder", "coordonnées de", "adresse google maps"],
  mapsReverseGeocode: ["adresse de ces coordonnées", "géocodage inverse"],
  mapsSearchPlaces: [
    "chercher un lieu",
    "trouver un endroit",
    "lieux google maps",
  ],
  neonCreateBranch: ["créer branche neon", "nouvelle branche neon"],
  neonListBranches: ["branches neon", "bases neon"],
  neonListProjects: ["projets neon", "bases postgres neon"],
  notionAppendBlocks: ["ajouter dans notion", "compléter page notion"],
  notionCreatePage: ["créer page notion", "nouvelle page notion"],
  notionQueryDatabase: ["base notion", "requêter base notion"],
  notionReadPage: ["lire page notion", "contenu page notion"],
  notionSearch: ["chercher dans notion", "pages notion"],
  npmGetPackage: ["paquet npm", "version npm", "package npm"],
  npmSearch: ["chercher paquet npm", "recherche npm"],
  npmWhoami: ["compte npm", "whoami npm"],
  posthogListFlags: ["feature flags posthog", "flags posthog"],
  posthogListInsights: ["insights posthog", "graphiques posthog"],
  posthogListProjects: ["projets posthog", "analytics posthog"],
  quizzly: ["quiz", "questionnaire", "tester mes connaissances"],
  readGithubFile: [
    "fichier github",
    "code github",
    "lire le fichier",
    "contenu du fichier",
  ],
  readGitlabFile: ["fichier gitlab", "code gitlab", "lire le fichier gitlab"],
  resendGetEmail: ["statut email resend", "détail email resend"],
  resendListDomains: ["domaines resend", "dns resend"],
  resendListEmails: ["emails resend", "envois resend"],
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
  searchGithubCode: ["rechercher code github", "chercher dans le code github"],
  searchGithubRepositories: ["rechercher dépôt github", "trouver repo github"],
  searchJournals: [
    "revue scientifique",
    "journal académique",
    "issn",
    "revues académiques",
  ],
  searchMobilityDatasets: [
    "transport france",
    "mobilité france",
    "sncf",
    "gtfs",
  ],
  searchOpenAlexAuthors: [
    "auteur scientifique openalex",
    "rechercher un auteur openalex",
  ],
  searchOpenAlexWorks: [
    "publication scientifique openalex",
    "recherche openalex",
    "travaux scientifiques openalex",
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
  searchWikidataEntities: ["wikidata", "rechercher une entité wikidata"],
  searchWorldBankIndicators: [
    "indicateur banque mondiale",
    "indicateurs économiques",
    "indicateur de développement",
  ],
  sentryGetIssue: ["détail erreur sentry", "détail issue sentry"],
  sentryListIssues: ["erreurs sentry", "issues sentry", "bugs sentry"],
  sentryListOrganizations: ["organisations sentry"],
  sentryListProjects: ["projets sentry"],
  slackGetThread: ["fil slack", "thread slack", "réponses slack"],
  slackListChannels: ["salons slack", "canaux slack"],
  slackReadMessages: ["messages slack", "lire slack"],
  slackSendMessage: ["envoyer sur slack", "message slack"],
  sonarCommentIssue: ["commenter sonarcloud"],
  sonarListProjects: ["projets sonarcloud", "qualité de code sonar"],
  sonarSearchIssues: ["issues sonarcloud", "vulnérabilités sonar"],
  stripeGetCustomer: ["client stripe", "fiche client stripe"],
  stripeListCustomers: ["clients stripe", "liste clients stripe"],
  stripeListInvoices: ["factures stripe", "invoices stripe"],
  stripeListPayments: ["paiements stripe", "transactions stripe"],
  stripeListSubscriptions: ["abonnements stripe", "subscriptions stripe"],
  supabaseGetProject: ["projet supabase", "détail supabase"],
  supabaseListOrganizations: ["organisations supabase"],
  supabaseListProjects: ["projets supabase"],
  twilioListMessages: ["sms twilio", "messages twilio"],
  twilioListNumbers: ["numéros twilio"],
  twilioSendSms: ["envoyer sms twilio"],
  upstashGet: ["lire clé redis", "upstash get"],
  upstashSet: ["écrire clé redis", "upstash set"],
  vercelDeploymentLogs: ["logs vercel", "journaux déploiement vercel"],
  vercelGetDeployment: ["déploiement vercel", "statut déploiement vercel"],
  vercelGetProject: ["projet vercel", "détail projet vercel"],
  vercelListDeployments: ["déploiements vercel", "derniers déploiements"],
  vercelListProjects: ["projets vercel", "mes projets vercel"],
  webCodec: ["base64", "encoder", "décoder", "sha256", "hash"],
  webInspectJwt: ["jwt", "décoder jwt", "token jwt"],
  webParseCsv: ["csv", "parser csv", "tableau csv"],
  webParseUrl: ["analyser url", "paramètres url", "parser url"],
  webTestRegex: ["regex", "expression régulière", "tester regex"],
  wikipediaGetArticleContent: ["article wikipédia", "contenu wikipédia"],
  wikipediaGetSummary: ["résumé wikipédia", "définition wikipédia"],
  wikipediaSearch: ["wikipédia", "wikipedia", "chercher sur wikipédia"],
  youtubeChannelDetails: [
    "chaîne youtube",
    "fiche de la chaîne",
    "abonnés youtube",
  ],
  youtubeSearchVideos: [
    "chercher une vidéo youtube",
    "vidéos youtube",
    "youtube sur",
  ],
  youtubeVideoDetails: [
    "fiche de la vidéo",
    "cette vidéo youtube",
    "vues youtube",
  ],
  zapierListZaps: ["zaps zapier", "automatisations zapier"],
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
