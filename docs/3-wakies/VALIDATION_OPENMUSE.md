# Validation de la migration Wakies / OpenMuse

État vérifié le 9 octobre 2026 sur canary. Les commits distants correspondent aux références de préparation : mAI c7a390aedc0424d83fc552d13ea189ab417c7f66 et OpenMuse 1ac68f3909f2478ab6280883f1ab5ea65eb5719d.

## Vérifications effectuées

- Clone officiel avant toute modification ; 226 fichiers importés et contrôlés par SHA-256. Aucun .git imbriqué.
- TypeScript : contrôle réussi après correction des types de portail, du lecteur documentaire et du parcours AST CSS. Le build final inclut une nouvelle vérification TypeScript.
- Tests ciblés : 5 fichiers, 30 tests réussis. Fournisseur MockLanguageModelV4 avec vrai streaming AI SDK, persistance mockée, historique serveur, refus des messages forgés, identité, forfait, quota, modèle, usage à plusieurs étapes, bibliothèque privée et styles isolés.
- Plugins : 16 catalogues valides.
- Navigateur Edge/Playwright : quatre formats 375×812, 430×932, 768×1024 et 1440×900 ; aucune erreur JavaScript ni débordement horizontal sur la passe stable. Historique, navigation, conservation du brouillon et sélection de pièce jointe contrôlés. Captures inspectées. La route temporaire de montage a été supprimée ; protocole dans tests/manual/WAKIES_UI.md.
- Inspection du graphe actif : aucune importation CopilotKit/React Native et aucune variable Intelligence ou identité OpenMuse dans components/wakies, lib/wakies et les routes actives. Les sources originales non exécutées conservent leur configuration pour provenance.

Suite complète : pnpm test:unit --maxWorkers=2 --testTimeout=30000 — 101 fichiers réussis, 1 040 tests réussis et 4 ignorés (1 044 collectés). Le nombre de workers et le délai ont été adaptés à la mémoire de la machine. Style : pnpm check réussi, 1 293 fichiers contrôlés. Build final : pnpm build réussi, compilation Next.js 16.3.8 et TypeScript réussies, 239 pages générées ; /wakies et /api/wakies/files sont incluses. L’environnement de build ne fournit pas CRON_SECRET : le cron Wakies refuse correctement l’exécution, aucun tick réel n’a été validé. L’avertissement sur un lockfile extérieur au dépôt est conservé sans modifier ce fichier utilisateur.

## Ce qui n'a pas été validé

Les migrations ont ensuite été appliquées sur la base désignée par DATABASE_URL de .env, sur instruction explicite de l’utilisateur (voir le contrôle ci-dessous). Aucun parcours de compte réel n’a été utilisé, aucun fournisseur externe n’a été appelé pour une conversation et aucun blob réel n’a été téléversé ou supprimé pendant les tests. Les tests de routes utilisent des mocks et ne constituent pas une vérification du SQL sur deux comptes réels. Le navigateur utilise les vrais composants et des API interceptées. Les essais n'ont pas été exécutés dans Capacitor, Electron, un simulateur iOS/Android ou sur appareil physique. Le clavier natif, les téléchargements natifs et les push restent à tester.

La migration 0043_wakies_chat_turns.sql, son journal et la garde du schéma sont livrés. Ils ont été appliqués par le runner mAI sur la cible .env ; les autres environnements doivent également passer par ce runner avant utilisation du nouveau chat. Les seize tables historiques sont conservées sans migration destructive de contenu. La conservation réelle d'un historique existant exige encore un essai sur une copie PostgreSQL représentative.

## Fonctionnalités et limites

Le port DOM conserve les services de session, modèles, quotas, fichiers privés, conversations, personnalisations, mémoires, pages, tâches et capacités mAI. Il ajoute navigation inspirée d'OpenMuse, file temporaire, cartes de parties AI SDK, historique paginé, synchronisation par rafraîchissement et objectifs simples sous forme de pages privées.

Le moteur autonome des objectifs et suggestions, les workers, Chromium interactif, Linux, terminal, voix temps réel, Google OAuth autonome et PDF AcroForms ne sont pas activés. Les sources correspondantes restent disponibles. Les approbations sensibles ne sont pas reprises dans Wakies ; les outils concernés sont écartés et le parcours Agent est indiqué. La recherche filtre les conversations chargées ; l'archivage n'est pas implémenté. Le contexte IA est limité à 199 messages historiques, sans résumé automatique. Les brouillons, pièces préparées et file temporaire ne sont pas synchronisés entre appareils. La comptabilisation d'une génération annulée dépend des données d'usage effectivement rapportées par le fournisseur et nécessite une validation réelle.

## Traçabilité des fichiers

CHANGESET_OPENMUSE.json compare les fichiers aux sauvegardes du travail local avant migration, pas à HEAD, afin de distinguer les adaptations préexistantes. SOURCE_MANIFEST.json, SOURCE_AUDIT.json et PROVENANCE.json documentent l'import. API_CONTRACTS.json extrait les schémas, méthodes, gardes et réponses des 23 fichiers de routes actives. La sauvegarde technique de l'ancien apps/wakies est extérieure au dépôt ; les styles utiles et leur licence sont conservés dans integration. Les nouveaux documents, tests et scripts de vérification complètent cet inventaire. Le lockfile principal et les dépendances React n'ont pas été modifiés par cette migration.

Aucun commit, push, déploiement, service payant ou worker externe n'a été créé.

## Application réelle des migrations — 9 octobre 2026

Sur instruction explicite de l’utilisateur, pnpm db:migrate a été exécuté en imposant DATABASE_URL lu depuis .env au processus enfant. Le chargement de .env.local par le runner ne remplace donc pas cette cible. Aucun secret de connexion n’a été affiché.

Les migrations en attente étaient 0042_wakies_capabilities_onboarding et 0043_wakies_chat_turns ; le runner s’est terminé avec le code 0 en mode strict. Le journal Drizzle atteint le watermark 1787552940000. Les huit colonnes de WakiesChatTurn et ses trois index sont présents. scripts/check-db-schema.mjs a réussi : 33 tables et 42 colonnes critiques vérifiées. Les notices d’objets déjà existants sont normales pour ce runner idempotent ; aucun échec inattendu n’a été remonté.

Comptages avant/après identiques : WakiesConversation 1, WakiesWakie 3, WakiesMessage 0, WakiesPage 0, WakiesTask 0. Ces comptages ne constituent pas encore un test de conversation, de streaming ni d’isolation entre deux comptes sur la base réelle.
