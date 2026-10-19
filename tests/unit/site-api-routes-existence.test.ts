import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";

/**
 * Chaque chemin annoncé par le registre Site doit correspondre à une vraie route.
 *
 * Régression : `lib/site/api-routes.ts` déclarait trois routes GitHub
 * (`/api/site/github/activity`, `/releases`, `/stats`) qui n'existaient pas. Le
 * test de l'époque (`site-api-routes.test.ts`) comparait des chaînes entre elles,
 * donc il restait vert sur un contrat fantôme — et les composants qui les
 * consommaient échouaient en silence, masqué par leur propre `catch`. Une revue
 * automatique a lu ces lignes et en a déduit un P1 « chemins API cassés » qui,
 * lui, n'existait pas : le vrai défaut était ailleurs (des routes promises sans
 * handler), et rien dans le dépôt ne distinguait les deux.
 *
 * Ce test est la garde manquante : il lit le système de fichiers, pas le registre.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const RACINE_API = ["app/(chat)/api", "app/api"] as const;

type Route = { methods: string[]; path: RegExp };

/** Toutes les `route.ts` de l'app, en motifs de chemin Next → regex. */
function routesExistantes(): Route[] {
  const routes: Route[] = [];
  for (const racineRelatif of RACINE_API) {
    const racine = resolve(ROOT, racineRelatif);
    if (!existsSync(racine)) {
      continue;
    }
    for (const fichier of marcher(racine)) {
      if (!fichier.endsWith(`${sep}route.ts`)) {
        continue;
      }
      const relatif = fichier
        .slice(racine.length)
        .split(sep)
        .filter(Boolean)
        .slice(0, -1);
      // Le préfixe d'URL des deux racines est `/api` : `app/(chat)/api/**` et
      // `app/api/**` sont montés au même endroit, la parenthèse du groupe de
      // route n'apparaît jamais dans l'URL.
      const motif = ["/api", ...relatif.map(segmente)].join("/");
      routes.push({
        methods: methodesDeLecture(fichier),
        path: new RegExp(`^${motif}$`),
      });
    }
  }
  return routes;
}

/** Échappe un littéral de segment pour l'insérer dans une regex. */
function echapper(valeur: string): string {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function segmente(nom: string): string {
  // `[id]` accepte un segment, `[...id]` en accepte plusieurs. L'échappement se
  // fait segment par segment : échapper le motif entier détruirait ces motifs.
  const catchAll = /^\[\.\.\.(.+)\]$/.exec(nom);
  if (catchAll?.[1]) {
    return "[^/]+(?:/[^/]+)*";
  }
  const dynamique = /^\[(.+)\]$/.exec(nom);
  if (dynamique?.[1]) {
    return "[^/]+";
  }
  return echapper(nom);
}

/**
 * Verbes réellement exportés — une route qui existe mais pas au bon verbe est le
 * même 405 que le tick cron Wakies, sous une autre forme.
 */
function methodesDeLecture(fichier: string): string[] {
  const source = readFileSync(fichier, "utf8");
  return ["DELETE", "GET", "PATCH", "POST", "PUT"].filter((verbe) =>
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${verbe}\\s*\\(`).test(
      source
    )
  );
}

function marcher(dossier: string): string[] {
  const sortie: string[] = [];
  // Le dépôt est parcouru pendant que d'autres suites s'exécutent : un dossier
  // absent n'est pas une anomalie du registre.
  if (!existsSync(dossier)) {
    return sortie;
  }
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      sortie.push(...marcher(chemin));
    } else {
      sortie.push(chemin);
    }
  }
  return sortie;
}

/** Lecture tolérante, pour la même raison : la suite tourne en parallèle. */
function lire(fichier: string): string {
  try {
    return readFileSync(fichier, "utf8");
  } catch {
    return "";
  }
}

const ROUTES = routesExistantes();

/**
 * Le registre stocke des chemins concrets pour les entrées à identifiant
 * (`devKey(id)`). Une sentinelle aléatoire est représentative : le segment
 * dynamique accepte n'importe quoi.
 */
const SENTINELLE = "z9-SENTINELLE";

const CHEMINS: { attentes: string[]; nom: string; chemin: string }[] = [
  {
    attentes: ["POST"],
    chemin: SITE_API_ROUTES.apiExecutor,
    nom: "apiExecutor",
  },
  { attentes: ["GET"], chemin: SITE_API_ROUTES.devKeys, nom: "devKeys" },
  { attentes: ["GET"], chemin: SITE_API_ROUTES.devices, nom: "devices" },
  { attentes: ["GET"], chemin: SITE_API_ROUTES.models, nom: "models" },
  {
    attentes: ["GET"],
    chemin: SITE_API_ROUTES.modelsAudio,
    nom: "modelsAudio",
  },
  {
    attentes: ["GET"],
    chemin: SITE_API_ROUTES.modelsImages,
    nom: "modelsImages",
  },
  { attentes: ["GET"], chemin: SITE_API_ROUTES.modelsMai, nom: "modelsMai" },
  { attentes: ["GET"], chemin: SITE_API_ROUTES.status, nom: "status" },
  {
    attentes: ["POST"],
    chemin: SITE_API_ROUTES.supportUpload,
    nom: "supportUpload",
  },
  {
    attentes: ["DELETE", "PUT"],
    chemin: SITE_API_ROUTES.devKey(SENTINELLE),
    nom: "devKey(id)",
  },
  {
    attentes: ["DELETE", "PUT"],
    chemin: SITE_API_ROUTES.device(SENTINELLE),
    nom: "device(id)",
  },
  {
    attentes: ["GET"],
    chemin: SITE_API_ROUTES.githubActivity(SENTINELLE),
    nom: "githubActivity(repo)",
  },
  {
    attentes: ["GET"],
    chemin: SITE_API_ROUTES.githubActivity(),
    nom: "githubActivity()",
  },
  {
    attentes: ["GET"],
    chemin: SITE_API_ROUTES.githubReleases(SENTINELLE, true),
    nom: "githubReleases(repo, pre)",
  },
  {
    attentes: ["GET"],
    chemin: SITE_API_ROUTES.githubStats(SENTINELLE),
    nom: "githubStats(repo)",
  },
];

/**
 * Sources de l'espace Site, lus UNE fois.
 *
 * Le budget de ce contrôle est de l'I/O, pas de la logique : sous la suite
 * complète (126 fichiers, un workers par fichier) il dépassait le défail de cinq
 * secondes dès qu'un `next build` tourne en parallèle. Le périmètre est borné à
 * Site parce que `SITE_API_ROUTES` n'a d'autre usage que d'appeler les routes
 * Site — parcourir tout le dépôt ferait en plus dépendre ce test des fichiers que
 * d'autres suites écrivent pendant la même exécution.
 */
const SOURCES_SITE = ["app/(chat)/site", "components/site", "lib/site"]
  .flatMap((dossier) => marcher(resolve(ROOT, dossier)))
  .filter((fichier) => /\.(ts|tsx)$/.test(fichier))
  .map((fichier) => lire(fichier))
  .join("\n");

describe("Site — le registre ne promet aucune route fantôme", () => {
  it("a des routes à contrôler (garde du test lui-même)", () => {
    expect(ROUTES.length).toBeGreaterThan(20);
  });

  it.each(CHEMINS.map((e) => [e.nom, e.chemin, e.attentes] as const))(
    "%s → %s",
    (_nom, chemin, attentes) => {
      const sansQuery = chemin.split("?")[0] ?? chemin;
      const correspondances = ROUTES.filter((route) =>
        route.path.test(sansQuery)
      );
      expect(
        correspondances.length,
        `aucune route pour ${chemin} — un appelant reçoit 404`
      ).toBeGreaterThan(0);
      const methodes = new Set(correspondances.flatMap((r) => r.methods));
      for (const verbe of attentes) {
        expect(
          methodes.has(verbe),
          `${chemin} n'exporte pas ${verbe} — un appelant reçoit 405`
        ).toBe(true);
      }
    }
  );

  it("n'a aucune clé morte dans le registre", () => {
    // Une clé sans consommateur est un contrat que personne ne teste et que la
    // prochaine revue prendra pour une route.
    const cles = Object.keys(SITE_API_ROUTES);
    expect(cles.length).toBeGreaterThan(10);
    for (const cle of cles) {
      expect(
        SOURCES_SITE.includes(`SITE_API_ROUTES.${cle}`),
        `SITE_API_ROUTES.${cle} n'est consommé par personne`
      ).toBe(true);
    }
  }, 30_000);
});
