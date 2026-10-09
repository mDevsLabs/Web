/**
 * ============================================================================
 * /vibe — LAYOUT DE L'INTÉGRATION
 * ============================================================================
 *
 * Ce layout est le point d'entrée de Vibe dans l'hôte. Il fait trois choses,
 * et chacune est un contrat :
 *
 * 1. IL IMPOSE LA FEUILLE DE STYLE VIBE, ET ELLE SEULE.
 *    `components/vibe/vibe.css` est généré par `scripts/build-vibe-css.mjs` :
 *    tous ses sélecteurs sont ancrés sur `.vibe-root`, l'élément posé par
 *    `<VibeApp>`. Vibe remappe la palette Tailwind (`--color-zinc-*`) ; écrit à
 *    `:root` — comme dans l'app Vite — ce remappage repeindrait le chat, le
 *    sidebar et les réglages de mAI. Le scope n'est pas une précaution
 *    esthétique : c'est ce qui rend l'intégration sans effet de bord.
 *
 * 2. IL REMONTE LE JETON DE SESSION DE L'HÔTE.
 *    Le cookie `mai_session_token` est httpOnly : aucun composant client ne peut
 *    le lire. C'est ici, côté serveur, qu'on le récupère pour que Vibe
 *    n'impose pas une seconde connexion. Un `null` (session expirée) laisse
 *    Vibe afficher son propre écran de connexion.
 *
 * 3. IL NE DÉCIDE RIEN DE L'AFFICHAGE.
 *    Aucune logique de données : la page vient de l'App Router, la coquille
 *    client (`VibeApp`) gère thème, toasts et temps réel.
 */

import { VibeApp } from "@/components/vibe/vibe-app";
import { getMaiSessionToken } from "@/lib/auth/session";
import "@mdevs/ui/styles.css";
import "@/components/vibe/vibe.css";

// La lecture de `cookies()` (point 2 ci-dessus) rend la route NON INSTANTE, et
// `cacheComponents` l'exige : l'annoncer vaut mieux que de déporter la lecture
// dans un `<Suspense>`.
//
// Le repli d'un `<Suspense>` serait en effet rendu HORS de `.vibe-root` — donc
// avec les jetons de l'hôte, puis remplacé par la coquille de Vibe et son
// propre thème : un clignotement de palette à chaque entrée dans /vibe, pour un
// gain nul. Le layout `(chat)` parent attend de toute façon le même cookie avant
// d'afficher sa barre latérale, et Vibe n'a rien à prérendre sans son jeton.
// Même arbitrage, et mêmes raisons, que `app/(chat)/recherche/page.tsx`.
export const instant = false;

export default async function VibeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionToken = await getMaiSessionToken();

  return <VibeApp sessionToken={sessionToken}>{children}</VibeApp>;
}
