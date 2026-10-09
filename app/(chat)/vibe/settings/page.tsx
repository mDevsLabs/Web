/**
 * Route /vibe — Réglages.
 *
 * Page mince à dessein : la donnée, le thème et la session sont fournis par le
 * layout (app/(chat)/vibe/layout.tsx) et la coquille client (VibeApp). Ce
 * fichier ne fait que nommer la page, ce qui laisse l'App Router précharger la
 * route et gérer l'historique.
 */

import { VibeSettingsRoute } from "@/components/vibe/pages/vibe-routes";

export const instant = false;

export default function Page() {
  return <VibeSettingsRoute />;
}
