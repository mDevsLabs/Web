#!/usr/bin/env node
/**
 * ============================================================================
 * GÉNÉRATION DES ROUTES /vibe
 * ============================================================================
 *
 * Quinze routes, et chacune se résume à « rendre un composant adaptateur ». Les
 * écrire à la main produirait quinze fichiers presque identiques, où la seule
 * information utile est le couple (chemin, composant). Cette table la rend
 * explicite, et la génération garantit qu'on n'oublie ni n'invente un segment.
 *
 * `books/join/:code` doit précéder `books/:bookId` dans la déclaration : les
 * deux sont des segments dynamiques au même niveau, et l'ordre de lecture du
 * routeur détermine lequel gagne pour `/vibe/books/join/ABC123`.
 *
 * Chaque page reste un composant serveur minimal : elle ne fait que composer.
 * La logique (session, thème, données) est dans le layout et la coquille
 * cliente. Les pages qui pré-hydratent depuis Postgres (clé `cle`) sont async
 * et NE SE PRÉCHARGENT PAS au survol — le `Link` de
 * `components/vibe/router.tsx` pose `prefetch={false}`, sinon chaque survol
 * exécuterait des lectures en base pour une route peut-être jamais visitée.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const RACINE = resolve(import.meta.dirname, "..");
const BASE = resolve(RACINE, "app/(chat)/vibe");

/** Segment d'URL → composant adaptateur. L'ordre SIGNIFIE.
 * `cle` : clé d'hydratation (`lib/vibe/server/hydration.ts`). Une route sans
 * clé rend le gabarit synchrone — la page ne lit alors aucune donnée serveur
 * (studio mAI : tout reste côté API, cf. docs/2-vibe/INTEGRATION.md). */
const ROUTES = [
  { adaptateur: "VibeFeedRoute", chemin: "", cle: "feed", titre: "Fil Vibe" },
  {
    adaptateur: "VibeExploreRoute",
    chemin: "explore",
    cle: "explore",
    titre: "Explorer",
  },
  {
    adaptateur: "VibeExploreRoute",
    chemin: "explore/[tab]",
    cle: "explore",
    titre: "Explorer",
  },
  {
    adaptateur: "VibePostRoute",
    chemin: "post/[postId]",
    cle: "post",
    titre: "Publication",
  },
  {
    adaptateur: "VibeProfileRoute",
    chemin: "u/[username]",
    cle: "profile",
    titre: "Profil",
  },
  {
    adaptateur: "VibeProfileRoute",
    chemin: "profile",
    cle: "profile",
    titre: "Profil",
  },
  {
    adaptateur: "VibeProfileRoute",
    chemin: "profile/[username]",
    cle: "profile",
    titre: "Profil",
  },
  {
    adaptateur: "VibeMessagesRoute",
    chemin: "messages",
    cle: "messages",
    titre: "Messages",
  },
  {
    adaptateur: "VibeNotificationsRoute",
    chemin: "notifications",
    cle: "notifications",
    titre: "Notifications",
  },
  { adaptateur: "VibeMaiRoute", chemin: "mai", titre: "Studio mAI" },
  {
    adaptateur: "VibeSettingsRoute",
    chemin: "settings",
    cle: "settings",
    titre: "Réglages",
  },
  {
    adaptateur: "VibeStatsRoute",
    chemin: "stats",
    cle: "stats",
    titre: "Statistiques",
  },
  {
    adaptateur: "VibeBooksJoinRoute",
    chemin: "books/join/[code]",
    cle: "join",
    titre: "Rejoindre un livre",
  },
  {
    adaptateur: "VibeBooksRoute",
    chemin: "books",
    cle: "books",
    titre: "Livres",
  },
  {
    adaptateur: "VibeBooksRoute",
    chemin: "books/[bookId]",
    cle: "books",
    titre: "Livre",
  },
];

/**
 * Gabarit d'une page. Deux formes :
 *
 * - Sans clé d'hydratation : un composant serveur synchrone, comme avant — la
 *   page ne lit aucune donnée côté serveur.
 * - Avec clé : une page ASYNC qui appelle `getVibeHydration(cle, props)` et
 *   passe le seed en prop à l'adaptateur. La lecture Postgres s'exécute dans
 *   la requête du document (ou de la navigation), jamais au survol : le
 *   `Link` de `components/vibe/router.tsx` pose `prefetch={false}`. C'est ce
 *   qui remplace l'appel API navigateur pour le premier écran.
 *
 * Le texte produit est volontairement celui qu'attend le formateur du dépôt
 * (guillemets doubles, fin de ligne finale) — sinon chaque régénération
 * salirait `pnpm check`.
 */
const MODELE = (adaptateur, titre, cle) => {
  if (!cle) {
    return `/**
 * Route /vibe — ${titre}.
 *
 * Page mince à dessein : la donnée, le thème et la session sont fournis par le
 * layout (app/(chat)/vibe/layout.tsx) et la coquille client (VibeApp). Ce
 * fichier ne fait que nommer la page, ce qui laisse l'App Router précharger la
 * route et gérer l'historique.
 */

import { ${adaptateur} } from "@/components/vibe/pages/vibe-routes";

export const instant = false;

export default function Page() {
  return <${adaptateur} />;
}
`;
  }
  return `/**
 * Route /vibe — ${titre}.
 *
 * Page mince à dessein : elle appelle le lecteur serveur de sa clé
 * d'hydratation et transmet le seed à l'adaptateur. Le thème et la session
 * viennent du layout ; les rafraîchissements et la pagination restent chez
 * ApiService (cache TTL). « instant = false » : l'identité se lit dans le
 * cookie de session, la page n'est donc jamais pré-rendue.
 */

import { ${adaptateur} } from "@/components/vibe/pages/vibe-routes";
import { getVibeHydration } from "@/lib/vibe/server/hydration";

export const instant = false;

export default async function Page(props: {
  params: Promise<Record<string, string | undefined>>;
  searchParams?: Promise<
    Record<string, string | (string | undefined)[] | undefined>
  >;
}) {
  const hydration = await getVibeHydration("${cle}", props);
  return <${adaptateur} hydration={hydration} />;
}
`;
};

for (const { chemin, adaptateur, cle, titre } of ROUTES) {
  const dossier = resolve(BASE, chemin);
  mkdirSync(dossier, { recursive: true });
  const fichier = resolve(dossier, "page.tsx");
  writeFileSync(fichier, MODELE(adaptateur, titre, cle));
}

console.log(`✓ ${ROUTES.length} routes /vibe générées`);
