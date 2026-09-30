# Notes de version

## 0.9.1 — 30 septembre 2026

### Nouveautés

- **Statistiques détaillées** : historique de consommation de tokens texte et audio, générations d’images, conversations et classement des modèles. Filtres par période, contenu, mode, modèle et projet.
- **Activité du compte** : calendrier sur douze mois, séries de jours consécutifs, pic hebdomadaire, durée des tâches Agent et classement des outils utilisés.
- **Analyse avec l’IA et partage** : préparation d’une demande d’analyse dans le chat et export visuel des statistiques.
- **Recherche globale** : recherche dans les conversations, projets, Bots, Skills et applications depuis une page dédiée.
- **Langues** : réglages de dictée vocale et traduction des messages vers la langue choisie.
- **Bots personnalisables** : éditeur d’instructions, réglage de température, choix d’icône et de couleur.
- **Skills et MCP personnels** : accès direct à la création et à la gestion de ses Skills et de ses configurations de serveurs MCP depuis Applications.
- **Notes de version** : nouvelle page accessible depuis Support, affichant ce fichier Markdown.

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