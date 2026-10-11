# Notes de version

## 0.9.1 — 11 octobre 2026

Cette version renforce la sécurité et la fiabilité des services, améliore le
suivi des tâches planifiées et harmonise l'expérience dans les espaces de
travail. Elle rétablit également plusieurs accès qui échouaient avec certains
formats d'identifiant, alors que la session était valide.

### Nouveautés

- **Limitation des requêtes coûteuses** : la génération d'image, la synthèse
  vocale, la traduction, le résumé des mémoires, la connexion à un serveur MCP et
  les opérations d'historique en masse sont désormais limitées. La réponse
  indique le temps d'attente restant.
- **Import de mémoires borné** : le nombre d'éléments par import est plafonné,
  ce qui évite qu'une seule requête déclenche des centaines d'écritures.
- **Surveillance de la politique de sécurité** : les violations de la politique
  de sécurité du navigateur sont désormais recueillies pour faciliter son
  durcissement progressif.
- **Fichiers de l'espace de travail** : les listes de compétences, de serveurs
  MCP, d'applications, de projets, de bibliothèque, d'images, de synthèse
  vocale, de tâches planifiées, de robots, d'archivage et de statistiques
  affichent désormais un squelette de chargement pendant leur préparation, au
  lieu d'un écran vide.
- **Tâches Agent planifiées** : elles sont désormais déclenchées
  automatiquement toutes les cinq minutes.

### Corrections

- **Planification et préférences** : les espaces « Planification » et
  « Préférences » fonctionnaient pour tous les comptes sauf ceux dont
  l'identifiant est l'adresse. Ils sont de nouveau accessibles, comme le reste
  de l'application.
- **Accès aux projets** : l'identification de la session est désormais
  cohérente entre les espaces de projets et les autres pages protégées, y
  compris pour les comptes dont l'identifiant n'est pas un e-mail.
- **Tâches planifiées et quota atteint** : une tâche planifiée dont le quota
  hebdomadaire était épuisé était marquée en échec, ce qui arrêtait définitivement
  une récurrence. Elle est désormais reportée et repart automatiquement. Les
  exécutions manuelles sont également soumises au quota et à la limite de
  requêtes.
- **Reconnexion après incident de base de données** : le service externe
  d'API renvoyait une erreur d'authentification quand sa base était
  momentanément injoignable, au lieu d'indiquer un incident temporaire. Aucun
  accès n'est désormais accordé sur une panne d'infrastructure, et les messages
  distinguent un identifiant invalide d'un service indisponible.
- **Relevé de consommation** : le point d'entrée d'enregistrement des échanges
  avec le service de statistiques acceptait des valeurs invalides et pouvait
  écrire une consommation négative dans le relevé. Les valeurs sont maintenant
  vérifiées avant tout accès à la base.
- **Facturation des réponses qui raisonnent** : le nombre de tokens était
  compté deux fois pour les modèles qui raisonnent.
- **Exécution d'une conversation planifiée** : elle était le seul chemin de
  dépense sans limite de requêtes.
- **Connexion à un serveur MCP** : la route de test acceptait des configurations
  que la route de création refuse, et ne vérifiait pas le protocole de
  connexion.
- **Envois vocaux** : la vitesse de synthèse et la longueur du texte étaient
  transmises sans limite.
- **Profil et historique des images** : la modification du profil n'acceptait
  que les champs attendus, et les identifiants d'images sont validés avant
  d'être transmis.
- **Images** : les avatars et fichiers venus du stockage sont de nouveau
  visibles, et le format le plus léger est proposé aux navigateurs compatibles.
- **Protection contre l'intégration externe** : l'application refuse désormais
  l'intégration dans un cadre tiers, y compris dans les navigateurs anciens.
- **Textes en anglais dans l'interface** : plusieurs libellés et une fenêtre de
  confirmation étaient restés en anglais, y compris sur toutes les pages de
  l'espace de travail. L'interface est désormais entièrement en français.
- **Envoi de fichiers** : la taille des fichiers de la bibliothèque est
  désormais limitée comme pour les autres envois. Le téléversement d'un fichier
  de projet propose une formule supérieure lorsque le stockage est plein, au
  lieu de signaler une erreur interne.
- **Compteurs de la console d'aperçu** : « 1 erreur(s) » est devenu « 1 erreur ».

## 0.9.0 — 30 septembre 2026

### Nouveautés

- **Statistiques détaillées** : historique de consommation de tokens texte et audio, générations d’images, conversations et classement des modèles. Filtres par période, contenu, mode, modèle et projet.
- **Activité du compte** : calendrier sur douze mois, séries de jours consécutifs, pic hebdomadaire, durée des tâches Agent et classement des outils utilisés.
- **Analyse avec l’IA et partage** : préparation d’une demande d’analyse dans le chat et export visuel des statistiques.
- **Recherche globale** : recherche dans les conversations, projets, Bots, Skills et applications depuis une page dédiée.
- **Langues** : réglages de dictée vocale et traduction des messages vers la langue choisie.
- **Bots personnalisables** : éditeur d’instructions, réglage de température, choix d’icône et de couleur.
- **Skills et MCP personnels** : accès direct à la création et à la gestion de ses Skills et de ses configurations de serveurs MCP depuis Applications.
- **Notes de version** : nouvelle page accessible depuis l’assistance, avec l’historique des évolutions.

### Améliorations

- Interface et composants de surface harmonisés, navigation du chat et de l’Agent améliorée, et nouveau symbole vectoriel de robot lisible dans les thèmes clair et sombre.
- Sélection du niveau de réflexion de l’Agent et paramétrage des outils des tâches planifiées clarifiés.
- Brouillon partagé lors de la bascule entre Chat et Agent ; commandes de conversation et export d’historique améliorés.
- Quotas de Bots adaptés aux forfaits : 15 pour Plus, 25 pour Pro, sans plafond pour Max.
- Configuration MCP renforcée : secrets chiffrés, contrôles d’autorisations et validation des transports.
- Appels aux services de plugins mieux bornés et récupération de session améliorée.

### Corrections

- Correction du regroupement SQL du classement des modèles : des paramètres distincts dans le SELECT et le GROUP BY pouvaient empêcher le chargement des statistiques.
- Le bouton « Réessayer » relance directement la requête de statistiques.
- Les indicateurs à zéro ne sont plus affichés comme des résultats lorsque le premier chargement échoue.
- L’outil « Analyser mes statistiques » reste désactivé au chargement. Son activation depuis « Analyser avec l’IA » accompagne uniquement la demande préparée par l’utilisateur.
- Le bouton d’analyse ouvre le mode Chat et reste indisponible tant que les données ne sont pas chargées correctement.
- Les outils sélectionnés ne sont plus affichés en double au-dessus et dans le champ de saisie.
- Le bouton « Avancé » des Skills est remplacé par des accès explicites à la gestion et à la création.
- Les fiches de modèles MCP s’ouvrent dans l’onglet courant avec la navigation de l’application.
- Les notes de version restent accessibles sans connexion et sont incluses dans l’artefact de déploiement.
