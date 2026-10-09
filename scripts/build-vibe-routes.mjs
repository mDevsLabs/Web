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
 * cliente — c'est ce qui permet à `next/link` de précharger chaque route.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const RACINE = resolve(import.meta.dirname, "..");
const BASE = resolve(RACINE, "app/(chat)/vibe");

/** Segment d'URL → composant adaptateur. L'ordre SIGNIFIE. */
const ROUTES = [
  { adaptateur: "VibeFeedRoute", chemin: "", titre: "Fil Vibe" },
  { adaptateur: "VibeExploreRoute", chemin: "explore", titre: "Explorer" },
  {
    adaptateur: "VibeExploreRoute",
    chemin: "explore/[tab]",
    titre: "Explorer",
  },
  {
    adaptateur: "VibePostRoute",
    chemin: "post/[postId]",
    titre: "Publication",
  },
  { adaptateur: "VibeProfileRoute", chemin: "u/[username]", titre: "Profil" },
  { adaptateur: "VibeProfileRoute", chemin: "profile", titre: "Profil" },
  {
    adaptateur: "VibeProfileRoute",
    chemin: "profile/[username]",
    titre: "Profil",
  },
  { adaptateur: "VibeMessagesRoute", chemin: "messages", titre: "Messages" },
  {
    adaptateur: "VibeNotificationsRoute",
    chemin: "notifications",
    titre: "Notifications",
  },
  { adaptateur: "VibeMaiRoute", chemin: "mai", titre: "Studio mAI" },
  { adaptateur: "VibeSettingsRoute", chemin: "settings", titre: "Réglages" },
  { adaptateur: "VibeStatsRoute", chemin: "stats", titre: "Statistiques" },
  {
    adaptateur: "VibeBooksJoinRoute",
    chemin: "books/join/[code]",
    titre: "Rejoindre un livre",
  },
  { adaptateur: "VibeBooksRoute", chemin: "books", titre: "Livres" },
  { adaptateur: "VibeBooksRoute", chemin: "books/[bookId]", titre: "Livre" },
];

/**
 * Gabarit d'une page : un import, une fonction. Le texte produit est
 * volontairement celui qu'attend le formateur du dépôt (guillemets doubles,
 * fin de ligne finale) — sinon chaque régénération salirait `pnpm check`.
 */
const MODELE = (adaptateur, titre) => `/**
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

for (const { chemin, adaptateur, titre } of ROUTES) {
  const dossier = resolve(BASE, chemin);
  mkdirSync(dossier, { recursive: true });
  const fichier = resolve(dossier, "page.tsx");
  writeFileSync(fichier, MODELE(adaptateur, titre));
}

console.log(`✓ ${ROUTES.length} routes /vibe générées`);
