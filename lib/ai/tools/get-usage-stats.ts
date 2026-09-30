import { tool } from "ai";
import { z } from "zod";
import {
  STATS_PERIODS,
  type StatsKind,
  type StatsPeriod,
  type UsageStats,
} from "@/lib/stats/stats-types";
import { getUsageStats } from "@/lib/stats/usage-stats";

// Outil d'analyse des statistiques de consommation. Il ne calcule RIEN : il
// délègue à `getUsageStats`, la fonction unique déjà utilisée par la page
// `/settings/statistiques`. Un calcul parallèle ici ferait diverger les chiffres
// que l'utilisateur a vus à l'écran de ceux que l'IA annonce.
//
// C'est le prolongement de `getAccountUsage` (voir get-account-usage.ts), qui
// répondait à « combien ai-je consommé ? » avec les quotas du jour. Cet outil
// répond à « comment ma consommation a-t-elle évolué ? » sur l'historique.

/** Résumé compact destiné au modèle : les tokens de contexte sont facturés. */
type StatsToolSummary = {
  consumptionByPeriod: {
    audioTokens: number;
    bucket: string;
    imageCount: number;
    textTokens: number;
  }[];
  conversationByPeriod: { agent: number; bucket: string; chat: number }[];
  granularityNote: string;
  highlights: string[];
  models: { model: string; name: string; share: number; tokens: number }[];
  period: StatsPeriod;
  totals: {
    conversations: number;
    images: number;
    speechTokens: number;
    tokens: number;
  };
  topModel: {
    model: string;
    name: string;
    share: number;
    tokens: number;
  } | null;
  warnings: string[];
};

/**
 * Réduit la réponse complète à ce qui est utile à une réponse en français.
 *
 * Le detail des buckets est ABRÉGÉ (voir `MAX_POINTS` plus bas) : renvoyer deux
 * ans de semaines.hebdomadaires ferait exploser le contexte pour un gain nul —
 * un modèle raisonne sur des totaux et des formes de courbes, pas sur 104
 * nombres. Les trois derniers points restent-listed pour que la tendance
 * immédiate reste lisible.
 */
const MAX_POINTS = 16;

/** Points d'une série : les premiers, les derniers, et le total. */
function condense<T>(points: T[]): T[] {
  if (points.length <= MAX_POINTS) {
    return points;
  }
  const head = Math.floor(MAX_POINTS / 2);
  return [...points.slice(0, head), ...points.slice(-(MAX_POINTS - head))];
}

function buildSummary(stats: UsageStats, kinds: StatsKind[]): StatsToolSummary {
  const wants = (kind: StatsKind) => kinds.includes(kind);
  const consumption = stats.consumption.map((point) => ({
    audioTokens: wants("audio") ? point.audioTokens : 0,
    bucket: point.bucket,
    imageCount: wants("image") ? point.imageCount : 0,
    textTokens: wants("text") ? point.textTokens : 0,
  }));

  const topModel = stats.overview.topModel;
  const highlights: string[] = [];

  if (topModel) {
    highlights.push(
      // Nom lisible + identifiant : la réponse en français doit pouvoir nommer
      // le modèle sans que l'IA ait à reformater un slug.
      `Modèle le plus utilisé : ${topModel.name} (${topModel.model}, ${Math.round(topModel.share * 100)} % des tokens).`
    );
  }
  if (stats.overview.totalImages > 0) {
    highlights.push(
      `${stats.overview.totalImages} image(s) générée(s) sur la période.`
    );
  }
  if (stats.overview.totalAudioTokens > 0) {
    highlights.push(
      `${stats.overview.totalAudioTokens} tokens de synthèse vocale sur la période.`
    );
  }

  return {
    consumptionByPeriod: condense(consumption),
    conversationByPeriod: condense(stats.conversations),
    granularityNote:
      stats.consumptionGranularity === "week"
        ? "Consommation regroupée par semaine, conversations par mois."
        : "Consommation et conversations regroupées par mois.",
    highlights,
    models: stats.models.map((entry) => ({
      model: entry.model,
      name: entry.name,
      share: Number(entry.share.toFixed(3)),
      tokens: entry.tokens,
    })),
    period: stats.period,
    topModel: topModel
      ? {
          model: topModel.model,
          name: topModel.name,
          share: Number(topModel.share.toFixed(3)),
          tokens: topModel.tokens,
        }
      : null,
    totals: {
      conversations: stats.overview.totalConversations,
      images: stats.overview.totalImages,
      speechTokens: stats.overview.totalAudioTokens,
      tokens: stats.overview.totalTokens,
    },
    // Les avertissements font partie du retour : l'IA doit pouvoir dire
    // « les images ne sont pas filtrables par projet » au lieu de présenter une
    // série comme complète alors qu'elle ne l'est pas.
    warnings: stats.warnings,
  };
}

export function getUsageStatsTool({
  userId,
  userEmail,
}: {
  userId?: string | null;
  userEmail?: string | null;
}) {
  return tool({
    description:
      "Analyse l'historique de consommation de l'utilisateur : tokens totaux et évolution dans le temps (texte, images, audio), conversations créées par mode Chat ou Agent, et classement des modèles. Utilise-le pour toute question sur l'évolution de la consommation, la répartition texte/image/audio, le modèle le plus utilisé ou la fréquence d'usage — et non pour les quotas instantanés, que couvre getAccountUsage. Nuances à respecter : les images sont comptées en NOMBRE de générations (aucun compteur de tokens n'existe en base) et sont tracées sur un axe distinct ; les séries sont exprimées en unités différentes, ne les compare donc jamais entre elles. Après l'appel, commente la tendance et les points notables, et signale tout avertissement renvoyé.",
    execute: async (input): Promise<StatsToolSummary | { error: string }> => {
      const period: StatsPeriod = input.period ?? "30d";
      const kinds: StatsKind[] = input.kind ?? ["text", "image", "audio"];

      try {
        const stats = await getUsageStats(
          { email: userEmail, id: userId },
          {
            kinds,
            mode: input.mode ?? null,
            model: input.model ?? null,
            period,
            projectId: input.projectId ?? null,
          }
        );
        return buildSummary(stats, kinds);
      } catch {
        // Un outil ne lève jamais : le modèle doit pouvoir s'en accommoder et
        // le dire à l'utilisateur, pas faire échouer tout le tour de parole.
        return {
          error:
            "Impossible de lire les statistiques de consommation. Réessaie dans un instant.",
        };
      }
    },
    inputSchema: z.object({
      kind: z
        .array(z.enum(["text", "image", "audio"]))
        .optional()
        .describe(
          "Types de contenu à considérer. Par défaut les trois ; l'audio et le texte sont en tokens, les images en nombre de générations."
        ),
      mode: z
        .enum(["chat", "agent"])
        .optional()
        .describe(
          "Restreint aux conversations d'un mode. Ne s'applique pas aux images ni à l'audio, qui ne sont rattachés à aucune conversation."
        ),
      model: z
        .string()
        .optional()
        .describe(
          "Restreint à un modèle précis, tel qu'il apparaît au classement."
        ),
      period: z
        .enum(STATS_PERIODS)
        .optional()
        .describe(
          "Fenêtre d'analyse. « all » porte sur tout l'historique et regroupe alors les points par mois."
        ),
      projectId: z
        .string()
        .optional()
        .describe(
          "Restreint à un projet. Même limite que le mode : sans effet sur les images et l'audio."
        ),
    }),
  });
}
