/**
 * Route /vibe — Explorer.
 *
 * Page mince à dessein : la donnée, le thème et la session sont fournis par le
 * layout (app/(chat)/vibe/layout.tsx) et la coquille client (VibeApp). Ce
 * fichier ne fait que nommer la page, ce qui laisse l'App Router précharger la
 * route et gérer l'historique.
 */

import { VibeExploreRoute } from "@/components/vibe/pages/vibe-routes";

export default function Page() {
  return <VibeExploreRoute />;
}
