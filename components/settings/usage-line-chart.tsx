"use client";

import { useMemo, useState } from "react";
import { formatTokensFr } from "@/lib/account/format";
import {
  niceTicks,
  STATS_GRANULARITY_LABELS,
  STATS_KIND_LABELS,
  type StatsConsumptionPoint,
  type StatsGranularity,
  type StatsKind,
} from "@/lib/stats/stats-types";

// Consommation dans le temps : deux axes Y, trois séries.
//
// Pourquoi deux axes et non trois courbes sur un axe unique : le texte et
// l'audio sont des TOKENS, les images sont un NOMBRE de générations. Aucune
// table ne porte de compteur de tokens pour une image (voir
// lib/stats/usage-stats.ts), donc il n'existe pas d'unité commune honnête.
// Superposer 40 000 tokens et 3 images sur une même échelle rendrait la série
// image plate contre l'axe — visuellement fausse. D'où un axe de gauche pour
// les tokens, un axe de droite pour les générations, et une légende qui
// annonce l'unité de chaque série.
//
// Aucune librairie de graphiques n'est installée dans ce dépôt et aucune n'est
// ajoutée ici : le SVG est produit par le composant, avec les tokens CSS du
// design system, donc il suit automatiquement le thème clair et sombre.

type Props = {
  granularity: StatsGranularity;
  points: StatsConsumptionPoint[];
  visibleKinds: StatsKind[];
};

// Le SVG est responsive (`className="w-full"`) : sa hauteur affichée est le
// rapport `HEIGHT / WIDTH` multiplié par la largeur du conteneur. Ces deux
// nombres fixent donc la hauteur RÉELLE, en pixels, sur toute la largeur — ils
// sont choisis pour que la courbe tienne dans une bande de lecture et non dans
// une demi-page : sur un compte de 30 jours, la hauteur utile est celle qui
// laisse voir la forme de la série sans devoir faire défiler.
const WIDTH = 720;
const HEIGHT = 190;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_LEFT = 52;
const PAD_RIGHT = 52;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;

const SERIES: {
  color: string;
  key: "audioTokens" | "imageCount" | "textTokens";
  kind: StatsKind;
  unit: string;
}[] = [
  {
    color: "var(--foreground)",
    key: "textTokens",
    kind: "text",
    unit: "tokens",
  },
  { color: "var(--info)", key: "audioTokens", kind: "audio", unit: "tokens" },
  {
    color: "var(--warning)",
    key: "imageCount",
    kind: "image",
    unit: "générations",
  },
];

/** Libellé court d'axe : 12 k, 1,4 M — les ticks restent lisibles. */
function formatTick(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  }
  return value.toLocaleString("fr-FR");
}

/** `AAAA-MM-JJ` → `12 janv.` (année omise quand elle est la même partout). */
function formatBucketLabel(bucket: string, includeYear: boolean): string {
  const date = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return bucket;
  }
  const label = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return includeYear
    ? `${label} ${date.getUTCFullYear()}`
    : label.replace(".", "");
}

export function UsageLineChart({ granularity, points, visibleKinds }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const active = useMemo(
    () => SERIES.filter((series) => visibleKinds.includes(series.kind)),
    [visibleKinds]
  );

  // Axe de gauche : le plus haut des TOKENS (texte ou audio, selon ce qui est
  // visible). Axe de droite : le plus haut des GÉNÉRATIONS. Deux échelles
  // indépendantes, sinon la petite série disparaît.
  const tokenMax = useMemo(() => {
    let max = 0;
    for (const point of points) {
      for (const series of active) {
        if (series.unit === "tokens") {
          max = Math.max(max, point[series.key]);
        }
      }
    }
    return max;
  }, [active, points]);

  const imageMax = useMemo(() => {
    let max = 0;
    for (const point of points) {
      if (visibleKinds.includes("image")) {
        max = Math.max(max, point.imageCount);
      }
    }
    return max;
  }, [points, visibleKinds]);

  // Quatre graduations sur l'axe de gauche : la hauteur est plus grande que
  // celle de l'histogramme, une graduation de plus n'y surcharge pas la lecture.
  const tokenTicks = useMemo(() => niceTicks(tokenMax, 4), [tokenMax]);
  const imageTicks = useMemo(() => niceTicks(imageMax, 4), [imageMax]);
  // `niceTicks` garantit au moins une graduation, le max ne peut donc pas être
  // undefined — mais le type ne le sait pas. On borne à 1 pour éviter qu'une
  // division par zéro aplatisse le graphique sur un compte sans donnée.
  const tokenTop = Math.max(tokenTicks.at(-1) ?? 1, 1);
  const imageTop = Math.max(imageTicks.at(-1) ?? 1, 1);

  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucune consommation enregistrée sur cette période.
      </p>
    );
  }

  const xFor = (index: number) =>
    points.length === 1
      ? PAD_LEFT + PLOT_WIDTH / 2
      : PAD_LEFT + (index / (points.length - 1)) * PLOT_WIDTH;
  const yFor = (value: number, max: number) =>
    PAD_TOP + PLOT_HEIGHT - (max > 0 ? (value / max) * PLOT_HEIGHT : 0);

  // Un libellé sur deux au-delà de 8 points : au-delà, ils se chevauchent.
  const labelStep = Math.ceil(points.length / 8);
  const firstPoint = points.at(0);
  const lastPoint = points.at(-1);
  // L'année n'est affichée que si la série en traverse au moins deux : sinon
  // elle répéterait celle du titre sur chaque tick.
  const includeYear = Boolean(
    firstPoint &&
      lastPoint &&
      firstPoint.bucket.slice(0, 4) !== lastPoint.bucket.slice(0, 4)
  );

  const hoveredPoint = hovered === null ? null : points[hovered];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {SERIES.map((series) => (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] text-muted-foreground ${
              visibleKinds.includes(series.kind) ? "" : "opacity-40"
            }`}
            key={series.kind}
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {STATS_KIND_LABELS[series.kind]}
            <span className="text-foreground/70">({series.unit})</span>
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          aria-label={`Consommation ${STATS_GRANULARITY_LABELS[granularity]}`}
          className="w-full"
          role="img"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        >
          {/* Grille et axe de gauche : tokens */}
          {tokenTicks.map((tick) => {
            const y = yFor(tick, tokenTop);
            return (
              <g key={`token-${tick}`}>
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
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}

          {/* Axe de droite : générations d'images */}
          {visibleKinds.includes("image") &&
            imageTicks.map((tick) => {
              const y = yFor(tick, imageTop);
              return (
                <text
                  className="fill-muted-foreground text-[9px]"
                  key={`image-${tick}`}
                  textAnchor="start"
                  x={PAD_LEFT + PLOT_WIDTH + 8}
                  y={y + 3}
                >
                  {formatTick(tick)}
                </text>
              );
            })}

          {/* Courbes. `vector-effect` évite que le trait s'épaississe quand le
              viewBox est mis à l'échelle par la largeur du conteneur. */}
          {active.map((series) => {
            const max = series.unit === "tokens" ? tokenTop : imageTop;
            const path = points
              .map((point, index) => {
                const x = xFor(index);
                const y = yFor(point[series.key], max);
                return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <path
                d={path}
                fill="none"
                key={series.kind}
                stroke={series.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Repère de survol */}
          {hovered !== null && (
            <line
              className="stroke-foreground/40"
              strokeDasharray="3 3"
              strokeWidth="1"
              x1={xFor(hovered)}
              x2={xFor(hovered)}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_HEIGHT}
            />
          )}

          {/* Points d'accroche : visibles au survol, ou en nombre réduit */}
          {active.map((series) => {
            const max = series.unit === "tokens" ? tokenTop : imageTop;
            return points.map((point, index) => {
              const isHovered = hovered === index;
              const sparse = points.length > 16 && index % 4 !== 0;
              if (!isHovered && sparse) {
                return null;
              }
              return (
                <circle
                  cx={xFor(index)}
                  cy={yFor(point[series.key], max)}
                  fill={series.color}
                  key={`${series.kind}-${point.bucket}`}
                  opacity={isHovered ? 1 : 0.55}
                  r={isHovered ? 4 : 2.5}
                />
              );
            });
          })}

          {/* Axe des abscisses */}
          {points.map((point, index) => {
            if (index % labelStep !== 0 && index !== points.length - 1) {
              return null;
            }
            return (
              <text
                className="fill-muted-foreground text-[9px]"
                key={`x-${point.bucket}`}
                textAnchor="middle"
                x={xFor(index)}
                y={HEIGHT - 10}
              >
                {formatBucketLabel(point.bucket, includeYear)}
              </text>
            );
          })}

          {/* Zones de capture : le SVG n'a pas de survol par défaut sur un
              tracé, on pose donc des rectangles transparents par colonne. */}
          {points.map((point, index) => (
            <rect
              fill="transparent"
              height={PLOT_HEIGHT}
              key={`hit-${point.bucket}`}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              width={PLOT_WIDTH / Math.max(points.length - 1, 1)}
              x={xFor(index) - PLOT_WIDTH / Math.max(points.length - 1, 1) / 2}
              y={PAD_TOP}
            />
          ))}
        </svg>

        {hoveredPoint && hovered !== null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 min-w-44 rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(xFor(hovered) / WIDTH) * 100}%`,
              transform:
                hovered > points.length / 2
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
            }}
          >
            <p className="mb-1 font-medium text-foreground">
              {formatBucketLabel(hoveredPoint.bucket, true)}
            </p>
            {SERIES.map((series) => (
              <p
                className="flex items-center justify-between gap-3 text-muted-foreground"
                key={series.kind}
                style={{
                  opacity: visibleKinds.includes(series.kind) ? 1 : 0.4,
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  {STATS_KIND_LABELS[series.kind]}
                </span>
                <span className="font-mono text-foreground">
                  {series.unit === "tokens"
                    ? formatTokensFr(hoveredPoint[series.key])
                    : hoveredPoint[series.key].toLocaleString("fr-FR")}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Axe de gauche : tokens (texte, audio). Axe de droite : nombre de
        générations d'images. Les deux unités ne sont pas comparables — aucune
        base ne compte les tokens d'une image.
      </p>
    </div>
  );
}
