/**
 * Route /wakies — l'application Wakies dans l'hôte.
 *
 * Wakies est réservé aux forfaits payants (Plus, Pro, Max), bloqué pour
 * le forfait Free comme le mode Agent. Les Bots ne font plus partie de ce
 * groupe : ils sont ouverts à tous les forfaits, bornés par quota (8 en Free).
 *
 * La page est marquée « non instantanée » : le composant client lit la session au
 * premier rendu, et `cacheComponents` refuse de pré-rendre une page dont la
 * sortie dépendrait du client. C'est le même arbitrage que `/vibe`.
 * Résolution des capacités : chargement sécurisé des serveurs MCP et extensions.
 */

import { cookies } from "next/headers";
import { deguarderSansPlan } from "@/components/wakies/plan-requis";
import { WakiesWorkspace } from "@/components/wakies/workspace-app";
import { getMaiUser } from "@/lib/auth/session";
import {
  estNavReduite,
  WAKIES_NAV_COOKIE,
} from "@/lib/wakies/client/nav-collapsed";
import { WAKIE_ID_PATTERN } from "@/lib/wakies/shared/sharing";

export const instant = false;

export const metadata = {
  title: "Wakies — Espace de travail IA | mAI",
};

export default async function WakiesPage({
  searchParams,
}: {
  searchParams: Promise<{ fiche?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const user = await getMaiUser();
  const garde = deguarderSansPlan(user);
  if (garde) return garde;
  const { fiche } = await searchParams;

  return (
    <WakiesWorkspace
      fichePartageeId={
        typeof fiche === "string" && WAKIE_ID_PATTERN.test(fiche)
          ? fiche
          : undefined
      }
      initialNavCollapsed={estNavReduite(
        cookieStore.get(WAKIES_NAV_COOKIE)?.value
      )}
    />
  );
}
