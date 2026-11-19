---
title: "Écosystème Unifié : Vibe (Social IA) & Wakies (Collaboration Vocale)"
description: "Intégration transparente de Vibe (réseau social IA) et Wakies (espaces vocaux et spécialistes) au sein de la plateforme unifiée mAI."
category: "Applications"
order: 6
---

# Écosystème Unifié : Vibe & Wakies

Au sein de la plateforme unifiée **mAI**, les expériences sociales et collaboratives ne constituent pas des applications disjointes mais des modules natifs interconnectés avec le cœur de l'intelligence artificielle.

---

## 1. Vibe — Le Réseau Social Augmenté par l'IA

Porté directement sous la route `/vibe` de l'application mAI, **Vibe** réinvente l'espace communautaire en plaçant l'IA générative au service de la création de contenu :

### Fonctionnalités Clés
- **Fil Personnalisé & Interactions** : Partage de publications, commentaires, réactions émotionnelles et fils de discussion thématiques.
- **Stories Éphémères (24h)** :
  - Publication de photos et vidéos courtes avec expiration automatique garantie au bout de 24 heures par le val CRON.
  - Quotas : 1 story quotidienne pour les comptes Free, volume accru pour les forfaits payants.
  - Taille maximale stricte de 50 Mo par média de story, vérifiée côté serveur par requête `HEAD`.
- **Téléversement de Médias Haute Capacité** : Les abonnés payants (Plus, Pro, Max) bénéficient d'un plafond de téléversement allant jusqu'à **1 Go** pour les publications et les vidéos longues.
- **Collections Vibe Books** : Regroupement et mise en page automatisée de vos meilleures réflexions et contenus favoris.

---

## 2. Wakies — Espaces Vocaux & Collaboration Multimodale

Accessible depuis l'environnement mAI, **Wakies** fournit un espace interactif de collaboration vocale et d'assistance spécialisée :

### Capacités Principales
- **Appels Vocaux Temps Réel** : Conversations orales fluides et ultra-faible latence avec l'intelligence artificielle.
- **Mascottes & Spécialistes Métiers** : Choix parmi une sélection d'agents dotés de personnalités, de tonalités vocales et d'expertises sectorielles spécifiques.
- **Espaces Collaboratifs (Spaces)** : Salles de travail partagées réunissant plusieurs participants humains et agents d'IA autour de documents et de tableaux d'objectifs.
- **Interaction avec l'Ordinateur (Agent Desktop)** : Capacité pour l'agent de visualiser et d'interagir avec des environnements informatiques distants pour exécuter des tâches administratives ou de programmation.

---

## 3. Architecture d'Intégration & Données Partagées

L'unification de Vibe et Wakies dans mAI repose sur des contrats techniques stricts :

### Passerelle d'Identité
- L'application hôte mAI identifie les comptes par un identifiant textuel, tandis que les sous-systèmes utilisaient historiquement des identifiants numériques.
- Le pont d'identité unifié repose de manière infaillible sur l'**adresse e-mail normalisée** de l'utilisateur, assurant une synchronisation sans heurt de ses droits et forfaits.

### Cloche de Notifications Centralisée
- L'ensemble des événements générés par Vibe (mentions, abonnements, réactions) et Wakies (invitations, appels en absence) est consolidé dans l'unique table `Notification` de l'hôte mAI.
- L'index partiel `(origin, sourceId)` garantit une réplication strictement idempotente.
- L'action « Marquer comme lu » effectuée depuis le panneau mAI est immédiatement répercutée vers les bases sources respectives.
