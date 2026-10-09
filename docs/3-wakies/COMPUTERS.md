# Ordinateur, navigateur et terminal — services optionnels

Le Wakies intégré ne possède actuellement aucun fournisseur d'ordinateur isolé opérationnel. setup.browser et setup.computers valent false. Les panneaux existants et les sources OpenMuse sont conservés, mais aucun terminal Linux ni navigateur Chromium autonome n'est lancé par Next.js.

La source officielle est dans apps/wakies/apps/computer, apps/worker, packages/backends et packages/integrations. Ces modules restent hors du graphe compilé par l'hôte. Leurs déploiements et identités locales ne doivent pas être utilisés comme authentification mAI.

Une activation future demande un adaptateur serveur avec identité mAI vérifiée, isolation par utilisateur et session, limites de ressources, bail, annulation et permissions au moment de l'exécution. Les captures et fichiers doivent être reliés aux ressources privées du propriétaire. L'exécution d'une commande sur l'hôte Next, la WebView ou Electron n'est pas autorisée par la simple présence de ces interfaces.

Aucun Docker, E2B ou worker payant n'a été déployé. Le guide OpenBot précédent est archivé dans HISTORIQUE_COMPUTERS_OPENDOTS.md. Les sources de référence OpenMuse conservent leurs propres guides ; ils ne constituent pas la procédure de production mAI.
