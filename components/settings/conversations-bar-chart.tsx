"use client";

import {
  niceTicks,
  STATS_GRANULARITY_LABELS,
  STATS_MODE_LABELS,
  type StatsConversationsPoint,
  type StatsGranularity,
} from "@/lib/stats/stats-types";

// Conversations créées par période, deux colonnes groupées : une par mode
// (`Chat.mode`, énumération de `Chat`). La source est `Chat.createdAt` — le
// nombre de conversations CRÉÉES dans la période, pas celles qui y ont reçu un
// message. C'est le sens demandé, et cela évite une jointure `Message_v2` dont
// le coût n'ajouterait rien de plus lisible à l'écran.
//
// L'interface est achromatique par défaut (voir AGENTS.md) : les deux colonnes
// ne se distinguent que par leur VALEUR et leur opacité, pas par deux couleurs.
// Aucune information ne demande ici d'accent.

type Props = {
  granularity: StatsGranularity;
  points: StatsConversationsPoint[];
};

// Même contrat que la courbe de consommation : le SVG est responsive, la
// hauteur affichée vaut donc `HEIGHT / WIDTH` × largeur du conteneur. 720×176
// donne une bande où deux mois de colonnes se comparent d'un coup d'œil.
const WIDTH = 720;
const HEIGHT = 176;
const PAD_TOP = 12;
const PAD_BOTTOM = 30;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;

function formatBucketLabel(bucket: string, includeYear: boolean): string {
  const date = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return bucket;
  }
  const label = date
    .toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    .replace(".", "");
  return includeYear ? `${label} ${date.getUTCFullYear()}` : label;
}

export function ConversationsBarChart({ granularity, points }: Props) {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucune conversation créée sur cette période.
      </p>
    );
  }

  const totals = points.map((point) => point.chat + point.agent);
  const max = Math.max(...totals, 1);
  const ticks = niceTicks(max);
  // `niceTicks` garantit au moins une graduation ; on borne à 1 pour qu'un
  // compte sans conversation n aplatisse pas le graphique sur une division par
  // zéro.
  const top = Math.max(ticks.at(-1) ?? 1, 1);

  const groupWidth = PLOT_WIDTH / points.length;
  // Marge interne de 25 % : les deux colonnes laissent respirer le groupe au
  // lieu de se toucher.
  const barWidth = Math.min((groupWidth * 0.75) / 2, 34);
  const yFor = (value: number) =>
    PAD_TOP + PLOT_HEIGHT - (value / top) * PLOT_HEIGHT;

  const labelStep = Math.ceil(points.length / 12);
  const firstPoint = points.at(0);
  const lastPoint = points.at(-1);
  const includeYear = Boolean(
    firstPoint &&
      lastPoint &&
      firstPoint.bucket.slice(0, 4) !== lastPoint.bucket.slice(0, 4)
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {(["chat", "agent"] as const).map((mode) => (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
            key={mode}
          >
            <span
              aria-hidden
              className="size-2 rounded-sm bg-foreground"
              style={{ opacity: mode === "chat" ? 0.85 : 0.45 }}
            />
            {STATS_MODE_LABELS[mode]}
          </span>
        ))}
      </div>

      <svg
        aria-label={`Conversations créées ${STATS_GRANULARITY_LABELS[granularity]}, par mode`}
        className="w-full"
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={`grid-${tick}`}>
              <line
                className="stroke-border/50"
                strokeWidth="1"
                x1={PAD_LEFT}
                x2={PAD_LEFT + PLOT_WIDTH}
                y1={y}
                y2={y}
              />
              <text
                className="fill-muted-foreground text-[9px]"
                textAnchor="end"
                x={PAD_LEFT - 8}
                y={y + 3}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {points.map((point, index) => {
          const groupX = PAD_LEFT + index * groupWidth;
          // Les deux colonnes sont centrées sur le groupe.
          const centerX = groupX + groupWidth / 2;
          const chatX = centerX - barWidth - 1;
          const agentX = centerX + 1;
          const chatY = yFor(point.chat);
          const agentY = yFor(point.agent);

          return (
            <g key={point.bucket}>
              <title>
                {`${point.bucket} — ${STATS_MODE_LABELS.chat} : ${point.chat}, ${STATS_MODE_LABELS.agent} : ${point.agent}`}
              </title>
              {/* Une hauteur nulle reste un filet : une conversation valant 0
                  doit rester visible comme telle, pas disparaître. */}
              <rect
                className="fill-foreground"
                height={Math.max(PAD_TOP + PLOT_HEIGHT - chatY, 1)}
                opacity="0.85"
                rx="2"
                width={barWidth}
                x={chatX}
                y={chatY}
              />
              <rect
                className="fill-foreground"
                height={Math.max(PAD_TOP + PLOT_HEIGHT - agentY, 1)}
                opacity="0.45"
                rx="2"
                width={barWidth}
                x={agentX}
                y={agentY}
              />
              {(index % labelStep === 0 || index === points.length - 1) && (
                <text
                  className="fill-muted-foreground text-[9px]"
                  textAnchor="middle"
                  x={centerX}
                  y={HEIGHT - 12}
                >
                  {formatBucketLabel(point.bucket, includeYear)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
