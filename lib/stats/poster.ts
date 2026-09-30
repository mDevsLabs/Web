import { formatTokensFr } from "@/lib/account/format";
import {
  STATS_GRANULARITY_LABELS,
  STATS_KIND_LABELS,
  STATS_MODE_LABELS,
  STATS_PERIOD_LABELS,
  type StatsConsumptionPoint,
  type StatsConversationsPoint,
  type StatsGranularity,
  type StatsKind,
  type StatsModelUsage,
  type StatsPeriod,
  type UsageStats,
} from "@/lib/stats/stats-types";

// Générateur de l'AFFICHE de statistiques, en SVG autonome.
//
// ── Pourquoi un SVG construit à la main plutôt qu'une capture du DOM ───────
// Les outils habituels (`html-to-image`, `dom-to-image`) sérialisent le DOM de
// la page. Ils sont fragiles ici : l'affichage est en `oklch()` via des
// variables CSS, la page charge des polices web, et le résultat dépend de la
// position de défilement. On produirait une image différent à chaque clic.
//
// Ce module construit donc une affiche DÉRIVÉE des mêmes données, dans un
// document SVG autonome. Conséquences assumées :
//
// - Les couleurs sont des LITTÉRAUX (`#1f6cb0`), jamais `var(--info)` : un
//   SVG chargé depuis un blob n'a pas accès à la feuille de style de
//   l'application, une variable CSS y resterait non résolue et le trait
//   disparaîtrait. Les valeurs ci-dessous sont la conversion exacte des tokens
//   de `app/globals.css` (`oklch(...)` → sRGB), recalculées, pas estimées.
// - La police est une famille SYSTÈME, jamais la famille web de l'application :
//   une police déclarée dans une feuille de style n'existe pas dans un document
//   SVG isolé. C'est la seule divergence visuelle assumée ; la hiérarchie et les
//   corps sont conservés.
//
// Le module reste PUR (aucun React, aucun accès base) pour être testable sans
// DOM : il ne fait que produire une chaîne.

/** Palette dérivée des tokens de `app/globals.css`. */
export type PosterPalette = {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  info: string;
  warning: string;
};

/** Conversion oklch → hex des tokens de l'application. */
export const LIGHT_PALETTE: PosterPalette = {
  background: "#fafafa",
  border: "#dedede",
  card: "#ffffff",
  foreground: "#060606",
  info: "#1f6cb0",
  muted: "#ebebeb",
  mutedForeground: "#7a7a7a",
  warning: "#aa6a00",
};

export const DARK_PALETTE: PosterPalette = {
  background: "#121212",
  border: "#292929",
  card: "#1b1b1b",
  foreground: "#ebebeb",
  info: "#61a3e6",
  muted: "#181818",
  mutedForeground: "#8f8f8f",
  warning: "#dea143",
};

// Familles système : les seules disponibles dans un document SVG isolé.
const SANS =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const W = 900;
const PAD = 40;
const CARD_W = W - PAD * 2;

// Hauteurs de section, pour poser le flux sans mesurer le DOM.
const HEADER_H = 108;
const KPI_H = 116;
const CONSUMPTION_H = 310;
const CONVERSATIONS_H = 268;
const MODELS_MAX_H = 40 + 46 * 3 + 18;
const FOOTER_H = 52;

export type PosterInput = {
  /** Filtres appliqués, résumés en une ligne sous le titre. */
  filterLine: string;
  /** Thème de l'application au moment du clic. */
  theme: "dark" | "light";
  visibleKinds: StatsKind[];
  stats: UsageStats;
};

export type PosterLayout = {
  height: number;
  width: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(
  x: number,
  y: number,
  content: string,
  options: {
    anchor?: "end" | "middle" | "start";
    fill: string;
    fontFamily?: string;
    fontSize: number;
    fontWeight?: number;
    opacity?: number;
  }
): string {
  const {
    anchor = "start",
    fill,
    fontFamily = SANS,
    fontSize,
    fontWeight,
    opacity,
  } = options;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${escapeXml(
    fontFamily
  )}" font-size="${fontSize}"${fontWeight ? ` font-weight="${fontWeight}"` : ""}${
    anchor === "start" ? "" : ` text-anchor="${anchor}"`
  }${opacity ? ` opacity="${opacity}"` : ""}>${escapeXml(content)}</text>`;
}

function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill: string; radius?: number; stroke?: string }
): string {
  const { fill, radius = 14, stroke } = options;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"${
    stroke ? ` stroke="${stroke}"` : ""
  } />`;
}

/** Graduations rondes, identiques à celles des graphiques de la page. */
function niceTicks(max: number, count: number): number[] {
  if (max <= 0) {
    return [0];
  }
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value));
  }
  return ticks;
}

function shortTick(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  }
  return value.toLocaleString("fr-FR");
}

function bucketLabel(bucket: string, includeYear: boolean): string {
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

/** Tronque au nombre de caractères maximal, en ajoutant une ellipse. */
function ellipsize(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function includeYears(points: { bucket: string }[]): boolean {
  const first = points.at(0);
  const last = points.at(-1);
  return Boolean(
    first && last && first.bucket.slice(0, 4) !== last.bucket.slice(0, 4)
  );
}

// ── Sections ────────────────────────────────────────────────────────────────

function renderHeader(palette: PosterPalette, input: PosterInput): string {
  const subtitle = `${STATS_PERIOD_LABELS[input.stats.period]} · ${
    STATS_GRANULARITY_LABELS[input.stats.consumptionGranularity]
  }`;
  return [
    text(PAD, 54, "Statistiques de consommation", {
      fill: palette.foreground,
      fontSize: 27,
      fontWeight: 700,
    }),
    text(PAD, 78, subtitle, {
      fill: palette.mutedForeground,
      fontSize: 13,
    }),
    text(PAD, 97, input.filterLine, {
      fill: palette.mutedForeground,
      fontSize: 11.5,
      opacity: 0.9,
    }),
    // Droite : nom de l'outil et date de génération. Utile quand l'image
    // atterrit dans une conversation sans contexte.
    text(W - PAD, 54, "mAI", {
      anchor: "end",
      fill: palette.foreground,
      fontSize: 20,
      fontWeight: 700,
    }),
    text(W - PAD, 78, `généré le ${new Date().toLocaleDateString("fr-FR")}`, {
      anchor: "end",
      fill: palette.mutedForeground,
      fontSize: 12,
    }),
  ].join("");
}

function renderKpi(palette: PosterPalette, input: PosterInput): string {
  const { overview } = input.stats;
  const gap = 16;
  const cardW = (CARD_W - gap * 2) / 3;
  const top = HEADER_H;
  const topModel = overview.topModel;

  const cards = [
    {
      detail: "créées sur la période",
      label: "Conversations en tout",
      value: overview.totalConversations.toLocaleString("fr-FR"),
    },
    {
      detail:
        overview.totalAudioTokens > 0
          ? `dont ${formatTokensFr(overview.totalAudioTokens)} en audio`
          : "texte, Agent et planification",
      label: "Tokens totaux",
      value: formatTokensFr(overview.totalTokens),
    },
    {
      detail: topModel
        ? `${Math.round(topModel.share * 100)} % des tokens · ${formatTokensFr(
            topModel.tokens
          )}`
        : "aucun modèle enregistré",
      label: "Modèle le plus utilisé",
      // Nom lisible résolu par le serveur (`StatsModelUsage.name`), pas un
      // identifiant raccourci : c'est le même libellé que la page. La carte
      // est étroite, `ellipsize` plus bas borne l'affichage de toute façon.
      value: topModel ? topModel.name : "—",
    },
  ];

  return cards
    .map((card, index) => {
      const x = PAD + index * (cardW + gap);
      return [
        roundedRect(x, top, cardW, KPI_H, {
          fill: palette.card,
          stroke: palette.border,
        }),
        text(x + 18, top + 30, card.label.toUpperCase(), {
          fill: palette.mutedForeground,
          fontSize: 9.5,
          fontWeight: 600,
        }),
        text(x + 18, top + 66, ellipsize(card.value, 18), {
          fill: palette.foreground,
          fontFamily: MONO,
          fontSize: 25,
          fontWeight: 600,
        }),
        text(x + 18, top + 92, ellipsize(card.detail, 30), {
          fill: palette.mutedForeground,
          fontSize: 11,
        }),
      ].join("");
    })
    .join("");
}

function renderConsumption(palette: PosterPalette, input: PosterInput): string {
  const top = HEADER_H + KPI_H + 24;
  const points = input.stats.consumption;
  const wants = (kind: StatsKind) => input.visibleKinds.includes(kind);
  const granularity: StatsGranularity = input.stats.consumptionGranularity;

  const titleTop = top + 22;
  const plotTop = top + 44;
  // Hauteur fixée, distincte de la hauteur de carte : il faut de la place pour
  // les libellés d'abscisse PUIS pour deux lignes de légende chiffrée. Les
  // versions précédentes empilaient la note sur les libellés, qui se
  // chevauchaient.
  const plotH = 196;
  const plotW = CARD_W - 150;

  let tokenMax = 0;
  let imageMax = 0;
  for (const point of points) {
    if (wants("text")) {
      tokenMax = Math.max(tokenMax, point.textTokens);
    }
    if (wants("audio")) {
      tokenMax = Math.max(tokenMax, point.audioTokens);
    }
    if (wants("image")) {
      imageMax = Math.max(imageMax, point.imageCount);
    }
  }
  const tokenTicks = niceTicks(tokenMax, 4);
  const imageTicks = niceTicks(imageMax, 4);
  const tokenTop = Math.max(tokenTicks.at(-1) ?? 1, 1);
  const imageTop = Math.max(imageTicks.at(-1) ?? 1, 1);

  const parts: string[] = [
    roundedRect(PAD, top, CARD_W, CONSUMPTION_H, {
      fill: palette.card,
      stroke: palette.border,
    }),
    text(
      PAD + 20,
      titleTop,
      `Consommation ${STATS_GRANULARITY_LABELS[granularity]}`,
      {
        fill: palette.foreground,
        fontSize: 14,
        fontWeight: 600,
      }
    ),
  ];

  // Légende, en haut à droite : l'unité de chaque série est ce qui empêche une
  // mauvaise lecture. Les tokens à gauche, les générations à droite.
  const legend: { color: string; label: string }[] = [];
  if (wants("text")) {
    legend.push({ color: palette.foreground, label: "Texte (tokens)" });
  }
  if (wants("audio")) {
    legend.push({ color: palette.info, label: "Audio (tokens)" });
  }
  if (wants("image")) {
    legend.push({ color: palette.warning, label: "Images (générations)" });
  }
  let legendX = PAD + CARD_W - 20;
  for (const item of [...legend].reverse()) {
    const width = item.label.length * 6.1 + 18;
    legendX -= width;
    parts.push(
      `<circle cx="${legendX + 4}" cy="${titleTop - 4}" r="4" fill="${item.color}" />`
    );
    parts.push(
      text(legendX + 13, titleTop, item.label, {
        fill: palette.mutedForeground,
        fontSize: 10.5,
      })
    );
    legendX -= 12;
  }

  if (points.length === 0) {
    parts.push(
      text(
        PAD + CARD_W / 2,
        plotTop + plotH / 2,
        "Aucune donnée sur la période",
        {
          anchor: "middle",
          fill: palette.mutedForeground,
          fontSize: 12,
        }
      )
    );
    return parts.join("");
  }

  const xFor = (index: number) =>
    points.length === 1
      ? PAD + 58 + plotW / 2
      : PAD + 58 + (index / (points.length - 1)) * plotW;
  const yFor = (value: number, max: number) =>
    plotTop + plotH - (max > 0 ? (value / max) * plotH : 0);

  for (const tick of tokenTicks) {
    const y = yFor(tick, tokenTop);
    parts.push(
      `<line x1="${PAD + 58}" y1="${y}" x2="${PAD + 58 + plotW}" y2="${y}" stroke="${palette.border}" stroke-width="1" />`
    );
    parts.push(
      text(PAD + 50, y + 3.5, shortTick(tick), {
        anchor: "end",
        fill: palette.mutedForeground,
        fontFamily: MONO,
        fontSize: 9,
      })
    );
  }
  if (wants("image")) {
    for (const tick of imageTicks) {
      parts.push(
        text(PAD + 66 + plotW, yFor(tick, imageTop) + 3.5, shortTick(tick), {
          fill: palette.mutedForeground,
          fontFamily: MONO,
          fontSize: 9,
        })
      );
    }
  }

  const series: {
    color: string;
    pick: (p: StatsConsumptionPoint) => number;
    top: number;
  }[] = [
    ...(wants("text")
      ? [
          {
            color: palette.foreground,
            pick: (p: StatsConsumptionPoint) => p.textTokens,
            top: tokenTop,
          },
        ]
      : []),
    ...(wants("audio")
      ? [
          {
            color: palette.info,
            pick: (p: StatsConsumptionPoint) => p.audioTokens,
            top: tokenTop,
          },
        ]
      : []),
    ...(wants("image")
      ? [
          {
            color: palette.warning,
            pick: (p: StatsConsumptionPoint) => p.imageCount,
            top: imageTop,
          },
        ]
      : []),
  ];

  for (const serie of series) {
    const path = points
      .map((point, index) => {
        const x = xFor(index);
        const y = yFor(serie.pick(point), serie.top);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    parts.push(
      `<path d="${path}" fill="none" stroke="${serie.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`
    );
  }

  const withYear = includeYears(points);
  const labelStep = Math.ceil(points.length / 7);
  // Le dernier point est toujours étiqueté, mais seulement s'il ne vient pas
  // tomber sur le précédent : deux libellés superposés rendent la zone illisible
  // (et donnaient l'illusion d'une année parasite dans la date).
  let lastDrawn = -1;
  points.forEach((point, index) => {
    const isLast = index === points.length - 1;
    const onStep = index % labelStep === 0;
    if (!onStep && !isLast) {
      return;
    }
    if (lastDrawn >= 0 && index - lastDrawn < labelStep * 0.7) {
      return;
    }
    lastDrawn = index;
    // Les libellés des extrémités sont ancrés vers l'intérieur : le dernier
    // point est au bord droit du tracé, où un texte centré déborderait de la
    // carte (et le premier, à gauche).
    const atStart = index === 0 && points.length > 1;
    const atEnd = isLast && points.length > 1;
    parts.push(
      text(
        xFor(index),
        plotTop + plotH + 16,
        bucketLabel(point.bucket, withYear),
        {
          anchor: atStart ? "start" : atEnd ? "end" : "middle",
          fill: palette.mutedForeground,
          fontSize: 9,
        }
      )
    );
  });

  // ── Pourquoi annoncer les PICS plutôt que seulement l'avertissement ──────
  // Texte et audio partagent l'axe des tokens, ce qui est correct — mais quand
  // l'un est vingt fois plus grand que l'autre, la petite série est écrasée sur
  // le bas du graphique et ne dit plus rien. Une image n'a pas d'infobulle pour
  // rattraper ça : sans ce chiffrage, la valeur de l'audio ou des images
  // disparaîtrait purement et simplement de l'affiche. On écrit donc le maximum
  // atteint par chaque série visible, ce qui rend l'image exploitable même
  // quand la forme de la courbe est illisible.
  const peaks: string[] = [];
  if (wants("text")) {
    peaks.push(
      `Texte : ${shortTick(Math.max(...points.map((p) => p.textTokens)))} tokens`
    );
  }
  if (wants("audio")) {
    peaks.push(
      `Audio : ${shortTick(Math.max(...points.map((p) => p.audioTokens)))} tokens`
    );
  }
  if (wants("image")) {
    peaks.push(
      `Images : ${Math.max(...points.map((p) => p.imageCount)).toLocaleString("fr-FR")} générations`
    );
  }

  parts.push(
    text(PAD + CARD_W / 2, plotTop + plotH + 36, peaks.join("  ·  "), {
      anchor: "middle",
      fill: palette.foreground,
      fontFamily: MONO,
      fontSize: 10,
    })
  );
  parts.push(
    text(
      PAD + CARD_W / 2,
      top + CONSUMPTION_H - 14,
      "Tokens à gauche, générations d'images à droite : les deux unités ne sont pas comparables",
      {
        anchor: "middle",
        fill: palette.mutedForeground,
        fontSize: 9.5,
        opacity: 0.85,
      }
    )
  );

  return parts.join("");
}

function renderConversations(
  palette: PosterPalette,
  input: PosterInput
): string {
  const top = HEADER_H + KPI_H + 24 + CONSUMPTION_H + 20;
  const points = input.stats.conversations;
  const granularity = input.stats.conversationsGranularity;

  const titleTop = top + 22;
  const plotTop = top + 40;
  const plotH = CONVERSATIONS_H - 62;
  const plotW = CARD_W - 110;

  const parts: string[] = [
    roundedRect(PAD, top, CARD_W, CONVERSATIONS_H, {
      fill: palette.card,
      stroke: palette.border,
    }),
    text(
      PAD + 20,
      titleTop,
      `Conversations créées ${STATS_GRANULARITY_LABELS[granularity]}`,
      {
        fill: palette.foreground,
        fontSize: 14,
        fontWeight: 600,
      }
    ),
  ];

  const legend: [string, string][] = [
    [palette.foreground, STATS_MODE_LABELS.chat],
    [palette.foreground, STATS_MODE_LABELS.agent],
  ];
  let legendX = PAD + CARD_W - 20;
  for (const [color, label] of [...legend].reverse()) {
    const width = label.length * 6.1 + 26;
    legendX -= width;
    const opacity = label === STATS_MODE_LABELS.chat ? 0.85 : 0.45;
    parts.push(
      `<rect x="${legendX}" y="${titleTop - 9}" width="10" height="10" rx="2" fill="${color}" opacity="${opacity}" />`
    );
    parts.push(
      text(legendX + 15, titleTop, label, {
        fill: palette.mutedForeground,
        fontSize: 10.5,
      })
    );
    legendX -= 10;
  }

  if (points.length === 0) {
    parts.push(
      text(
        PAD + CARD_W / 2,
        plotTop + plotH / 2,
        "Aucune conversation créée sur la période",
        {
          anchor: "middle",
          fill: palette.mutedForeground,
          fontSize: 12,
        }
      )
    );
    return parts.join("");
  }

  const max = Math.max(...points.map((point) => point.chat + point.agent), 1);
  const ticks = niceTicks(max, 3);
  const topTick = Math.max(ticks.at(-1) ?? 1, 1);
  const yFor = (value: number) => plotTop + plotH - (value / topTick) * plotH;

  for (const tick of ticks) {
    const y = yFor(tick);
    parts.push(
      `<line x1="${PAD + 50}" y1="${y}" x2="${PAD + 50 + plotW}" y2="${y}" stroke="${palette.border}" stroke-width="1" />`
    );
    parts.push(
      text(PAD + 42, y + 3.5, tick.toLocaleString("fr-FR"), {
        anchor: "end",
        fill: palette.mutedForeground,
        fontFamily: MONO,
        fontSize: 9,
      })
    );
  }

  const groupW = plotW / points.length;
  const barW = Math.min((groupW * 0.68) / 2, 22);
  const withYear = includeYears(points);
  const labelStep = Math.ceil(points.length / 10);

  points.forEach((point, index) => {
    const centerX = PAD + 50 + groupW * (index + 0.5);
    const chatX = centerX - barW - 1;
    const agentX = centerX + 1;
    const chatY = yFor(point.chat);
    const agentY = yFor(point.agent);
    const baseline = plotTop + plotH;
    parts.push(
      `<rect x="${chatX.toFixed(1)}" y="${chatY.toFixed(1)}" width="${barW}" height="${Math.max(
        baseline - chatY,
        1
      )}" rx="2" fill="${palette.foreground}" opacity="0.85" />`
    );
    parts.push(
      `<rect x="${agentX.toFixed(1)}" y="${agentY.toFixed(1)}" width="${barW}" height="${Math.max(
        baseline - agentY,
        1
      )}" rx="2" fill="${palette.foreground}" opacity="0.45" />`
    );
  });

  // Même garde d'espacement que sur la courbe : le libellé forcé sur le dernier
  // point tombait parfois sur son voisin et les rendait tous deux illisibles.
  let lastDrawn = -1;
  points.forEach((point, index) => {
    const isLast = index === points.length - 1;
    if (index % labelStep !== 0 && !isLast) {
      return;
    }
    if (lastDrawn >= 0 && index - lastDrawn < labelStep * 0.7) {
      return;
    }
    lastDrawn = index;
    parts.push(
      text(
        PAD + 50 + groupW * (index + 0.5),
        plotTop + plotH + 16,
        bucketLabel(point.bucket, withYear),
        {
          anchor: "middle",
          fill: palette.mutedForeground,
          fontSize: 9,
        }
      )
    );
  });

  return parts.join("");
}

function renderModels(
  palette: PosterPalette,
  input: PosterInput
): { height: number; svg: string } {
  const models: StatsModelUsage[] = input.stats.models.slice(0, 3);
  // Une affiche ne se dégrade pas en « aucun modèle » : la section disparaît
  // et la hauteur suit, l'image reste correctement composée.
  if (models.length === 0) {
    return { height: 0, svg: "" };
  }
  const top = HEADER_H + KPI_H + 24 + CONSUMPTION_H + 20 + CONVERSATIONS_H + 20;
  const height = 40 + models.length * 46 + 18;

  const parts: string[] = [
    roundedRect(PAD, top, CARD_W, height, {
      fill: palette.card,
      stroke: palette.border,
    }),
    text(PAD + 20, top + 26, "Répartition par modèle", {
      fill: palette.foreground,
      fontSize: 14,
      fontWeight: 600,
    }),
  ];

  models.forEach((entry, index) => {
    const y = top + 44 + index * 46;
    const barW = CARD_W - 40;
    // Nom lisible, comme sur la page ; l'identifiant exact reste disponible
    // dans la donnée, pas sur l'affiche, où la place compte.
    parts.push(
      text(PAD + 20, y, ellipsize(entry.name, 42), {
        fill: palette.foreground,
        fontSize: 11.5,
      })
    );
    parts.push(
      text(PAD + CARD_W - 20, y, `${Math.round(entry.share * 100)} %`, {
        anchor: "end",
        fill: palette.mutedForeground,
        fontFamily: MONO,
        fontSize: 11,
      })
    );
    parts.push(
      `<rect x="${PAD + 20}" y="${y + 8}" width="${barW}" height="8" rx="4" fill="${palette.muted}" />`
    );
    parts.push(
      `<rect x="${PAD + 20}" y="${y + 8}" width="${(
        barW * Math.max(entry.share, 0.02)
      ).toFixed(1)}" height="8" rx="4" fill="${palette.foreground}" />`
    );
  });

  return { height, svg: parts.join("") };
}

function renderFooter(
  palette: PosterPalette,
  y: number,
  stats: UsageStats
): string {
  const parts = [
    `<line x1="${PAD}" y1="${y}" x2="${PAD + CARD_W}" y2="${y}" stroke="${palette.border}" stroke-width="1" />`,
    text(PAD, y + 28, "mAI · statistiques de consommation", {
      fill: palette.mutedForeground,
      fontSize: 10.5,
    }),
  ];
  if (stats.warnings.length > 0) {
    // Les avertissements voyagent AVEC l'image. Une affiche qui cache que ses
    // séries image et audio ne sont pas filtrables diffuserait un message
    // trompeur à celui qui la reçoit.
    parts.push(
      text(PAD + CARD_W, y + 28, ellipsize(`⚠ ${stats.warnings[0]}`, 88), {
        anchor: "end",
        fill: palette.mutedForeground,
        fontSize: 10,
        opacity: 0.9,
      })
    );
  }
  return parts.join("");
}

/** Résumé lisible des filtres, repris dans l'affiche. */
export function describeFilters(
  stats: UsageStats,
  visibleKinds: StatsKind[]
): string {
  const parts = [`Période : ${STATS_PERIOD_LABELS[stats.period]}`];
  parts.push(
    visibleKinds.length === 3
      ? "Contenu : texte, images et audio"
      : `Contenu : ${visibleKinds
          .map((kind) => STATS_KIND_LABELS[kind].toLowerCase())
          .join(", ")}`
  );
  return parts.join(" · ");
}

/**
 * Produit l'affiche complète en SVG autonome.
 *
 * `height` est calculé à partir des sections réellement présentes : une
 * distribution sans modèle ne laisse pas de trou en bas de l'image.
 */
export function buildStatsPoster(input: PosterInput): {
  height: number;
  svg: string;
  width: number;
} {
  const palette = input.theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
  const models = renderModels(palette, input);
  const footerTop =
    HEADER_H +
    KPI_H +
    24 +
    CONSUMPTION_H +
    20 +
    CONVERSATIONS_H +
    20 +
    models.height +
    (models.height > 0 ? 20 : 0);
  const height = footerTop + FOOTER_H + 16;

  const body = [
    `<rect x="0" y="0" width="${W}" height="${height}" fill="${palette.background}" />`,
    renderHeader(palette, input),
    renderKpi(palette, input),
    renderConsumption(palette, input),
    renderConversations(palette, input),
    models.svg,
    renderFooter(palette, footerTop, input.stats),
  ].join("");

  return {
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="Statistiques de consommation mAI">${body}</svg>`,
    width: W,
  };
}

/** Nom de fichier : `mAI-statistiques-30-jours-2026-03-15.png`. */
export function posterFilename(
  stats: UsageStats,
  extension: "png" | "svg",
  now: Date = new Date()
): string {
  const period = STATS_PERIOD_LABELS[stats.period]
    .toLowerCase()
    .replace(/\s+/g, "-");
  const day = now.toISOString().slice(0, 10);
  return `mAI-statistiques-${period}-${day}.${extension}`;
}
