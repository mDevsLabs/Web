/**
 * Contrats et normalisation des widgets GitHub du site vitrine.
 *
 * Ces composants affichaient des données publiées : ils appellent aujourd'hui un
 * proxy interne (`/api/site/github/**`) plutôt que `api.github.com` directement.
 * Deux raisons, toutes deux vérifiées dans le dépôt :
 *
 *  1. la CSP (`next.config.ts`, directive `connect-src`) n'autorise pas cette
 *     origine — le fetch navigateur échouait donc SYSTÉMATIQUEMENT, et chaque
 *     composant rendait alors une valeur par défaut comme si c'était une donnée lue ;
 *  2. les trois lectures de `process.env.NEXT_PUBLIC_GITHUB_TOKEN` n'ont aucun
 *     consommateur : la variable n'existe ni dans `.env.example` ni dans le code,
 *     et le dépôt a acté « plus de token GitHub global ». Une variable
 *     `NEXT_PUBLIC_*` est de plus inlinée dans le bundle — un jeton y serait
 *     publié.
 *
 * La règle qui en découle et que ce module rend impossible à rater : une donnée
 * absente est `null`, jamais `0`, jamais une chaîne vide, jamais un statut
 * optimiste. Un nombre zéro est une mesure ; `null` est l'aveu qu'on ne sait pas.
 *
 * Module sans dépendance serveur ni cliente : les types servent aux routes (qui
 * normalisent) et aux composants (qui rendent).
 */

/** Forme d'un dépôt public `organisation/nom`, même contrainte que le connecteur GitHub. */
export const REPO_PUBLIC = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export type GithubSource = "cache" | "github" | "indisponible";

/**
 * Enveloppe de réponse d'un widget. `data === null` signifie « on ne sait pas » :
 * le composant ne rend alors RIEN. `stale` prévient que ce qui s'affiche est un
 * instantané déjà ancien, conservé parce qu'une valeur vieille vaut mieux
 * qu'aucune — mais ne doit jamais passer pour une confirmation en direct.
 */
export type GithubWidget<T> = {
  data: T | null;
  error?: string;
  source: GithubSource;
  stale: boolean;
  updatedAt: string;
};

export type GithubStats = {
  /** Identifiant du tag de la dernière version, `null` si le dépôt n'en publie pas. */
  release: string | null;
  /** Étoiles réellement lues. Une absence se rend `data: null`, pas `0`. */
  stars: number;
};

export type GithubReleases = {
  latest: string | null;
  prerelease: string | null;
};

export type GithubActivityItem = {
  author: string;
  date: string;
  id: string;
  message: string;
  url: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : null;
}

/** Première ligne d'un message de commit : le sujet, pas le corps. */
function sujet(message: unknown): string | null {
  const texte = asString(message);
  if (!texte) {
    return null;
  }
  return texte.split("\n")[0]?.trim() || null;
}

/**
 * `GET /repos/{repo}` et `GET /repos/{repo}/releases/latest`.
 *
 * `null` est rendu quand le corps ne ressemble pas à un dépôt : l'appelant ne doit
 * surtout pas déduire « 0 étoile » d'une réponse illisible (c'était le défaut du
 * composant, qui affichait « 0 Stars » comme un chiffre exact après un échec).
 */
export function normaliserStats(
  brutDepot: unknown,
  brutVersion: unknown
): GithubStats | null {
  if (!isRecord(brutDepot)) {
    return null;
  }
  const stars = asCount(brutDepot.stargazers_count);
  if (stars === null) {
    return null;
  }
  const release = isRecord(brutVersion) ? asString(brutVersion.tag_name) : null;
  return { release, stars };
}

/** Dernière version et, si demandée, première préversion d'un dépôt. */
export function normaliserVersions(
  brutLatest: unknown,
  brutListe: unknown
): GithubReleases {
  const latest = isRecord(brutLatest) ? asString(brutLatest.tag_name) : null;
  let prerelease: string | null = null;
  if (Array.isArray(brutListe)) {
    for (const entree of brutListe) {
      if (isRecord(entree) && entree.prerelease === true) {
        prerelease = asString(entree.tag_name);
        break;
      }
    }
  }
  return { latest, prerelease };
}

function item(
  id: string | null,
  message: string | null,
  author: string | null,
  date: string | null,
  url: string | null
): GithubActivityItem | null {
  if (!id || !message || !url) {
    return null;
  }
  return {
    author: author ?? "Auteur inconnu",
    date: date ?? new Date().toISOString(),
    id,
    message,
    url,
  };
}

/** `GET /repos/{repo}/commits?per_page=5` — cinq sujets, dans l'ordre amont. */
export function normaliserCommits(brut: unknown): GithubActivityItem[] {
  if (!Array.isArray(brut)) {
    return [];
  }
  const items: GithubActivityItem[] = [];
  for (const entree of brut) {
    if (!isRecord(entree)) {
      continue;
    }
    const commit = isRecord(entree.commit) ? entree.commit : {};
    const auteur = isRecord(commit.author) ? commit.author : {};
    const poussee = item(
      asString(entree.sha),
      sujet(commit.message),
      asString(auteur.name),
      asString(auteur.date),
      asString(entree.html_url)
    );
    if (poussee) {
      items.push(poussee);
    }
    if (items.length === 5) {
      break;
    }
  }
  return items;
}

/**
 * `GET /users/{compte}/events/public` — PushEvents seulement.
 *
 * Une préversion (« v1.2.3 — 4 commits ») est la somme de plusieurs commits :
 * l'identifiant est donc celui du push ET de la ligne, et l'URL de commit est
 * reconstruite depuis le dépôt de l'événement.
 */
export function normaliserEvenements(brut: unknown): GithubActivityItem[] {
  if (!Array.isArray(brut)) {
    return [];
  }
  const items: GithubActivityItem[] = [];
  for (const entree of brut) {
    if (!isRecord(entree) || entree.type !== "PushEvent") {
      continue;
    }
    const payload = isRecord(entree.payload) ? entree.payload : {};
    const commits = Array.isArray(payload.commits) ? payload.commits : [];
    const acteur = isRecord(entree.actor) ? entree.actor : {};
    const nomDepot = isRecord(entree.repo) ? asString(entree.repo.name) : null;
    const depot = nomDepot?.split("/")[1];
    for (const poussée of commits) {
      if (!isRecord(poussée)) {
        continue;
      }
      const sha = asString(poussée.sha);
      const ligne = item(
        sha,
        sujet(poussée.message),
        asString(acteur.login) ?? asString(acteur.display_login),
        asString(entree.created_at),
        sha && depot ? `https://github.com/${depot}/commit/${sha}` : null
      );
      if (ligne) {
        items.push(ligne);
      }
      if (items.length === 5) {
        break;
      }
    }
    if (items.length === 5) {
      break;
    }
  }
  return items;
}

/** Enveloppe d'un succès : la valeur vient d'être lue, elle n'est pas ancienne. */
export function reponseGithub<T>(data: T | null): GithubWidget<T> {
  return {
    data,
    source: data === null ? "indisponible" : "github",
    stale: false,
    updatedAt: new Date().toISOString(),
  };
}

/** Enveloppe d'un échec de lecture, sans donnée — le composant ne rendra rien. */
export function indisponible<T>(motif: string): GithubWidget<T> {
  return {
    data: null,
    error: motif,
    source: "indisponible",
    stale: false,
    updatedAt: new Date().toISOString(),
  };
}

/*
 * Validateurs de charge utile. Le client ne fait pas confiance à la forme qu'il
 * reçoit : une réponse HTML d'erreur (page de déploiement, proxy d'entreprise)
 * passe par `response.json()` et lève, et une réponse JSON d'un autre service
 * passerait sans la garde — avec, dans les deux cas, un rendu qui pretendrait
 * avoir lu une mesure.
 */

function estChaineOuNul(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function estStats(value: unknown): value is GithubStats {
  return (
    isRecord(value) &&
    typeof value.stars === "number" &&
    Number.isFinite(value.stars) &&
    estChaineOuNul(value.release)
  );
}

export function estVersions(value: unknown): value is GithubReleases {
  return (
    isRecord(value) &&
    estChaineOuNul(value.latest) &&
    estChaineOuNul(value.prerelease)
  );
}

export function estActivite(value: unknown): value is GithubActivityItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entree) =>
        isRecord(entree) &&
        typeof entree.id === "string" &&
        typeof entree.message === "string" &&
        typeof entree.url === "string" &&
        typeof entree.date === "string" &&
        typeof entree.author === "string"
    )
  );
}
