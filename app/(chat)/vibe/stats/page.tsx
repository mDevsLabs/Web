/**
 * Route /vibe — Statistiques.
 *
 * Page mince à dessein : elle appelle le lecteur serveur de sa clé
 * d'hydratation et transmet le seed à l'adaptateur. Le thème et la session
 * viennent du layout ; les rafraîchissements et la pagination restent chez
 * ApiService (cache TTL). « instant = false » : l'identité se lit dans le
 * cookie de session, la page n'est donc jamais pré-rendue.
 */

import { VibeStatsRoute } from "@/components/vibe/pages/vibe-routes";
import { getVibeHydration } from "@/lib/vibe/server/hydration";

export const instant = false;

export default async function Page(props: {
  params: Promise<Record<string, string | undefined>>;
  searchParams?: Promise<
    Record<string, string | (string | undefined)[] | undefined>
  >;
}) {
  const hydration = await getVibeHydration("stats", props);
  return <VibeStatsRoute hydration={hydration} />;
}
