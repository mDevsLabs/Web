"use client";

import type { StatsActivity } from "@/lib/stats/stats-types";

// Les deux listes de l'aperçu : ratios d'usage d'un côté, outils de l'autre.
//
// ── Ce que ces indicateurs mesurent VRAIMENT, et ce qu'ils ne mesurent pas ──
// Chaque ligne porte la limite de sa propre donnée. Ce n'est pas de la
// prudence de façade : sans elle, l'utilisateur lirait « 0 % » pour une
// statistique qui n'est simplement pas instrumentée.
//
// - Le raisonnement est celui DEMANDÉ (celui appliqué n'est pas persisté).
// - « Messages envoyés » ne compte que les conversations ENCORE PRÉSENTES :
//   `Message_v2` est supprimé avec sa conversation et aucun journal ne compte
//   les messages. C'est un plancher, et le libellé le dit plutôt que de laisser
//   croire à un total complet qui baisse dès qu'on range une conversation.
// - Les appels d'outil sont comptés sur les DEUX modes, MCP et plugins
//   confondus (migration 0036). Avant, un plugin utilisé en conversation
//   n'apparaissait pas du tout — la note sous la liste le disait, mais un 0
//   dans un classement se lit comme une absence d'usage, pas comme une absence
//   d'instrumentation.

type Props = {
  activity: StatsActivity | null;
};

/** Une ligne « libellé → valeur », alignée à gauche et à droite. */
function Row({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="min-w-0 text-sm text-muted-foreground">{label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {detail ? (
          <span className="ml-2 text-[11px] text-muted-foreground/70">
            {detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function ActivityOverview({ activity }: Props) {
  if (!activity) {
    return null;
  }
  const percent = (share: number) => `${Math.round(share * 100)} %`;
  const topReasoning = activity.topReasoning;

  return (
    <section className="surface-card flex flex-col gap-1">
      <h2 className="text-sm font-semibold text-foreground">
        Aperçu de l'activité
      </h2>
      <div className="mt-2 flex flex-col divide-y divide-border/50">
        <Row
          detail="des conversations"
          label="Mode Chat"
          value={percent(activity.chatShare)}
        />
        <Row
          detail="des conversations"
          label="Mode Agent"
          value={percent(activity.agentShare)}
        />
        <Row
          // `reasoningLevel` stocke le niveau demandé ; le niveau effectif,
          // que le modèle peut ramener à la baisse, n'est jamais persisté.
          detail={
            topReasoning
              ? `demandé, ${percent(topReasoning.share)} des runs`
              : undefined
          }
          label="Raisonnement le plus demandé"
          value={topReasoning?.label ?? "—"}
        />
        <Row
          label="Compétences utilisées"
          value={activity.totals.distinctSkillsUsed.toLocaleString("fr-FR")}
        />
        <Row
          detail="invocations"
          label="Total des compétences"
          value={activity.totals.totalSkillInvocations.toLocaleString("fr-FR")}
        />
        <Row
          label="Total des chats"
          value={activity.totals.totalChats.toLocaleString("fr-FR")}
        />
        <Row
          // Plancher, pas mesure : les messages des conversations supprimées
          // n'existent plus en base et aucun journal ne les recompte.
          detail="conversations actuelles"
          label="Messages envoyés"
          value={activity.totals.totalMessages.toLocaleString("fr-FR")}
        />
      </div>
    </section>
  );
}

export function TopTools({ activity }: Props) {
  if (!activity) {
    return null;
  }
  const tools = activity.tools;

  return (
    <section className="surface-card flex flex-col gap-1">
      <h2 className="text-sm font-semibold text-foreground">
        Outils les plus utilisés
      </h2>
      {tools.length === 0 ? (
        <p className="mt-2 py-2 text-sm text-muted-foreground">
          Aucun appel d&apos;outil enregistré sur la période.
        </p>
      ) : (
        <div className="mt-2 flex flex-col divide-y divide-border/50">
          {tools.map((tool) => (
            <div
              className="flex items-baseline justify-between gap-3 py-2"
              key={`${tool.scope}-${tool.label}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {/* Pastille de portée : elle dit DE QUOI vient le compte, et
                    c'est la seule information qui explique qu'un plugin puisse
                    afficher un total plus faible qu'on ne l'attendait. */}
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: "var(--foreground)",
                    opacity: tool.scope === "plugin" ? 0.85 : 0.45,
                  }}
                />
                <span className="truncate text-sm text-foreground">
                  {tool.label}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground/70 uppercase">
                  {tool.scope === "plugin" ? "plugin" : "mcp"}
                </span>
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {tool.total.toLocaleString("fr-FR")}{" "}
                {tool.total > 1 ? "exécutions" : "exécution"}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Les appels d&apos;outils sont comptés sur les deux modes, MCP et plugins
        confondus. Une exécution antérieure à ce comptage n&apos;apparaît que si
        elle a eu lieu en mode Agent.
      </p>
    </section>
  );
}
