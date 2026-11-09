---
title: "Moteur de Recherche en Temps Réel mAI Search"
description: "Architecture du moteur mAI Search : parallélisation raceFirst, multi-sources (You.com, Wikipédia), quotas par forfait et synthèse neutre."
category: "Guides"
order: 17
---

# Moteur de Recherche en Temps Réel mAI Search

**mAI Search** est le système de recherche web et d'enrichissement d'informations en temps réel de la plateforme mAI. Il permet aux modèles de fonder leurs réponses sur des faits vérifiés et d'actualité récente.

---

## 1. Principes & Architecture Multi-Sources

Contrairement aux moteurs de recherche traditionnels basés sur une suite d'étapes séquentielles lentes, mAI Search met en œuvre un modèle distribué et hautement concurrentiel :

```
                               ┌─────────────────────────────────┐
                               │     Requête Utilisateur         │
                               └────────────────┬────────────────┘
                                                │
                               ┌────────────────┴────────────────┐
                               │  Analyseur de Requête (query.ts)│
                               └────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
      │   Clé You.com #1     │       │   Clé You.com #2     │       │  Encyclopédie        │
      │   (Web, Actualités)  │       │   (Parallèle rapide) │       │  Wikipédia           │
      └──────────┬───────────┘       └──────────┬───────────┘       └──────────┬───────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Arbitrage & Déduplication      │
                               │  (Volume borné par le Forfait)  │
                               └────────────────┬────────────────┘
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Synthèse Augmentée & Sources   │
                               └─────────────────────────────────┘
```

### Règles Fondamentales de Performance
- **Course Parallèle (`raceFirst`)** : Les clés API du moteur You.com sont sollicitées simultanément. La première réponse valide reçue remporte la sélection, éliminant les délais d'attente cumulés.
- **Requêtes Conjointes** : Les sources de secours (comme Wikipédia) sont interrogées en même temps que la source principale plutôt qu'après un échec, assurant une latence minimale prévisible.
- **Gestion Stricte des Favicons** : L'affichage des icônes de sites sources utilise le résolveur interne `lib/search/favicon.ts`, conforme aux directives de sécurité CSP (`img-src`).

---

## 2. Plafonnement des Résultats par Forfait

Le volume maximal de résultats renvoyés par source est strictement régulé par le niveau de compte de l'utilisateur :

| Forfait | Résultats Max par Source | Synthèse IA Augmentée |
|---|---|---|
| **Free** | 50 résultats | Standard (8 sources analysées) |
| **Plus** | 100 résultats | Étendue (8 sources prioritaires) |
| **Pro** | 150 résultats | Haute précision factuelle |
| **Max** | 200 résultats | Exhaustive avec analyse approfondie |

### L'Autorité du Serveur
L'utilisateur peut restreindre la portée de sa recherche (par exemple pour n'afficher que des actualités ou filtrer une langue), mais **le serveur tranche toujours** : une requête falsifiée ne peut en aucun cas dépasser le plafond accordé par son forfait. Un niveau de forfait non reconnu ou non authentifié est immédiatement ramené au palier `free`.

---

## 3. Système de Cache en Tranches Volumétriques

Pour assurer une rapidité de service optimale sans biaiser la volumétrie :
- La clé de cache de recherche intègre le niveau de volume demandé (en seaux de 25 résultats).
- Cette conception évite qu'une requête effectuée par un compte gratuit (bornée à 50 résultats) ne serve un cache incomplet à un utilisateur de forfait Max qui en demande 200.

---

## 4. Synthèse Factuelle & Citations

Lorsque l'option de synthèse est sollicitée :
1. Les 8 meilleures sources sont sélectionnées selon un algorithme de pertinence et de diversité des domaines.
2. Le modèle effectue une synthèse neutre, objective et documentée.
3. Chaque affirmation est adossée à une citation cliquable renvoyant directement vers la page source originale.
