# Notes de version

## 0.9.2

### Nouveautés

* **Recherche mAI** : un moteur de recherche complet, avec recherche web, actualités, images et vidéos, un résumé par l’IA affiché en continu, les sources citées cliquables, une discussion de suivi sur un résultat précis, un vote de qualité et un historique des recherches conservé.
* **Application de bureau** : une fenêtre « À propos de mAI » présente la version, le canal, la plateforme et les versions d’Electron, de Node et de Chromium. Les mises à jour se téléchargent depuis l’application, avec progression, et Coder se lance avec la session mAI déjà connectée.
* **Mises à jour automatiques de Coder** : un panneau complet recherche, télécharge et redémarre l’application. Les préversions sont détectées par commit, et le panneau est neutralisé quand Coder est fourni avec mAI Desktop.
* **Recherche dans le sélecteur de modèle** : un filtre insensible aux accents et à la casse permet de retrouver un modèle dans Coder, avec sélection directe quand un seul correspond.
* **Catalogue de modèles** : le laboratoire concepteur est distingué du fournisseur d’accès, un nouveau fournisseur d’images rejoint le catalogue, les modèles sont typés (chat, audio, image) et l’API permet de filtrer par type.
* **Résolution des conflits de synchronisation** : lorsqu’une mise à jour automatique écrase une surcharge d’administration, un résolveur interactif est proposé en ligne de commande. Sans résolveur, la base l’emporte.
* **Réflexion en direct** : le raisonnement des modèles s’affiche au fil de la réponse dans le Chat, au lieu d’apparaître seulement une fois la réponse terminée.
* **Onglet Applications** : les réglages de Vibe et de Wakies sont regroupés dans les paramètres de mAI, avec un sommaire par section.
* **Modification et copie de message** : dans une conversation Wakies, un message peut être modifié — ses pièces jointes d’origine sont conservées — ou copié.
* **Raisonnement dans Vibe** : la réflexion des modèles est conservée et présentée dans un panneau repliable.
* **Outils portables** : calculatrice, date et heure et lecture d’une page sont disponibles dans Vibe, comme dans le Chat et l’Agent.
* **Compte des tâches planifiées** : les tâches Wakies enregistrent enfin leur consommation réelle de jetons.

### Améliorations

* **Réflexion par répondant** : dans un fil Wakies, chaque assistant expose sa propre réflexion. Le niveau d’effort proposé correspond à ce que le modèle sait réellement faire.
* **Sélecteur de modèle unifié** : Wakies réutilise le sélecteur du Chat et de l’Agent, avec la même recherche et le même sous-menu de réflexion.
* **Modèle par défaut** : quand ni la conversation ni le Wakie n’imposent de modèle, la préférence enregistrée de l’utilisateur s’applique, comme dans les autres espaces.
* **Enregistrement du déploiement** : les applications natives identifient la build Web courante sans mise en cache, et la version de Coder embarquée est vérifiée avant tout lancement.
* **Journalisation de l’usage** : la traduction et les commentaires IA de Vibe sont désormais comptés dans les quotas, au lieu d’être ignorés ou estimés.
* **Modèles audio** : l’accès ne dépend plus du suffixe « gratuit » mais du forfait, et un jeu de repli évite un sélecteur vide.

### Corrections

* **Compte fantôme dans Coder** : une réponse vide de l’API de consommation ne fabrique plus un compte « Free » à zéro jeton. Le profil incomplet est signalé à l’utilisateur.
* **Session expirée** : un jeton invalide efface la session locale et invite à se reconnecter, tandis qu’une panne réseau conserve l’identité déjà connue.
* **Installation de Coder impossible** : le dépôt de releases pointe désormais vers le bon projet, et le paquet portable n’est plus proposé sur Windows.
* **Terminal local** : un module natif manquant affiche un message explicite au lieu d’arrêter l’application, et la détection du CLI ne confond plus l’exécutable de mAI Desktop avec celui du CLI.
* **Boucle de redirection** : la bascule entre la connexion et l’éditeur de Coder ne boucle plus.
* **Palette de réactions des Wakies** : le serveur et l’interface proposent la même liste d’émojis. Quatre réactions acceptées par l’interface étaient refusées par le serveur.
* **Auto-réaction** : un compte ne peut plus réagir à son propre message.
* **Réflexion interrompue** : la collecte du raisonnement est plafonnée sans jamais tronquer son affichage, et les réponses cumulatives ne sont plus dupliquées.
* **Modèles en double** : la liste des modèles ne contient plus de doublons, ni dans l’application Web ni dans Coder, et les surcharges d’administration survivent à la synchronisation.
* **Double adresse d’API** : dans Coder, le fournisseur, le compte et les modèles visent le même hôte.
* **Recherche mAI** : les images distantes qui bloquent l’affichage passent par un proxy sûr, et les hôtes internes sont refusés.
* **Compte des jetons** : le relevé accepte un total de jetons explicite, et les limites de jetons peuvent valoir zéro.
* **Connexion Google et GitHub** : l’erreur « le coffre de secrets n’est pas configuré » est remplacée par un encart explicite qui nomme la variable d’environnement manquante, et le bouton « Connecter » est désactivé tant que l’instance n’est pas prête.
* **Enregistrement des paramètres de Vibe** : les réglages de Vibe, du cercle et du thème s’enregistrent enfin depuis les paramètres de mAI. Les appels Vibe passent par un relais authentifié par la session, au lieu d’être refusés par le serveur faute de jeton.
* **Page Coder** : la section « Pourquoi mAI Coder est une application desktop native ? », le badge « agent-first » et le bloc sur le respect des données ont été retirés de la page.

## 0.9.1

### Nouveautés

* **Espace de travail Wakies** : environnement personnel intégrant des assistants dédiés (Wakies) configurables, la prise de notes avec arborescence de pages et espaces, une messagerie avec gestion des pièces jointes et des tâches planifiées automatisées.
* **Partage et découverte de Wakies** : publication de profils d’agents sur une page publique dédiée avec code QR, consultation sans session et possibilité de cloner ou d’importer un agent public dans son espace.
* **Application sociale Vibe** : réseau social intégré proposant un flux interactif de publications, des réactions, des cercles, des clubs de lecture et une messagerie privée (DMs et groupes).
* **Stories Vibe** : création et consultation de publications éphémères photo et vidéo visibles 24 heures, avec lecteur dédié, quotas quotidiens adaptés au forfait et contrôle strict des médias.
* **Site officiel mAI** : portail officiel intégré dans l’application avec présentation des modèles d’IA, actualités, benchmarks et connexion transparente par authentification unique.
* **Intégrations externes OAuth** : connexion sécurisée de comptes tiers (Google et GitHub) avec gestion chiffrée des jetons d’accès pour étendre les outils et actions disponibles pour l’Agent.
* **Formulaires et récompenses** : onglet dédié dans les paramètres pour répondre à des sondages ou signalements de bugs avec attribution de récompenses.
* **mAI Coder et applications natives** : intégration de l’IDE mAI Coder et du client de bureau, avec détection et synchronisation fluide des mises à jour sans interruption du travail actif.
* **mAI Search** : intégration d'un moteur de recherche mAI pour résumer, avoir des images, vidéos et plus encore, avec l'aide d'mAI !

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
