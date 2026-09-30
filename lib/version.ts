// Source unique de vérité de la version applicative : `package.json`.
//
// La valeur n'est jamais recopiée dans le code. Une constante littérale
// (« 0.5.5 ») a déjà fait diverger l'affichage du menu utilisateur du tag réel
// sur plusieurs versions : le correctif consiste à supprimer la possibilité
// de dériver, pas à réécrire le nombre. `tests/unit/app-version.test.ts` verrouille
// l'égalité avec package.json.
import packageJson from "@/package.json";

export const APP_VERSION: string = packageJson.version;
