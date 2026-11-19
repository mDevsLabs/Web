import fs from "node:fs";
import path from "node:path";
import type { AnalyzerResult, DiagnosticIssue } from "./types";

function walkTsFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        !["node_modules", ".next", ".git", "dist", "public"].includes(
          entry.name
        )
      ) {
        walkTsFiles(fullPath, fileList);
      }
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runCpuAnalysis(baseDir = process.cwd()): AnalyzerResult {
  const issues: DiagnosticIssue[] = [];
  const scannedDirs = ["app", "lib"];
  let filesScanned = 0;

  for (const dirName of scannedDirs) {
    const targetDir = path.join(baseDir, dirName);
    const files = walkTsFiles(targetDir);
    filesScanned += files.length;

    for (const filePath of files) {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, "/");
      if (relativePath.includes("lib/optimizer")) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      let insideLoop = false;
      let loopBraceDepth = 0;
      let loopHeader = "";
      let loopIgnored = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!insideLoop && /\b(for|while)\s*\(/.test(trimmed)) {
          insideLoop = true;
          loopBraceDepth = 0;
          loopHeader = trimmed;
          loopIgnored =
            trimmed.includes("optimizer-ignore") ||
            (i > 0 && lines[i - 1].includes("optimizer-ignore"));
        }

        if (insideLoop) {
          const opens = (line.match(/\{/g) || []).length;
          const closes = (line.match(/\}/g) || []).length;
          loopBraceDepth += opens - closes;
          if (loopBraceDepth <= 0 && (opens > 0 || closes > 0)) {
            insideLoop = false;
            loopHeader = "";
            loopIgnored = false;
          }
        }

        const isChunkedBatch =
          loopHeader.includes("+=") ||
          line.includes("chunk") ||
          line.includes("values(chunk");

        // 1. Détection de requêtes SQL unitaires dans une boucle (Problème N+1)
        if (
          insideLoop &&
          !loopIgnored &&
          !isChunkedBatch &&
          !line.includes("optimizer-ignore") &&
          /await\s+(getDb\(\)|db|tx)\.(insert|select|update|delete)/.test(line)
        ) {
          issues.push({
            category: "cpu",
            file: relativePath,
            id: `n-plus-one-query-${relativePath}:${i + 1}`,
            line: i + 1,
            message:
              "Une requête SQL Drizzle est exécutée séquentiellement au sein d'une boucle.",
            priority: "P0",
            recommendation:
              "Effectuer un batch insert/update ou regrouper les sélections avec `inArray()` avant la boucle.",
            severity: "error",
            title: "Requête base de données dans une boucle (N+1)",
          });
        }

        // 2. Détection de compilation de RegExp dans une boucle
        if (insideLoop && /new\s+RegExp\(/.test(line)) {
          issues.push({
            category: "cpu",
            file: relativePath,
            id: `regex-in-loop-${relativePath}:${i + 1}`,
            line: i + 1,
            message:
              "La création d'une instance `RegExp` dans une boucle force le moteur V8 à recompiler l'expression à chaque tour.",
            priority: "P1",
            recommendation:
              "Définir la RegExp en dehors de la boucle ou sous forme de constante de module.",
            severity: "warning",
            title: "Compilation RegExp répétitive dans une boucle",
          });
        }

        // 3. Détection de JSON.parse / JSON.stringify répété dans une boucle
        if (
          insideLoop &&
          /JSON\.(parse|stringify)\(/.test(line) &&
          !line.includes("JSON.parse(JSON.stringify")
        ) {
          // Émettre un avertissement seulement si c'est combiné avec un await
          if (line.includes("await") || line.includes("sql`")) {
            issues.push({
              category: "cpu",
              file: relativePath,
              id: `json-in-loop-${relativePath}:${i + 1}`,
              line: i + 1,
              message:
                "Appel répété à JSON.parse/stringify au cours d'itérations asynchrones.",
              priority: "P2",
              recommendation:
                "Pré-analyser la structure ou utiliser des types typés natifs sans conversions répétées.",
              severity: "info",
              title: "Sérialisation/Désérialisation JSON en boucle",
            });
          }
        }
      }
    }
  }

  return {
    category: "cpu",
    issues,
    metrics: {
      filesScanned,
      issuesFound: issues.length,
    },
  };
}
