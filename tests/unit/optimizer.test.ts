import { describe, expect, it } from "vitest";
import {
  formatReportAsMarkdown,
  generateOptimizerReport,
  runCacheAnalysis,
  runCodeAnalysis,
  runCpuAnalysis,
} from "@/lib/optimizer";

describe("mAI Optimizer — Module interne d'optimisation", () => {
  it("exécute l'analyse statique du code (Code Analyzer)", () => {
    const result = runCodeAnalysis(process.cwd());
    expect(result.category).toBe("code");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.metrics.filesScanned).toBeGreaterThan(0);
  });

  it("exécute l'analyse du cache (Cache Analyzer)", () => {
    const result = runCacheAnalysis(process.cwd());
    expect(result.category).toBe("cache");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.metrics.routesAnalyzed).toBeGreaterThan(0);
  });

  it("exécute l'analyse de consommation CPU heuristique (CPU Analyzer)", () => {
    const result = runCpuAnalysis(process.cwd());
    expect(result.category).toBe("cpu");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.metrics.filesScanned).toBeGreaterThan(0);
  });

  it("génère un rapport global de performance et un score cohérent", () => {
    const report = generateOptimizerReport(process.cwd());
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.summary.p0Count).toBe(0); // Doit être 0 grâce à nos optimisations
    expect(report.summary.totalIssues).toBeGreaterThanOrEqual(0);
  });

  it("formate correctement le rapport en Markdown", () => {
    const report = generateOptimizerReport(process.cwd());
    const md = formatReportAsMarkdown(report);
    expect(md).toContain("# 📊 Rapport de Performance mAI Optimizer");
    expect(md).toContain("Score Global de Santé CPU & Cache");
  });
});
