/**
 * Wakies garde son layout plein écran pour éviter la superposition avec la navigation du chat mAI.
 * Les trois feuilles générées isolent les règles et animations sous .wakies-root.
 * La feuille des primitives UI retire les polices globales et le thème système sombre.
 * Les contrôles hôte peuvent conserver leur propre portail ; les dialogues Wakies restent dans la racine.
 */

import type { ReactNode } from "react";
import "@/components/wakies/wakies.css";
import "@/components/wakies/wakies-editor.css";
// Adaptations des contrôles hôte, puis primitives UI limitées à Wakies.
import "@/components/wakies/wakies-host.css";
import "@/components/wakies/wakies-ui.css";
import { WakiesThemeProvider } from "@/components/wakies/ThemeProvider";

export default function WakiesLayout({ children }: { children: ReactNode }) {
  // Le fournisseur reste à l’intérieur de la racine qui porte le thème clair.
  return (
    <div className="wakies-root h-dvh w-full overflow-hidden">
      <WakiesThemeProvider>{children}</WakiesThemeProvider>
    </div>
  );
}
