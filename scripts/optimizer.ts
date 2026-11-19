import fs from "node:fs";
import path from "node:path";
import {
  formatReportAsMarkdown,
  generateOptimizerReport,
} from "../lib/optimizer";

function main() {
  const args = process.argv.slice(2);
  const isCi = args.includes("--ci");
  const saveReport = args.includes("--report");

  console.log(
    "🔍 [mAI Optimizer] Démarrage de l'analyse globale du monorepo..."
  );
  const report = generateOptimizerReport(process.cwd());
  const markdown = formatReportAsMarkdown(report);

  console.log(`\nScore de santé : ${report.score}/100`);
  console.log(`Problèmes P0 : ${report.summary.p0Count}`);
  console.log(`Problèmes P1 : ${report.summary.p1Count}`);
  console.log(`Problèmes P2 : ${report.summary.p2Count}\n`);

  if (saveReport) {
    const artifactDir = path.join(process.cwd(), "artifacts");
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    const reportPath = path.join(artifactDir, "perf-report.md");
    fs.writeFileSync(reportPath, markdown, "utf-8");
    console.log(`📄 Rapport sauvegardé : ${reportPath}`);
  } else {
    console.log(markdown);
  }

  if (isCi && report.summary.p0Count > 0) {
    console.error(
      "❌ [mAI Optimizer] Échec CI : Des problèmes critiques (P0) ont été détectés."
    );
    process.exit(1);
  }

  console.log("✅ [mAI Optimizer] Analyse terminée avec succès.");
}

main();
