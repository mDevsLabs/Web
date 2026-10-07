/**
 * Index de recherche global du site.
 *
 * Agrège toutes les sources de contenu (fichiers Markdown/JSON, données
 * modèles, projets, téléchargements, changelogs) en une liste d'entrées
 * consultable par `GET /api/search`.
 *
 * Module serveur : il lit le système de fichiers, ne pas l'importer
 * depuis un composant client (utiliser `import type` pour les types).
 */

import { getChangelogs } from "./changelog";
import { getAllDocs } from "./docs";
import { OFFICIAL_APPS } from "./downloads-data";
import { modelsData } from "./models-data";
import { getNewsArticles } from "./news";
import { activeProjects, publicArchivedProjects } from "./projects-data";
import { normalizeText } from "./text-utils";

// Les types et libellés sont partagés avec le client (lib/search-types.ts).
export type { SearchEntry, SearchType } from "./search-types";
export { SEARCH_TYPE_LABELS, SEARCH_TYPE_ORDER } from "./search-types";

import type { SearchEntry, SearchType } from "./search-types";

const STATIC_PAGES: SearchEntry[] = [
  {
    description: "L'écosystème IA et outils développeur conçu par mDevsLabs.",
    href: "/",
    title: "Accueil",
    type: "page",
  },
  {
    description: "Toutes les annonces et nouveautés de mDevsLabs.",
    href: "/news",
    title: "Actualités",
    type: "page",
  },
  {
    description: "Les modèles d'IA mAI : cloud et exécution locale via Ollama.",
    href: "/models",
    title: "Modèles",
    type: "page",
  },
  {
    description:
      "La suite d'applications mAI : Web, Vibe, Coder, CLI et Pulse.",
    href: "/projects",
    title: "Projets",
    type: "page",
  },
  {
    description:
      "Liens et commandes d'installation des applications et modèles mAI.",
    href: "/downloads",
    title: "Téléchargements",
    type: "page",
  },
  {
    description: "Hub de documentation technique de la suite mAI.",
    href: "/docs",
    title: "Documentation",
    type: "page",
  },
  {
    description: "Historique des versions de mAI et mSearch.",
    href: "/changelog",
    title: "Notes de version",
    type: "page",
  },
  {
    description: "Forfaits Free, Plus, Pro et Max.",
    href: "/pricing",
    title: "Abonnements",
    type: "page",
  },
  {
    description:
      "Centre d'assistance, signalement de bugs et suivi des tickets.",
    href: "/support",
    title: "Support",
    type: "page",
  },
  {
    description: "Créez et gérez vos clés d'accès à l'API mAI.",
    href: "/account/keys",
    title: "Clés API",
    type: "page",
  },
  {
    description: "Forfait, quotas, stockage cloud et appareils connectés.",
    href: "/account",
    title: "Mon compte",
    type: "page",
  },
];

let cachedIndex: SearchEntry[] | null = null;

/** Construit (et mémoïse) l'index complet du site. */
export function getSearchIndex(): SearchEntry[] {
  if (cachedIndex) return cachedIndex;

  const entries: SearchEntry[] = [...STATIC_PAGES];

  // Actualités
  for (const article of getNewsArticles()) {
    entries.push({
      content: article.content,
      description: article.description,
      href: `/news/${article.slug}`,
      meta: article.category ?? article.label,
      title: article.title,
      type: "news",
    });
  }

  // Documentation
  for (const doc of getAllDocs()) {
    entries.push({
      content: doc.content,
      description: doc.description,
      // Le lecteur de documentation est piloté par query param : il n'existe pas
      // de route `/docs/[slug]`, ce chemin renvoyait systématiquement un 404.
      href: `/docs?doc=${encodeURIComponent(doc.slug)}`,
      meta: doc.category,
      title: doc.title,
      type: "doc",
    });
  }

  // Modèles
  for (const model of modelsData) {
    entries.push({
      description: model.tagline,
      href: `/models/${model.id}`,
      meta: model.badge,
      title: model.name,
      type: "model",
    });
  }

  // Projets : uniquement la suite active et les trois archives publiques.
  for (const project of [...activeProjects, ...publicArchivedProjects]) {
    // Les archives sans page publiée n'ont pas de lien : inutile de les indexer
    if (!project.link) continue;
    entries.push({
      description: project.tagline || project.description,
      href: project.link,
      meta: project.platforms.join(" · "),
      title: project.name,
      type: "project",
    });
  }

  // Applications téléchargeables
  for (const app of OFFICIAL_APPS) {
    entries.push({
      description: app.tagline,
      href: "/downloads",
      meta: app.platforms?.map((platform) => platform.label).join(" · "),
      title: app.name,
      type: "download",
    });
  }

  // Notes de version
  try {
    const changelogs = getChangelogs();
    for (const [project, versions] of Object.entries(changelogs)) {
      if (!Array.isArray(versions)) continue;
      for (const version of versions) {
        entries.push({
          description: version.description,
          href: `/changelog/${project.toLowerCase()}`,
          meta: version.date,
          title: `${project} ${version.version} — ${version.title}`,
          type: "changelog",
        });
      }
    }
  } catch {
    // Les changelogs sont optionnels : on ne bloque jamais l'index pour eux.
  }

  cachedIndex = entries;
  return entries;
}

function scoreEntry(entry: SearchEntry, keywords: string[]): number {
  const title = normalizeText(entry.title);
  const description = normalizeText(entry.description);
  const meta = normalizeText(entry.meta || "");
  const content = normalizeText(entry.content || "");

  let score = 0;

  for (const keyword of keywords) {
    if (title.startsWith(keyword)) score += 60;
    else if (title.includes(keyword)) score += 45;

    if (description.includes(keyword)) score += 18;
    if (meta.includes(keyword)) score += 10;
    if (content.includes(keyword)) score += 4;

    // Aucun mot-clé trouvé : entrée hors sujet.
    if (
      !title.includes(keyword) &&
      !description.includes(keyword) &&
      !meta.includes(keyword) &&
      !content.includes(keyword)
    ) {
      return 0;
    }
  }

  return score;
}

export type SearchOptions = {
  type?: SearchType | "all";
  limit?: number;
  /** Inclut le contenu complet dans les résultats (désactivé par défaut). */
  withContent?: boolean;
};

/**
 * Recherche dans l'index global. La requête est normalisée (accents et casse
 * ignorés) et multi-mots : tous les mots-clés doivent correspondre.
 */
export function searchSite(
  query: string,
  options: SearchOptions = {}
): SearchEntry[] {
  const { type = "all", limit = 12, withContent = false } = options;
  const entries = getSearchIndex().filter(
    (entry) => type === "all" || entry.type === type
  );

  const keywords = normalizeText(query.trim()).split(/\s+/).filter(Boolean);

  const results = query.trim()
    ? entries
        .map((entry) => ({ entry, score: scoreEntry(entry, keywords) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ entry, score }) => ({ ...entry, score }))
    : entries.slice(0, limit);

  return results.map((entry) => {
    if (withContent) return entry;
    const { content: _content, ...rest } = entry;
    return rest;
  });
}
