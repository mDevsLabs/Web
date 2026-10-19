"use client";

import { BarChart3Icon, LineChartIcon, SparklesIcon } from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { ActivityHeatmap } from "@/components/settings/activity-heatmap";
import {
  ActivityOverview,
  TopTools,
} from "@/components/settings/activity-overview";
import { ConversationsBarChart } from "@/components/settings/conversations-bar-chart";
import { StatsFilters } from "@/components/settings/stats-filters";
import {
  StatsKpiStrip,
  StatsTotalsRow,
} from "@/components/settings/stats-kpi-strip";
import { StatsShareBar } from "@/components/settings/stats-share-bar";
import { UsageLineChart } from "@/components/settings/usage-line-chart";
import { useAgentMode } from "@/hooks/use-agent-mode";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import {
  buildStatsQueryString,
  DEFAULT_STATS_QUERY,
  STATS_GRANULARITY_LABELS,
  STATS_PERIOD_LABELS,
  type StatsOverview,
  type StatsQuery,
  type UsageStats,
} from "@/lib/stats/stats-types";

// Page Statistiques : la seule vue de la consommation dans le temps.
//
// Route dédiée plutôt qu'un onglet de plus dans `/settings` : ce fichier
// aurait été un sixième écran dans une page déjà longue, et la page Statistiques
// a sa propre navigation (cinq filtres, deux graphiques, un handoff vers le
// Chat) qui n'a rien à voir avec les réglages d'un compte.
//
// La source unique des chiffres est `GET /api/stats`, elle-même alimentée par
// `getUsageStats`. L'outil IA `getUsageStats` s'y branche : ce que l'utilisateur
// lit à l'écran et ce que l'IA annonce ne peuvent pas diverger.

/**
 * Valeur de repli des KPI avant la première réponse : des zéros calculés une
 * seule fois, hors du corps du composant.
 */
const EMPTY_OVERVIEW: StatsOverview = {
  topModel: null,
  totalAudioTokens: 0,
  totalConversations: 0,
  totalImages: 0,
  totalTokens: 0,
};

/**
 * Erreur de chargement portant le CODE renvoyé par la route, et pas seulement
 * son message.
 *
 * La distinction est nécessaire : sur un `auth_required`, « Réessayer » ne peut
 * rien réparer. `getMaiUser` est l'unique juge de l'identité (cf. AGENTS.md), et
 * un cookie présent ne garantit rien — un refus n'est pas un échec réseau. Orner
 * l'écran d'un bouton de nouvelle tentative qui échouera encore enfermerait
 * l'utilisateur sans issue, alors que la barre latérale propose déjà la
 * reconnexion via `SessionRecovery`.
 */
class StatsLoadError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "StatsLoadError";
  }
}

const fetcher = async (url: string): Promise<UsageStats> => {
  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    throw new StatsLoadError(
      body?.message ?? "Statistiques indisponibles.",
      body?.code ?? "internal_error"
    );
  }
  return response.json();
};

export default function StatsPage() {
  const router = useRouter();
  const { setMode } = useAgentMode();
  const [query, setQuery] = useState<StatsQuery>(DEFAULT_STATS_QUERY);

  const queryString = useMemo(() => buildStatsQueryString(query), [query]);
  const { data, error, isLoading, mutate } = useSWR<UsageStats>(
    apiEndpoints.stats(queryString),
    fetcher,
    { keepPreviousData: true }
  );

  /**
   * Handoff vers le Chat : on écrit le prompt sous une clé de session, on force
   * le mode Chat, puis on navigue vers une NOUVELLE conversation.
   *
   * Les trois conditions ne sont pas décoratives :
   *
   * - `router.push("/")` et non `/chat/<id>` : la lecture de la clé en attente
   *   est conditionnée à un compositeur de nouvelle conversation
   *   (components/chat/input/use-drafts.ts), une conversation existante
   *   l'ignorerait et le prompt disparaîtrait en silence.
   * - `setMode("chat")` : le lecteur de la clé est le compositeur du Chat. En
   *   mode Agent le prompt resterait dans le sessionStorage sans être repris.
   * - Le prompt porte les filtres : l'IA ne peut pas deviner la fenêtre
   *   temporelle que l'utilisateur a à l'écran.
   */
  const analyseWithAi = () => {
    const filters = [
      `sur la période « ${STATS_PERIOD_LABELS[query.period]} »`,
      query.mode
        ? `en mode ${query.mode === "agent" ? "Agent" : "Chat"}`
        : null,
      query.model ? `en utilisant le modèle ${query.model}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const prompt = `Analyse mes statistiques de consommation ${filters}. Dis-moi d'où viennent mes pics, si ma consommation évolue, et quel modèle ou quel type de contenu domine. Appuie chaque affirmation sur les chiffres que tu obtiens, et signale si une série est vide ou non comparable.`;

    try {
      sessionStorage.setItem(
        MAI_PENDING_ATTACHMENT_KEY,
        JSON.stringify({ prompt, tools: ["getUsageStats"] })
      );
    } catch {
      // Session sans stockage (navigation privée stricte) : on navigue quand
      // même, l'utilisateur formulera sa question lui-même. Un échec ici ne
      // doit pas rendre un bouton inerte.
    }
    setMode("chat");
    router.push("/");
  };

  const filterOptions = data?.filterOptions ?? { models: [], projects: [] };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl p-4 pb-16 sm:p-6 md:p-10">
        <div className="flex items-start gap-3 border-b border-border/50 pb-6">
          <PageBackButton />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <LineChartIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold tracking-wider text-primary uppercase">
                Statistiques
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Consommation détaillée
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Historique de vos tokens, de vos générations et de vos
              conversations. Les images sont comptées en nombre de générations :
              aucune base ne mesure les tokens d'une image.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <StatsFilters
            filterOptions={filterOptions}
            onChange={(patch) =>
              setQuery((current) => ({ ...current, ...patch }))
            }
            query={query}
          />

          {error ? (
            <div className="surface-muted flex flex-col items-start gap-3">
              <p className="text-sm text-destructive">{error.message}</p>
              {error instanceof StatsLoadError &&
              error.code === "auth_required" ? (
                // Aucune action locale ne peut réparer une session non
                // reconnue : on ne propose donc pas de réessayer, on oriente
                // vers la seule issue réelle, déjà rendue par la barre
                // latérale (`SessionRecovery`).
                <p className="text-[11px] text-muted-foreground">
                  Votre session n&apos;est plus reconnue. Utilisez le bloc «
                  Session non reconnue » de la barre latérale pour vous
                  reconnecter ou vous déconnecter.
                </p>
              ) : (
                <button
                  className="chip"
                  onClick={() => void mutate()}
                  type="button"
                >
                  Réessayer
                </button>
              )}
            </div>
          ) : null}

          {/*
            Les KPI restent affichés pendant un rechargement de filtre
            (`keepPreviousData`) : sans cela, chaque changement de période ferait
            clignoter les tuiles à zéro avant l'affichage des nouvelles valeurs.
            Le squelette ne sert qu'au tout premier chargement.
          */}
          {(!error || data) && (
            <StatsKpiStrip
              activity={data?.activity ?? null}
              loading={isLoading && !data}
              // `keepPreviousData` conserve la réponse précédente pendant un
              // changement de filtre : les tuiles gardent donc les derniers
              // chiffres connus au lieu de repasser par zéro.
              overview={data?.overview ?? EMPTY_OVERVIEW}
            />
          )}
          {data && <StatsTotalsRow overview={data.overview} />}

          {/*
            La carte de chaleur est placée AVANT les graphiques et le filtre
            de période reste au-dessus d'elle : elle couvre toujours 12 mois
            et ignore donc ce filtre, ce qu'un libellé explicite dit mieux
            qu'un placement.
          */}
          <section className="surface-card flex flex-col gap-4">
            {data ? (
              <ActivityHeatmap daily={data.daily} from={data.dailyFrom} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {error ? "Activité indisponible." : "Chargement de l’activité…"}
              </p>
            )}
          </section>

          {data && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ActivityOverview activity={data.activity} />
              <TopTools activity={data.activity} />
            </div>
          )}

          {data && data.warnings.length > 0 && (
            <div className="surface-muted flex flex-col gap-1">
              {data.warnings.map((warning) => (
                <p className="text-[11px] text-muted-foreground" key={warning}>
                  {warning}
                </p>
              ))}
            </div>
          )}

          <section className="surface-card flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <LineChartIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Consommation{" "}
                {data
                  ? STATS_GRANULARITY_LABELS[data.consumptionGranularity]
                  : ""}
              </h2>
            </div>
            <UsageLineChart
              granularity={data?.consumptionGranularity ?? "week"}
              points={data?.consumption ?? []}
              visibleKinds={query.kinds}
            />
          </section>

          <section className="surface-card flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <BarChart3Icon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Conversations créées{" "}
                {data
                  ? STATS_GRANULARITY_LABELS[data.conversationsGranularity]
                  : ""}
              </h2>
            </div>
            <ConversationsBarChart
              granularity={data?.conversationsGranularity ?? "month"}
              points={data?.conversations ?? []}
            />
          </section>

          {data && data.models.length > 0 && (
            <section className="surface-card flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">
                Répartition par modèle
              </h2>
              <div className="flex flex-col gap-3">
                {data.models.map((entry) => (
                  <div className="flex flex-col gap-1" key={entry.model}>
                    <div className="flex items-baseline justify-between gap-3">
                      {/*
                        Le nom lisible d'abord, l'identifiant exact en
                        second : c'est une répartition, on compare donc des
                        noms, mais on doit pouvoir retrouver la valeur
                        enregistrée sans lever le pied de la page.
                      */}
                      <span
                        className="truncate text-xs text-foreground"
                        title={entry.model}
                      >
                        {entry.name}
                        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">
                          {entry.model}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {Math.round(entry.share * 100)} %
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-500"
                        style={{ width: `${Math.max(entry.share * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/*
            La barre d'export vient APRÈS les graphiques : on ne propose pas de
            publier une image avant qu'il y ait quelque chose à publier. Elle est
            aussi placée avant l'appel à l'IA, qui est l'autre sortie de la
            page — deux chemins « je pars avec ces chiffres », côte à côte.
          */}
          {data && <StatsShareBar stats={data} visibleKinds={query.kinds} />}

          <div className="flex flex-col items-start gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!data || Boolean(error)}
              onClick={analyseWithAi}
              type="button"
            >
              <SparklesIcon className="size-4" />
              Analyser ces statistiques avec l'IA
            </button>
            <p className="text-[11px] text-muted-foreground">
              Ouvre une nouvelle conversation Chat avec un prompt d'analyse
              reprenant les filtres ci-dessus. L'IA consultera les mêmes
              chiffres que ceux affichés ici.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
