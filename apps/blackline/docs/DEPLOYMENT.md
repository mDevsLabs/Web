# Déployer BLACKLINE 1.2.0

## Sites et Vercel

Le jeu est désormais autonome avec sauvegarde locale. `npm ci`, `npm run build`, puis publier `dist/`. Sur Vercel, utiliser le framework Vite, la commande `npm run build` et le dossier de sortie `dist`. Aucun secret ni serveur de comptes n’est nécessaire.

Les routes historiques `/api/auth`, `/api/profile` et `/api/matches` répondent 410, révoquent les cookies du navigateur qui les appelle et ne se connectent plus à Neon. Le frontend ne les appelle plus. Les anciens paramètres `AUTH_ENABLED` et `VITE_CLOUD_SYNC` n’activent aucun service.

## Dépôt GitHub

Importer les sources du ZIP à la racine d’un dépôt. Le workflow `.github/workflows/build.yml` lance TypeScript, tests, compilation et contrôle des chunks sur push/PR. Les builds natifs s’exécutent sur push ou lancement manuel, après validation du web. Les paquets sont récupérables dans les artefacts de la page Actions ; le workflow ne publie pas sur les boutiques.

Le dépôt ne contient aucun identifiant de publication Sites, `.env.local` ou `node_modules`. Les fichiers de compilation doivent être reconstruits avant export ; `BUILD_INFO.txt` conserve le commit de source.

## SQL historique

`lib/db/migrations/001…005` et l’outil `npm run db:migrate` restent disponibles pour préserver le travail et les schémas existants. Aucun DROP ni purge des comptes distants n’est exécuté. `.env.example` ne conserve que les connexions Neon optionnelles pour les migrations. Ne pas activer ces migrations pour jouer : la version 1.2.0 stocke la progression sur l’appareil.

## Sauvegardes

La page Sauvegarde exporte/import les profils JSON. L’import valide le fichier, enregistre les changements et remet à jour carrière, collection et progression d’armes. Les générations locales précédentes sont conservées. Sur mobile natif, l’export utilise le partage système. La sauvegarde de chaque application reste séparée de celle du navigateur : transférer le JSON pour changer d’environnement.

Les builds d’applications et leurs limites sont décrits dans `NATIVE-APPS.md`.
