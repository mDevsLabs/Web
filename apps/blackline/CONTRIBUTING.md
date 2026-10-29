# Développer BLACKLINE

Node.js 24, puis `npm ci` et `npm run dev`. Le jeu est un FPS solo procédural avec Three.js.

- Logique et état de partie : `src/game.ts`, `src/ai.ts`, `src/mission.ts`.
- Armes et modèles : `src/render/` ; décors : `src/world.ts`, `src/scenery.ts`.
- Arsenal, dessins et paramètres : `src/ui/` ; HUD et navigation : `src/ui.ts`.
- Progression : `src/progression.ts` ; commandes : `src/keybindings.ts`.
- Backend Vercel : `api/`, `lib/server/`, `lib/db/`.

Avant une pull request : `npm run typecheck`, `npm test`, `npm run build`, `npm run check:bundle`. Les tests du moteur sont exécutés sans GPU ; vérifier aussi WebGL, le clavier et le mobile sur appareil. Les snapshots CPU ne remplacent pas un essai visuel.

Les fichiers `.env.local`, `.vercel/`, `.openai/`, les identifiants et les archives de publication ne doivent pas être copiés dans un nouveau dépôt. L’archive d’export les exclut. Copier `.env.example` pour configurer les secrets uniquement côté serveur.
