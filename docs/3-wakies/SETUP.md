# Configuration de Wakies intégré

Utiliser la racine mAI, Node.js >=22 et pnpm 10.32.1. Les dépendances et le verrou racine restent ceux de l'hôte. Le package apps/wakies délègue ses commandes à mAI ; upstream.package.json décrit uniquement la source de référence.

1. Installer les dépendances mAI avec pnpm install --frozen-lockfile.
2. Configurer l'environnement habituel de mAI et vérifier la base PostgreSQL cible.
3. Appliquer les migrations par pnpm db:migrate, dont 0043_wakies_chat_turns avant le nouveau chat. Ne pas lancer db:push ni réinitialiser les tables.
4. Démarrer pnpm dev et ouvrir /wakies avec un compte mAI Plus, Pro ou Max.

Aucun OWNER_TOKEN, OPENMUSE_ACCESS_KEY, local-user, projet ou clé CopilotKit Intelligence n'est nécessaire dans le chemin exécuté. Le catalogue et le fournisseur viennent de mAI. Une indisponibilité du fournisseur doit être traitée dans la configuration mAI, pas avec une clé Intelligence.

Les tâches récurrentes utilisent /api/cron/wakies et CRON_SECRET. Sans secret en production, la route cron refuse de s'exécuter. L'absence de worker, ordinateur, navigateur isolé, voix temps réel ou connecteur facultatif ne bloque pas le chat textuel.

Avant livraison : pnpm check, pnpm typecheck, pnpm test:unit, pnpm plugins:check, pnpm build et node scripts/check-wakies-source.mjs. Voir VALIDATION_OPENMUSE.md pour les résultats réellement exécutés. Les guides de configuration de l'ancien serveur sont archivés et ne s'appliquent plus.
