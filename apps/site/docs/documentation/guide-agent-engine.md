---
title: "Moteur d'Agents Autonomes & Orchestration"
description: "Fonctionnement du moteur d'agents mAI : boucle de planification récursive, exécution d'outils, sous-agents et mémoire long terme."
category: "Guides"
order: 9
---

# Moteur d'Agents Autonomes & Orchestration

Le **moteur d'agents autonomes mAI** permet d'accomplir des tâches complexes en découpant les objectifs utilisateur en étapes séquentielles, en sélectionnant dynamiquement les outils appropriés et en exploitant une mémoire contextuelle persistante.

---

## 1. Cycle d'Exécution de la Boucle d'Agent

L'agent fonctionne selon un automate fini récursif conçu pour converger de manière déterministe vers la complétion de la tâche :

```
         ┌────────────────────────────────────────────────────────┐
         ▼                                                        │
┌─────────────────┐       ┌─────────────────┐      ┌──────────────┴───────┐
│  1. Observation │ ────> │  2. Réflexion   │ ───> │  3. Appel d'Outils   │
│  & Contexte     │       │  & Planification│      │  (Tool Execution)    │
└─────────────────┘       └─────────────────┘      └──────────────────────┘
                                                           │
                                                           ▼ (Résultat vérifié)
                                                   ┌──────────────────────┐
                                                   │  4. Synthèse Finale  │
                                                   │  & Terminaison       │
                                                   └──────────────────────┘
```

### Détail des Phases
1. **Observation & Assemblage du Contexte** :
   - Lecture de la consigne utilisateur et de l'historique récent de la conversation.
   - Récupération des souvenirs pertinents dans `UserMemory` via recherche sémantique ou vectorielle.
   - Injection du catalogue des outils autorisés pour le forfait du compte.
2. **Réflexion & Décomposition** :
   - Le modèle génère un bloc de pensée structuré (`thinking`) afin d'établir ou d'ajuster son plan d'action immédiat.
   - Identification des paramètres manquants ou des conditions préalables nécessaires.
3. **Appel d'Outils & Sandboxing** :
   - Exécution contrôlée d'actions externes (recherche web, manipulation de fichiers, interrogation de serveurs MCP).
   - Les commandes système s'exécutent dans un environnement clos et sécurisé avec temporisation stricte (`WaitMsBeforeAsync`).
4. **Validation & Récurrence** :
   - Analyse du retour des outils : en cas d'erreur récupérable, l'agent formule une stratégie alternative ; en cas de succès, il passe à l'étape suivante.

---

## 2. Sous-Agents Spécialisés

Pour éviter la saturation de la fenêtre de contexte et garantir une précision maximale sur les tâches expertes, le moteur délègue des sous-problèmes à des **sous-agents dédiés** :

| Sous-Agent | Rôle & Périmètre d'Action |
|---|---|
| `research` | Exploration documentaire et synthèses de code en bac à sable lecture seule. |
| `ai-architect` | Conception et optimisation des flux IA et des graphes d'outils. |
| `performance-optimizer` | Analyse des métriques d'exécution, optimisation des calculs et latence. |
| `firestore-rules-author` | Rédaction rigoureuse et audit formel des règles de sécurité cloud. |

Les sous-agents communiquent avec l'agent orchestrateur principal via des échanges de messages asynchrones (`send_message`), sans bloquer le fil d'exécution utilisateur.

---

## 3. Mémoire Contextuelle & Persistance (`UserMemory`)

Le moteur mAI dispose d'un système de mémoire à long terme lui permettant de personnaliser ses interactions au fil des sessions :

- **Capture des Préférences** : Extraction implicite des consignes récurrentes (style de code préféré, directives de langue, conventions de nommage).
- **Stockage Structuré** : Les faits mémorisés sont enregistrés dans la table `UserMemory` sous PostgreSQL, avec typage précis et horodatage.
- **Réinjection Ciblée** : Seuls les souvenirs ayant une pertinence contextuelle directe avec la requête active sont injectés dans l'invite système, préservant ainsi le quota de jetons de calcul.

---

## 4. Politiques d'Accès & Sécurité par Forfait

L'exécution des agents autonomes est soumise aux règles de plafonnement définies dans `lib/plans/tier-capabilities.ts` :

- **Forfait Free** : Accès limité aux réponses conversationnelles standards et bots prédéfinis ; exécution d'agents multi-étapes restreinte.
- **Forfaits Plus & Pro** : Activation complète du mode agent autonome, accès étendu aux serveurs MCP locaux et distants, mémoire augmentée.
- **Forfait Max** : Plafond d'exécution étendu, priorisation sur les modèles de raisonnement profonds et accès multi-agents concurrentiel illimité.
