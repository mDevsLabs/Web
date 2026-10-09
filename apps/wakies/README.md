# Wakies — sources et intégration mAI

Source officielle : CopilotKit/OpenMuse, branche main, commit 1ac68f3909f2478ab6280883f1ab5ea65eb5719d. La licence MIT et les notices sont conservées. Le clone de préparation est extérieur au dépôt ; aucun .git imbriqué.

## Architecture effective

- apps/mobile : référence Expo de l'interface importée, React 19.1 ; ne remplace pas apps/mobile de mAI (Capacitor).
- apps/server, apps/worker, apps/computer, packages : sources originales, contrats et tests de référence des services optionnels. Aucune de ces applications n'est lancée par le build mAI.
- integration/web : adaptations de styles du port React DOM, compilées par scripts/build-wakies-css.mjs vers components/wakies.
- ../../components/wakies : interface réellement exécutée par /wakies. La navigation, les cartes et le compositeur sont adaptés de l'expérience source ; le transport est l'AI SDK mAI.
- ../../lib/wakies et ../../app/(chat)/api/wakies : domaine multi-utilisateur et adaptateurs PostgreSQL, session, modèles, quotas, outils, fichiers et tâches.

Le paquet de ce dossier délègue dev, build et typecheck à l'hôte. Il n'installe aucune pile Expo, aucun serveur Hono et aucun second React dans Next.js. upstream.package.json et UPSTREAM_README.md documentent l'environnement de référence, pas la procédure de production. Les verrous et configurations du monorepo source sont conservés pour provenance ; le verrou mAI reste à la racine.

## Démarrage

Depuis la racine mAI : pnpm dev. Ouvrir /wakies avec un compte Plus, Pro ou Max. La configuration habituelle mAI et ses migrations PostgreSQL sont nécessaires ; aucune clé Intelligence ni identité OpenMuse n'est utilisée dans le graphe exécuté. Ne pas lancer le serveur source comme backend de mAI : il reste mono-propriétaire et dépend d'Intelligence.

## Limites

Les ordinateurs, le Chromium interactif, Google OAuth autonome, les workers OpenMuse, les démos et les PDF AcroForms ne sont pas activés. Leur code est conservé pour adaptation future. Les exemples source ne sont jamais chargés dans un compte réel. Les médias de démonstration restent des références techniques ; la marque et les mascottes de production sont celles de Wakies.

Voir ../../docs/3-wakies/OPENMUSE_MIGRATION.md pour les décisions, les contrats et les validations.
