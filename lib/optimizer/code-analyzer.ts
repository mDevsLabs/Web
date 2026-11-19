import fs from "node:fs";
import path from "node:path";
import type { AnalyzerResult, DiagnosticIssue } from "./types";

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".next" &&
        entry.name !== ".git" &&
        entry.name !== "dist"
      ) {
        walkDir(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runCodeAnalysis(baseDir = process.cwd()): AnalyzerResult {
  const issues: DiagnosticIssue[] = [];
  const scannedDirs = ["app", "lib", "components"];
  let totalFilesScanned = 0;

  for (const dirName of scannedDirs) {
    const targetDir = path.join(baseDir, dirName);
    const files = walkDir(targetDir);
    totalFilesScanned += files.length;

    for (const filePath of files) {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, "/");
      if (relativePath.includes("lib/optimizer")) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Vérifier les imports dynamiques dans des boucles
      let insideLoop = false;
      let loopIndent = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Détection de boucle
        if (/\b(for|while)\s*\(/.test(trimmed) || /\.forEach\(/.test(trimmed)) {
          insideLoop = true;
          loopIndent = line.search(/\S/);
        } else if (
          insideLoop &&
          line.length > 0 &&
          line.search(/\S/) <= loopIndent &&
          trimmed.startsWith("}")
        ) {
          insideLoop = false;
        }

        if (
          insideLoop &&
          /await\s+import\s*\(/.test(line) &&
          !line.includes(".test(") &&
          !line.includes("Analyzer")
        ) {
          issues.push({
            category: "code",
            file: relativePath,
            id: `dynamic-import-loop-${relativePath}:${i + 1}`,
            line: i + 1,
            message:
              "Un `await import()` est appelé à l'intérieur d'une boucle, ce qui dégrade sévèrement les performances.",
            priority: "P0",
            recommendation:
              "Déplacer l'import au niveau supérieur du module ou avant la boucle.",
            severity: "error",
            title: "Import dynamique dans une boucle",
          });
        }

        // Vérifier les fonctions synchrones bloquantes I/O dans des routes API
        if (
          relativePath.startsWith("app/") &&
          /\b(readFileSync|writeFileSync|execSync)\b/.test(line)
        ) {
          issues.push({
            category: "code",
            file: relativePath,
            id: `sync-io-api-${relativePath}:${i + 1}`,
            line: i + 1,
            message: `Utilisation de ${trimmed.match(/\b(readFileSync|writeFileSync|execSync)\b/)?.[0]} qui bloque le thread Node.js.`,
            priority: "P1",
            recommendation:
              "Utiliser l'équivalent asynchrone (fs/promises ou child_process.exec) pour libérer le thread pool.",
            severity: "warning",
            title: "Appel synchrone bloquant (I/O) dans une route",
          });
        }
      }

      // Fichiers monolithiques (> 1000 lignes)
      if (lines.length > 1000 && !relativePath.includes(".generated.")) {
        issues.push({
          category: "code",
          file: relativePath,
          id: `large-file-${relativePath}`,
          message: `Le fichier comporte ${lines.length} lignes, ce qui alourdit l'analyse statique et la maintenance.`,
          priority: "P2",
          recommendation: "Découper le fichier en sous-modules thématiques.",
          severity: "info",
          title: "Fichier volumineux (> 1000 lignes)",
        });
      }
    }
  }

  // Vérifier package.json pour dépendances redondantes
  const pkgPath = path.join(baseDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["bcrypt-ts"] && deps.bcryptjs) {
        issues.push({
          category: "code",
          file: "package.json",
          id: "duplicate-bcrypt-deps",
          message: "Le projet déclare à la fois `bcrypt-ts` et `bcryptjs`.",
          priority: "P2",
          recommendation:
            "Conserver une seule implémentation (bcryptjs) pour alléger node_modules.",
          severity: "warning",
          title: "Dépendances bcrypt redondantes",
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    category: "code",
    issues,
    metrics: {
      filesScanned: totalFilesScanned,
      issuesFound: issues.length,
    },
  };
}
