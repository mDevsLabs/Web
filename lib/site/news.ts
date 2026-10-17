import fs from "fs";
import path from "path";
import { formatFileSizeFr } from "@/lib/site/text-utils";

const DEFAULT_IMAGE = "https://upload.fs.fr/6iSzjnfokS.png";

export type NewsVisibility = "featured" | "standard" | "hidden";

/** Document attaché à un article (dossier de presse, PDF de l'annonce). */
export type NewsAttachment = {
  /** Nom proposé au téléchargement (valeur de l'attribut `download`). */
  fileName: string;
  /** Libellé du bouton. */
  label: string;
  /** Mention secondaire : format et poids réels du fichier. */
  detail?: string;
  /** URL publique du fichier, servie par `public/site/news`. */
  url: string;
};

export type NewsArticle = {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  label?: string;
  /** Catégorie de l'article (repli sur `label` si absente). */
  category?: string;
  visibility?: NewsVisibility;
  image?: string;
  /** Force le type de média de couverture (sinon détection par extension). */
  imageType?: "image" | "video";
  /** Document téléchargeable, absent si l'article n'en déclare pas. */
  attachment?: NewsAttachment;
  content: string;
};

const newsDirectory = path.join(process.cwd(), "apps/site/docs/news");
/**
 * Les documents joints sont des assets statiques, pas des fichiers lus par le
 * loader : ils vivent dans `public/site/news/<slug>/` et sont donc servis par
 * le serveur de fichiers. Les deux arbres sont parallèles par construction
 * (`apps/site/docs/news/<slug>/index.json` décrit, `public/site/news/<slug>/`
 * expose), et seul le second est déployé.
 */
const newsAssetsDirectory = path.join(process.cwd(), "public/site/news");

/**
 * Nom de fichier strictement plat : il est concaténé dans une URL publique, donc
 * un séparateur ou un `..` ferait remonter la requête hors de `/site/news`.
 * Interdit aussi le point initial, qui ne servirait qu'à cacher le fichier.
 */
const attachmentFilePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/i;

function isSafeSlug(slug: string): boolean {
  if (!slug) return false;
  if (
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.includes("..") ||
    slug.includes("\0")
  )
    return false;
  const resolved = path.resolve(path.join(newsDirectory, slug));
  return resolved.startsWith(path.resolve(newsDirectory) + path.sep);
}

/** Poids réel du fichier, ou `null` s'il est absent du build (asset non tracé). */
function attachmentSize(slug: string, fileName: string): number | null {
  try {
    const stats = fs.statSync(path.join(newsAssetsDirectory, slug, fileName));
    return stats.isFile() ? stats.size : null;
  } catch {
    return null;
  }
}

/**
 * Lit le bloc `pdf` d'un `index.json`.
 *
 * Une entrée illisible retire le bouton, elle ne fait jamais tomber l'article :
 * les métadonnées sont éditoriales, mais `file` devient une URL publique et un
 * contenu tronqué ou malformé ne doit pas rendre `/news/<slug>` illisible. Le
 * poids affiché est mesuré sur le disque plutôt que recopié dans le JSON, pour
 * qu'un PDF remplacé ne laisse pas un « 388 Ko » faux sous le bouton.
 */
function readAttachment(slug: string, raw: unknown): NewsAttachment | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const { file, label, detail } = raw as Record<string, unknown>;
  if (typeof file !== "string") {
    return null;
  }
  const fileName = file.trim();
  if (!attachmentFilePattern.test(fileName)) {
    return null;
  }

  const mentions: string[] = [];
  if (typeof detail === "string" && detail.trim()) {
    mentions.push(detail.trim());
  }
  const size = formatFileSizeFr(attachmentSize(slug, fileName) ?? 0);
  if (size) {
    mentions.push(size);
  }

  return {
    detail: mentions.length > 0 ? mentions.join(" · ") : undefined,
    fileName,
    label:
      typeof label === "string" && label.trim()
        ? label.trim()
        : "Télécharger le PDF",
    // `slug` a déjà été validé par `isSafeSlug`, `fileName` par le motif ci-dessus.
    url: `/site/news/${encodeURIComponent(slug)}/${fileName}`,
  };
}

function readArticle(slug: string): NewsArticle | null {
  if (!isSafeSlug(slug)) return null;
  const articlePath = path.join(newsDirectory, slug);

  if (!fs.existsSync(articlePath) || !fs.statSync(articlePath).isDirectory()) {
    return null;
  }

  const jsonPath = path.join(articlePath, "index.json");
  const mdPath = path.join(articlePath, "index.md");

  if (!fs.existsSync(jsonPath) || !fs.existsSync(mdPath)) {
    return null;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return {
      attachment: readAttachment(slug, metadata.pdf) ?? undefined,
      author: metadata.author || "Inconnu",
      category: metadata.category || metadata.label,
      content: fs.readFileSync(mdPath, "utf8"),
      date: metadata.date || "Date inconnue",
      description: metadata.description || "",
      image: metadata.image || DEFAULT_IMAGE,
      imageType: metadata.imageType === "video" ? "video" : undefined,
      label: metadata.label,
      slug,
      title: metadata.title || "Sans titre",
      visibility: metadata.visibility,
    };
  } catch (e) {
    console.error(`Failed to parse index.json for article ${slug}`, e);
    return null;
  }
}

/** Tous les articles, y compris les articles masqués (visibility: hidden). */
export function getAllNewsArticles(): NewsArticle[] {
  if (!fs.existsSync(newsDirectory)) {
    return [];
  }

  const articles: NewsArticle[] = [];
  for (const slug of fs.readdirSync(newsDirectory)) {
    const article = readArticle(slug);
    if (article) articles.push(article);
  }

  // Tri par date décroissante (format ISO ou comparaison de chaînes simple).
  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

/** Articles visibles dans les listes (les articles `hidden` sont exclus). */
export function getNewsArticles(): NewsArticle[] {
  return getAllNewsArticles().filter(
    (article) => article.visibility !== "hidden"
  );
}

export function getNewsArticle(slug: string): NewsArticle | null {
  if (!fs.existsSync(newsDirectory)) {
    return null;
  }
  return readArticle(slug);
}

/** Catégories uniques des articles visibles, triées alphabétiquement. */
export function getNewsCategories(): string[] {
  const categories = new Set<string>();
  for (const article of getNewsArticles()) {
    if (article.category) categories.add(article.category);
  }
  return [...categories].sort((a, b) => a.localeCompare(b, "fr"));
}
