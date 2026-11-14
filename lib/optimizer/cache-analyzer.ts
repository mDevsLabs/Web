import fs from "node:fs";
import path from "node:path";
import type { AnalyzerResult, DiagnosticIssue } from "./types";

function findRouteFiles(dir: string, list: string[] = []): string[] {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findRouteFiles(full, list);
    } else if (entry.name === "route.ts" || entry.name === "route.js") {
      list.push(full);
    }
  }
  return list;
}

export function runCacheAnalysis(baseDir = process.cwd()): AnalyzerResult {
  const issues: DiagnosticIssue[] = [];
  const appDir = path.join(baseDir, "app");
  const routeFiles = findRouteFiles(appDir);

  for (const routePath of routeFiles) {
    const relativePath = path.relative(baseDir, routePath).replace(/\\/g, "/");
    const content = fs.readFileSync(routePath, "utf-8");

    const hasGet = /\bexport\s+(async\s+)?function\s+GET\b/.test(content);
    if (!hasGet) continue;

    const hasCacheControl = /Cache-Control/i.test(content);
    const hasRevalidate = /\bexport\s+const\s+revalidate\b/.test(content);
    const usesAuth =
      /\b(getMaiUser|getMaiSessionToken|auth\(\)|verifyCronAuth|MAI_SESSION_COOKIE)\b/.test(
        content
      );
    const isPublicCatalog = /api\/(models|plugins|site)/.test(relativePath);

    // Détection de cache public non sécurisé sur une route authentifiée
    if (usesAuth && /public,\s*max-age/i.test(content)) {
      issues.push({
        category: "cache",
        file: relativePath,
        id: `unsafe-public-cache-${relativePath}`,
        message:
          "Cette route utilise l'authentification utilisateur mais expose un en-tête Cache-Control public.",
        priority: "P0",
        recommendation:
          "Changer la directive en `private, max-age=...` pour éviter que les données privées ne soient partagées sur un CDN.",
        severity: "error",
        title: "Risque de sécurité : Cache public sur route privée",
      });
    }

    // Détection de route de catalogue sans stratégie de cache
    if (isPublicCatalog && !hasCacheControl && !hasRevalidate) {
      issues.push({
        category: "cache",
        file: relativePath,
        id: `missing-catalog-cache-${relativePath}`,
        message:
          "Cette route sert des données de catalogue ou publiques sans en-tête Cache-Control ni directive revalidate.",
        priority: "P1",
        recommendation:
          "Ajouter un en-tête `Cache-Control` (ex: `private, max-age=60, stale-while-revalidate=120`) ou une revalidation ISR.",
        severity: "warning",
        title: "Route de catalogue sans en-tête de cache",
      });
    }

    // Détection d'appel upstream sans revalidation
    if (
      content.includes("upstreamJson") &&
      !content.includes("revalidate") &&
      !content.includes("cache:")
    ) {
      // Info warning
      issues.push({
        category: "cache",
        file: relativePath,
        id: `upstream-without-cache-opts-${relativePath}`,
        message:
          "Un appel upstreamJson est exécuté sans spécifier d'options de cache (revalidate ou cache: 'no-store').",
        priority: "P2",
        recommendation:
          "Spécifier explicitement les options `next: { revalidate: ... }` si les données sont réutilisables.",
        severity: "info",
        title: "Appel amont sans politique explicite de cache",
      });
    }
  }

  return {
    category: "cache",
    issues,
    metrics: {
      issuesFound: issues.length,
      routesAnalyzed: routeFiles.length,
    },
  };
}
