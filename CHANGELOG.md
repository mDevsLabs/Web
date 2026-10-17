# Notes de version

## 0.9.1

### Nouveautés

* **Espace de travail Wakies** : environnement personnel intégrant des assistants dédiés (Wakies) configurables, la prise de notes avec arborescence de pages et espaces, une messagerie avec gestion des pièces jointes et des tâches planifiées automatisées.
* **Partage et découverte de Wakies** : publication de profils d’agents sur une page publique dédiée avec code QR, consultation sans session et possibilité de cloner ou d’importer un agent public dans son espace.
* **Application sociale Vibe** : réseau social intégré proposant un flux interactif de publications, des réactions, des cercles, des clubs de lecture et une messagerie privée (DMs et groupes).
* **Stories Vibe** : création et consultation de publications éphémères photo et vidéo visibles 24 heures, avec lecteur dédié, quotas quotidiens adaptés au forfait et contrôle strict des médias.
* **Site officiel mAI** : portail officiel intégré dans l’application avec présentation des modèles d’IA, actualités, benchmarks et connexion transparente par authentification unique (SSO).
* **Intégrations externes OAuth** : connexion sécurisée de comptes tiers (Google et GitHub) avec gestion chiffrée des jetons d’accès pour étendre les outils et actions disponibles pour l’Agent.
* **Formulaires et récompenses** : onglet dédié dans les paramètres pour répondre à des sondages ou signalements de bugs avec attribution de récompenses.
* **mAI Coder et applications natives** : intégration de l’IDE mAI Coder et du client de bureau, avec détection et synchronisation fluide des mises à jour sans interruption du travail actif.

### Améliorations

* Centralisation de la validation et dérivation d’identité utilisateur sur toutes les routes API (`requireUser`).
* Renforcement de la sécurité : rapport des violations CSP, protection anti-clickjacking et limitation de débit sur les routes API coûteuses.
* Ajout de squelettes de chargement sur toutes les pages de l’espace de travail pour fluidifier la navigation sans écran blanc.
* Ordonnancement automatique unifié par tick régulier pour les tâches de l’Agent, du planning, de Wakies et de Vibe.
* Accessibilité ARIA, navigation au clavier et ergonomie mobile perfectionnées sur l’ensemble de l’interface.
* Plafonds d’envoi de fichiers harmonisés et contrôle renforcé de la taille réelle des médias côté serveur.
* Interface entièrement francisée et nettoyage des composants ou dépendances inutilisés.

### Corrections

* Rétablissement de l’accès aux sections Planification et Préférences pour les comptes identifiés par leur courriel.
* Les tâches planifiées bloquées par un quota atteint sont désormais reportées automatiquement au lieu d’être interrompues.
* Meilleure distinction entre incident temporaire d’infrastructure et erreur d’authentification lors des pannes réseau ou de base de données.
* Correction du double comptage des jetons sur les réponses des modèles qui raisonnent.
* Correction de l’erreur SQL sur le filtre de dates empêchant le chargement des formulaires dans les paramètres.
* Correction du dimensionnement et de l’alignement des cases à cocher dans les modales et formulaires.
* Traitement des requêtes asynchrones fiabilisé pour empêcher une réponse tardive d’écraser les résultats récents en recherche, profil ou mémoire.

## 0.9.0

### Nouveautés

* **Statistiques détaillées** : historique de consommation de tokens texte et audio, générations d’images, conversations et classement des modèles. Filtres par période, contenu, mode, modèle et projet.
* **Activité du compte** : calendrier sur douze mois, séries de jours consécutifs, pic hebdomadaire, durée des tâches Agent et classement des outils utilisés.
* **Analyse avec l’IA et partage** : préparation d’une demande d’analyse dans le chat et export visuel des statistiques.
* **Recherche globale** : recherche dans les conversations, projets, Bots, Skills et applications depuis une page dédiée.
* **Langues** : réglages de dictée vocale et traduction des messages vers la langue choisie.
* **Bots personnalisables** : éditeur d’instructions, réglage de température, choix d’icône et de couleur.
* **Skills et MCP personnels** : accès direct à la création et à la gestion de ses Skills et de ses configurations de serveurs MCP depuis Applications.
* **Notes de version** : nouvelle page accessible depuis l’assistance, avec l’historique des évolutions.

### Améliorations

* Interface et composants de surface harmonisés, navigation du chat et de l’Agent améliorée, et nouveau symbole vectoriel de robot lisible dans les thèmes clair et sombre.
* Sélection du niveau de réflexion de l’Agent et paramétrage des outils des tâches planifiées clarifiés.
* Brouillon partagé lors de la bascule entre Chat et Agent ; commandes de conversation et export d’historique améliorés.
* Quotas de Bots adaptés aux forfaits : 15 pour Plus, 25 pour Pro, sans plafond pour Max.
* Configuration MCP renforcée : secrets chiffrés, contrôles d’autorisations et validation des transports.
* Appels aux services de plugins mieux bornés et récupération de session améliorée.

### Corrections

* Correction du regroupement SQL du classement des modèles : des paramètres distincts dans le SELECT et le GROUP BY pouvaient empêcher le chargement des statistiques.
* Le bouton « Réessayer » relance directement la requête de statistiques.
* Les indicateurs à zéro ne sont plus affichés comme des résultats lorsque le premier chargement échoue.
* L’outil « Analyser mes statistiques » reste désactivé au chargement. Son activation depuis « Analyser avec l’IA » accompagne uniquement la demande préparée par l’utilisateur.
* Le bouton d’analyse ouvre le mode Chat et reste indisponible tant que les données ne sont pas chargées correctement.
* Les outils sélectionnés ne sont plus affichés en double au-dessus et dans le champ de saisie.
* Le bouton « Avancé » des Skills est remplacé par des accès explicites à la gestion et à la création.
* Les fiches de modèles MCP s’ouvrent dans l’onglet courant avec la navigation de l’application.
* Les notes de version restent accessibles sans connexion et sont incluses dans l’artefact de déploiement.
