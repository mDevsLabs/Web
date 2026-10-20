/**
 * Route /blackline — le jeu BLACKLINE dans l'hôte mAI.
 *
 * La page est MINCE à dessein : elle lit les réglages du compte et les
 * passe au composant client, qui gère la confirmation d'âge et monte le jeu.
 *
 * AUCUNE LOGIQUE DE JEU ICI : le jeu est un artefact statique, monté par
 * `components/blackline/blackline-host.tsx`. Cette page ne fait que fournir
 * les réglages — la base fait foi, le `localStorage` du jeu reste le repli
 * hors ligne (voir `apps/blackline/src/entry.ts`).
 */

import type { Metadata } from "next";
import { BlacklineHost } from "@/components/blackline/blackline-host";
import { requireUser } from "@/lib/auth/require-user";
import { getBlacklineSettings } from "@/lib/blackline/queries";

export const metadata: Metadata = {
  description:
    "BLACKLINE — FPS tactique 3D en solo contre des bots. Quatre arènes, huit armes, progression locale. Classé PEGI 16.",
  title: "Blackline | mAI",
};

export default async function BlacklinePage() {
  // Les réglages sont lus CÔTÉ SERVEUR : le client ne fait que les refléter.
  // Un échec de lecture ne doit pas empêcher le jeu de s'ouvrir — le jeu
  // tombera alors sur ses réglages locaux.
  //
  // Sans session, il n'y a pas de compte : le jeu part alors sur ses seuls
  // réglages locaux, ce qui reste jouable.
  const session = await requireUser();
  let settings: Record<string, unknown> | null = null;
  if (session) {
    try {
      settings = await getBlacklineSettings(session.userId);
    } catch (error) {
      console.error("GET /blackline : réglages illisibles", error);
    }
  }

  return <BlacklineHost settings={settings} />;
}
