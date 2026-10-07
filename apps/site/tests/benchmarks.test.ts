import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getModelById } from "@/lib/models";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function section(markdown: string, heading: string): string {
  const marker = new RegExp(`(?:^|\\r?\\n)## ${heading}\\r?\\n`);
  const match = marker.exec(markdown);
  if (!match) return "";
  const start = match.index + match[0].length;
  const remainder = markdown.slice(start);
  const nextHeading = remainder.search(/\r?\n## /);
  return nextHeading >= 0 ? remainder.slice(0, nextHeading) : remainder;
}

function tableRows(markdown: string, benchmark: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.startsWith(`| **${benchmark}**`));
}

/** Cellules d'une ligne de tableau, sans la mise en forme Markdown. */
function cells(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim().replace(/^\*\*|\*\*$/g, ""));
}

describe("mAI-2 benchmark content", () => {
  const article = read("docs/news/introducing-mai-2/index.md");
  const fullModel = read("docs/mai-2/README.md");
  const miniModel = read("docs/mai-2-mini/README.md");
  const fullArticleSection = section(article, "mAI-2");
  const miniArticleSection = section(article, "mAI-2 Mini");

  it("uses the approved full-model comparison columns", () => {
    expect(article).toContain("GPT-6.1 Sol");
    expect(article).toContain("GPT-6 Astra");
    expect(article).not.toMatch(/\|\s*Claude Opus 5\s*\|/);
    expect(article).not.toMatch(/\|\s*Gemini 3\.1 Pro\s*\|/);
    // Colonnes retirées de la campagne mAI-2 : elles ne doivent plus réapparaître.
    expect(article).not.toContain("GLM 5.3 Flash");
    expect(article).not.toContain("Claude Haiku 4.5");
    expect(article).not.toContain("Gemini 3.5 Flash-Lite");
  });

  it("uses the approved Mini comparison columns", () => {
    const miniHeader = article
      .split("\n")
      .find((line) => line.includes("mAI 2 Mini") && line.includes("GPT-6 Luna"));

    expect(miniHeader).toBeTruthy();
    expect(miniHeader).not.toContain("Claude Opus");
    expect(miniHeader).not.toContain("Gemini 3.1 Pro");
    expect(miniHeader).toContain("Gemini 3.8 Flash");
    expect(miniHeader).toContain("Qwen3.8-Omni-Flash");
  });

  it.each([
    "GPQA Diamond",
    "HLE",
    "Codeforces (Rating)",
    "MathArena Apex",
    "Terminal-Bench 2.1",
    "Terminal-Bench 3.0",
    "Terminal-Bench 4.0",
    "DeepSWE v1.1",
    "ProgramBench",
    "NL2Repo-Bench",
    "CyberGym",
    "SEC-Bench Pro",
    "ExploitGym",
    "HLE (w/tools)",
    "AutomationBench",
    "Agents' Last Exam",
    "Chartography (w/tools)",
    "BabyVision (w/tools)",
    "ZeroBench-main (w/tools)",
  ])("keeps the full %s row synchronized", (benchmark) => {
    expect(tableRows(fullArticleSection, benchmark)).toEqual(
      tableRows(fullModel, benchmark),
    );
  });

  it.each([
    "Terminal-Bench 2.1",
    "DeepSWE v1.1",
    "Agents' Last Exam",
    "AutomationBench",
    "HLE (w/tools)",
    "GDPVal-AA",
    "CyberGym",
    "ExploitBench",
    "ExploitGym",
  ])("keeps the Mini %s row synchronized", (benchmark) => {
    expect(tableRows(miniArticleSection, benchmark)).toEqual(
      tableRows(miniModel, benchmark),
    );
  });

  it("scores Terminal-Bench on its own row per version", () => {
    // 66.4 est le score de Claude Opus 5.5 sur Terminal-Bench 4.0 : il ne doit
    // apparaître ni sur 2.1 ni sur 3.0, qui ont chacun leur propre harnais.
    const full = tableRows(fullModel, "Terminal-Bench 4.0");
    expect(full).toHaveLength(1);
    expect(cells(full[0])).toEqual([
      "Terminal-Bench 4.0",
      "31.2",
      "66.4",
      "57.4",
      "56.1",
      "57.9",
    ]);
    expect(cells(tableRows(fullModel, "Terminal-Bench 2.1")[0])).toEqual([
      "Terminal-Bench 2.1",
      "90.6",
      "—",
      "—",
      "—",
      "—",
    ]);
    expect(cells(tableRows(fullModel, "Terminal-Bench 3.0")[0])).toEqual([
      "Terminal-Bench 3.0",
      "30.0",
      "—",
      "—",
      "—",
      "—",
    ]);
  });

  it.each([
    ["mai-2", "GPT-6.1 Sol", "GPT-6 Astra"],
    ["mai-2-mini", "Qwen3.8-Omni-Flash", "GPT-6 Luna"],
  ])(
    "serves the %s benchmark table through the model detail page",
    (id, ...columns) => {
      // Les pages /models/[id]Affichent docs/<id>/README.md via getModelById :
      // le tableau visible par l'utilisateur est celui charge ici.
      const readme = getModelById(id)?.readmeContent ?? "";
      const header = readme
        .split("\n")
        .find((line) => line.startsWith("| Benchmark"));

      expect(header).toBeTruthy();
      for (const column of columns) {
        expect(header).toContain(column);
      }
      // Les colonnes retirées ne doivent pasfuiter dans le README servi.
      expect(header).not.toContain("GLM 5.3 Flash");
      expect(header).not.toContain("Claude Haiku 4.5");
    }
  );

  it("publishes scores without the legacy French percent format", () => {
    for (const markdown of [fullModel, miniModel]) {
      const benchRows = markdown
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^\|\s*\*\*.+\*\*/.test(line));

      expect(benchRows.length).toBeGreaterThan(0);
      // Ancien format « 90,6 % » : plus aucune valeur de tableau ne l'utilise.
      expect(benchRows.join("\n")).not.toMatch(/\d,\d\s*%/);
    }
  });
});