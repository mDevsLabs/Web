import { runCacheAnalysis } from "./cache-analyzer";
import { runCodeAnalysis } from "./code-analyzer";
import { runCpuAnalysis } from "./cpu-analyzer";
import type { DiagnosticIssue, OptimizerReport } from "./types";

export function generateOptimizerReport(
  baseDir = process.cwd()
): OptimizerReport {
  const codeResult = runCodeAnalysis(baseDir);
  const cacheResult = runCacheAnalysis(baseDir);
  const cpuResult = runCpuAnalysis(baseDir);

  const allIssues: DiagnosticIssue[] = [
    ...codeResult.issues,
    ...cacheResult.issues,
    ...cpuResult.issues,
  ];

  const p0Count = allIssues.filter((i) => i.priority === "P0").length;
  const p1Count = allIssues.filter((i) => i.priority === "P1").length;
  const p2Count = allIssues.filter((i) => i.priority === "P2").length;

  // Calcul du score de santé (Base 100, pénalités: P0 = -20, P1 = -5, P2 = -1)
  const penalty = p0Count * 20 + p1Count * 5 + p2Count * 1;
  const score = Math.max(0, 100 - penalty);

  return {
    results: {
      cache: cacheResult,
      code: codeResult,
      cpu: cpuResult,
    },
    score,
    summary: {
      p0Count,
      p1Count,
      p2Count,
      totalIssues: allIssues.length,
    },
    timestamp: new Date().toISOString(),
  };
}

export function formatReportAsMarkdown(report: OptimizerReport): string {
  const { summary, score, results } = report;
  const allIssues = [
    ...results.code.issues,
    ...results.cache.issues,
    ...results.cpu.issues,
  ];

  const p0Issues = allIssues.filter((i) => i.priority === "P0");
  const p1Issues = allIssues.filter((i) => i.priority === "P1");
  const p2Issues = allIssues.filter((i) => i.priority === "P2");

  let md = "# 📊 Rapport de Performance mAI Optimizer\n\n";
  md += `**Date de génération** : ${report.timestamp}\n`;
  md += `**Score Global de Santé CPU & Cache** : **${score}/100**\n\n`;

  md += "### 📈 Synthèse des Détections\n\n";
  md += "| Priorité | Gravité | Nombre de Problèmes |\n";
  md += "| :--- | :--- | :--- |\n";
  md += `| **P0 (Critique)** | Bloquant / Surcoût immédiat | ${summary.p0Count} |\n`;
  md += `| **P1 (Majeur)** | Impact de performance avéré | ${summary.p1Count} |\n`;
  md += `| **P2 (Modéré)** | Optimisation recommandée | ${summary.p2Count} |\n`;
  md += `| **Total** | | **${summary.totalIssues}** |\n\n`;

  if (p0Issues.length > 0) {
    md += "## 🚨 Problèmes Critiques (P0)\n\n";
    for (const issue of p0Issues) {
      md += `### [${issue.category.toUpperCase()}] ${issue.title}\n`;
      if (issue.file)
        md += `- **Fichier** : \`${issue.file}${issue.line ? `:${issue.line}` : ""}\`\n`;
      md += `- **Diagnostic** : ${issue.message}\n`;
      md += `- **Recommandation** : ${issue.recommendation}\n\n`;
    }
  }

  if (p1Issues.length > 0) {
    md += "## ⚠️ Avertissements Majeurs (P1)\n\n";
    for (const issue of p1Issues) {
      md += `### [${issue.category.toUpperCase()}] ${issue.title}\n`;
      if (issue.file)
        md += `- **Fichier** : \`${issue.file}${issue.line ? `:${issue.line}` : ""}\`\n`;
      md += `- **Diagnostic** : ${issue.message}\n`;
      md += `- **Recommandation** : ${issue.recommendation}\n\n`;
    }
  }

  if (p2Issues.length > 0) {
    md += "## 💡 Recommandations et Bonnes Pratiques (P2)\n\n";
    for (const issue of p2Issues) {
      md += `- **${issue.title}**${issue.file ? ` (\`${issue.file}\`)` : ""} : ${issue.recommendation}\n`;
    }
    md += "\n";
  }

  if (allIssues.length === 0) {
    md +=
      "✨ **Félicitations ! Aucun problème de performance ou de régression détecté.**\n";
  }

  return md;
}
