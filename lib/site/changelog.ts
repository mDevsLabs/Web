import fs from "fs";
import path from "path";

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  type: string;
  icon: string;
  color: string;
  bgColor: string;
  project: string;
  description: string;
};

export type ChangelogsByProject = {
  mAI: ChangelogEntry[];
  mSearch: ChangelogEntry[];
  mAIRaw?: string;
  mSearchRaw?: string;
};

/**
 * Contenu figé au premier rendu du processus.
 *
 * Les changelogs sont des fichiers versionnés avec le build : les relire et
 * les re-parser à chaque requête (`/site`, `/changelog`) ne pouvait rien
 * apprendre de neuf avant le déploiement suivant. Un nouveau processus (ou un
 * redéploiement) repart de zéro.
 */
let cachedChangelogs: ChangelogsByProject | null = null;

export function getChangelogs(): ChangelogsByProject {
  if (cachedChangelogs) {
    return cachedChangelogs;
  }

  const readRaw = (folder: string): string => {
    const filePath = path.join(
      process.cwd(),
      `apps/site/docs/${folder}/changelog/CHANGELOG.md`
    );
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  };

  const mAIRaw = readRaw("mai");
  const mSearchRaw = readRaw("msearch");

  cachedChangelogs = {
    mAI: parseChangelog(mAIRaw, "mAI", "text-purple-600", "bg-purple-50"),
    mAIRaw,
    mSearch: parseChangelog(
      mSearchRaw,
      "mSearch",
      "text-blue-600",
      "bg-blue-50"
    ),
    mSearchRaw,
  };
  return cachedChangelogs;
}

function parseChangelog(
  fileContents: string,
  projectName: string,
  color: string,
  bgColor: string
): ChangelogEntry[] {
  if (!fileContents) return [];

  // Split by ## or ### at the start of a line
  const sections = fileContents.split(/^##+\s+/m).filter(Boolean);
  const entries: ChangelogEntry[] = [];

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const header = lines.shift() || "";

    // Test alternative format like: [Version 1.0.0](...) or Version 1.0.0
    const versionMatch =
      header.match(/Version\s+([^\s\])]+)/i) || header.match(/^([^\s-]+)/);
    if (!versionMatch) continue;

    const version = versionMatch[1];
    let date = "Inconnu";
    let title = `Mise à jour ${version}`;
    let type = "feature";
    let icon = "Star";

    // Look for date in lines (e.g. Released on **2026-06-28**)
    const dateLineIndex = lines.findIndex((l) => l.includes("Released on"));
    if (dateLineIndex !== -1) {
      const dateMatch = lines[dateLineIndex].match(
        /Released on \*\*([^*]+)\*\*/i
      );
      if (dateMatch) {
        date = dateMatch[1];
      }
    }

    const descriptionLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === dateLineIndex) continue; // Skip the released on line if found

      if (line.startsWith("**Title:**")) {
        title = line.replace("**Title:**", "").trim();
      } else if (line.startsWith("**Type:**")) {
        type = line.replace("**Type:**", "").trim();
      } else if (line.startsWith("**Icon:**")) {
        icon = line.replace("**Icon:**", "").trim();
      } else {
        descriptionLines.push(line);
      }
    }

    entries.push({
      bgColor,
      color,
      date,
      description: descriptionLines.join("\n").trim(),
      icon,
      project: projectName,
      title,
      type,
      version,
    });
  }

  return entries;
}
