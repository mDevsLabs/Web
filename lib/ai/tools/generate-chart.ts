import { tool } from "ai";
import { z } from "zod";

const DEFAULT_PALETTE = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#f97316", // orange
  "#ef4444", // red
];

function generateBarChartSvg({
  title,
  data,
  xAxisLabel,
  yAxisLabel,
  width = 600,
  height = 360,
}: {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  width?: number;
  height?: number;
}): string {
  const margin = { bottom: 60, left: 60, right: 30, top: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(16, Math.min(60, (plotWidth / data.length) * 0.7));
  const step = plotWidth / data.length;

  const bars = data
    .map((d, i) => {
      const barHeight = (d.value / maxValue) * plotHeight;
      const x = margin.left + i * step + (step - barWidth) / 2;
      const y = margin.top + plotHeight - barHeight;
      const color = d.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];

      return `
      <g class="bar-group">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}">
          <title>${d.label}: ${d.value}</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">${d.value}</text>
        <text x="${x + barWidth / 2}" y="${margin.top + plotHeight + 18}" text-anchor="middle" font-size="11" fill="#475569" transform="rotate(0, ${x + barWidth / 2}, ${margin.top + plotHeight + 18})">${d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}</text>
      </g>`;
    })
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">${title}</text>
  ${yAxisLabel ? `<text x="15" y="${height / 2}" text-anchor="middle" font-size="11" fill="#94a3b8" transform="rotate(-90 15 ${height / 2})">${yAxisLabel}</text>` : ""}
  ${xAxisLabel ? `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#94a3b8">${xAxisLabel}</text>` : ""}
  <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}" stroke="#e2e8f0" stroke-width="1.5" />
  ${bars}
</svg>`.trim();
}

function generatePieChartSvg({
  title,
  data,
  width = 500,
  height = 360,
  isDoughnut = false,
}: {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  width?: number;
  height?: number;
  isDoughnut?: boolean;
}): string {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const cx = width * 0.38;
  const cy = height * 0.55;
  const radius = Math.min(width * 0.3, height * 0.35);
  const innerRadius = isDoughnut ? radius * 0.55 : 0;

  let currentAngle = 0;
  const slices: string[] = [];
  const legend: string[] = [];

  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const color = d.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];

    let pathD = "";
    if (innerRadius > 0) {
      const ix1 = cx + innerRadius * Math.cos(endAngle);
      const iy1 = cy + innerRadius * Math.sin(endAngle);
      const ix2 = cx + innerRadius * Math.cos(startAngle);
      const iy2 = cy + innerRadius * Math.sin(startAngle);
      pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`;
    } else {
      pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    slices.push(
      `<path d="${pathD}" fill="${color}" stroke="#ffffff" stroke-width="2"><title>${d.label}: ${d.value} (${Math.round((d.value / total) * 100)}%)</title></path>`
    );

    const legendY = 60 + i * 24;
    if (legendY < height - 20) {
      legend.push(`
        <g transform="translate(${width * 0.72}, ${legendY})">
          <rect width="12" height="12" rx="3" fill="${color}" />
          <text x="18" y="10" font-size="11" fill="#334155">${d.label} (${Math.round((d.value / total) * 100)}%)</text>
        </g>
      `);
    }
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="${width / 2}" y="32" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">${title}</text>
  <g>${slices.join("")}</g>
  <g>${legend.join("")}</g>
</svg>`.trim();
}

export const generateChart = tool({
  description:
    "Générer un graphique visuel (barres, camembert, anneau/doughnut) au format SVG autonome à partir de données structurées. Idéal pour afficher des statistiques, comparaisons, répartitions et bilans chiffrés.",
  execute: async (input) => {
    const { chartType = "bar", data, title, xAxisLabel, yAxisLabel } = input;

    if (!data || data.length === 0) {
      return { error: "Aucune donnée fournie pour générer le graphique." };
    }

    let svg = "";
    if (chartType === "pie" || chartType === "doughnut") {
      svg = generatePieChartSvg({
        data,
        isDoughnut: chartType === "doughnut",
        title,
      });
    } else {
      svg = generateBarChartSvg({
        data,
        title,
        xAxisLabel,
        yAxisLabel,
      });
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const average = total / data.length;

    return {
      average: Number(average.toFixed(2)),
      chartType,
      dataPoints: data.length,
      svg,
      title,
      total,
    };
  },
  inputSchema: z.object({
    chartType: z
      .enum(["bar", "pie", "doughnut"])
      .optional()
      .describe(
        "Type de graphique : 'bar' (barres verticales), 'pie' (camembert), 'doughnut' (anneau)"
      ),
    data: z
      .array(
        z.object({
          color: z
            .string()
            .optional()
            .describe("Couleur hexadécimale (optionnel, ex: #6366f1)"),
          label: z.string().describe("Nom du point ou catégorie"),
          value: z.number().describe("Valeur numérique positive"),
        })
      )
      .min(1)
      .max(30)
      .describe("Tableau des points de données (1 à 30 éléments)"),
    title: z.string().min(1).max(120).describe("Titre du graphique"),
    xAxisLabel: z
      .string()
      .optional()
      .describe("Légende de l'axe horizontal X (optionnel)"),
    yAxisLabel: z
      .string()
      .optional()
      .describe("Légende de l'axe vertical Y (optionnel)"),
  }),
});
