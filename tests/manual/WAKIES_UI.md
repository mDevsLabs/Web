# Vérification responsive Wakies

`node tests/manual/wakies-responsive.cjs` utilise Edge installé et Playwright. Toutes les API sont interceptées : aucun fournisseur, compte ou stockage réel n'est testé. Il contrôle quatre tailles, navigation, historique, brouillon, choix d'un fichier, personnalisation et sélection de modèle. Il vérifie également le focus des dialogues, Échap dans le menu imbriqué, les cibles tactiles et le transport `useChat` avec un flux AI SDK et un résultat d'outil contrôlés. Un débordement ou une erreur JavaScript fait échouer le script.

Pour reproduire dans un environnement local isolé, créer temporairement app/login-wakies-preview/page.tsx avec le contenu suivant, lancer `pnpm exec next dev --webpack --port 3100`, puis exécuter le script. Supprimer impérativement cette route après le test et avant le build ; elle ne fait pas partie du produit. Ne pas déployer ce montage.

```tsx
import { notFound } from "next/navigation";
import { WakiesWorkspace } from "@/components/wakies/workspace-app";
import { WakiesThemeProvider } from "@/components/wakies/ThemeProvider";
import "@/components/wakies/wakies.css";
import "@/components/wakies/wakies-editor.css";
import "@/components/wakies/wakies-host.css";
import "@/components/wakies/wakies-ui.css";
export const instant = false;
export default async function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <div className="wakies-root" style={{height:"100dvh",overflow:"hidden"}}><WakiesThemeProvider><WakiesWorkspace /></WakiesThemeProvider></div>;
}
```

Captures et résultats : `docs/3-wakies/verification/ui-after`, ou le répertoire indiqué par `WAKIES_UI_OUTPUT`. Le fichier `responsive.json` est écrit uniquement après la réussite des quatre tailles. Les tests Capacitor/Electron, clavier natif, uploads réels et streaming réel doivent être réalisés séparément avec une session de test.
