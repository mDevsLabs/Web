---
title: "Plateforme Unifiée mAI & Architecture Full-Stack"
description: "Architecture globale du monodépôt mAI : intégration Next.js 16, Hono, PostgreSQL Neon, Drizzle ORM et isolation CSS."
category: "Architecture"
order: 6
---

# Plateforme Unifiée mAI & Architecture Full-Stack

La plateforme **mAI** constitue un environnement unifié d'intelligence artificielle souveraine, alliant une interface conversationnelle réactive, un moteur d'agents autonomes, une recherche web en temps réel et des modules collaboratifs avancés. 

Cette documentation décrit l'organisation architecturale du monodépôt, le modèle d'exécution à double runtime et la persistance des données.

---

## 1. Vue d'Ensemble & Principes Fondamentaux

Le projet repose sur la convergence de plusieurs systèmes au sein d'une seule application cohérente :

```
┌─────────────────────────────────────────────────────────────┐
│                    mAI Web (Hôte Next.js 16)                │
│                                                             │
│   app/(chat)/           app/(chat)/site/       /vibe        │
│   Chat, MCP, Agents     Site officiel porté    Réseau IA    │
├─────────────────────────────────────────────────────────────┤
│                    BFF & Routage API                        │
│   Next.js App Router  ·  proxy.ts  ·  Sessions JWT (jose)   │
├─────────────────────────────────────────────────────────────┤
│                 Backend Haute Performance                   │
│   Hono / Val Town (mai.val.run)  ·  Ticks CRON (cron.ts)     │
├─────────────────────────────────────────────────────────────┤
│                    Persistance des Données                  │
│   PostgreSQL (Neon) via Drizzle ORM  ·  SQLite local        │
└─────────────────────────────────────────────────────────────┘
```

### Principes Directeurs
1. **Unification Complète** : Aucune dispersion en projets indépendants ; l'ensemble des fonctionnalités (Chat, Vibe, Wakies, Outils, Vitrine) s'exécute au sein du même écosystème.
2. **Isolation Visuelle Strictement Maîtrisée** : Les sous-systèmes comme le Site officiel sont confinés sous leur propre racine DOM (ex. `.site-root`), évitant toute fuite de règles CSS vers l'hôte achromatique.
3. **SSO Transparent** : La session unique de l'utilisateur (`MAI_SESSION_COOKIE`) est partagée sans rupture entre le chat, le site vitrine et les modules collaboratifs.

---

## 2. Le Modèle à Double Runtime

Le dépôt héberge deux environnements d'exécution complémentaires partageant le même gestionnaire de dépendances :

| Caractéristique | Application Hôte (Next.js) | Backend Haute Disponibilité (Hono) |
|---|---|---|
| **Point d'Entrée** | `app/layout.tsx` | `main.ts` |
| **Framework** | Next.js 16 (App Router, Turbopack, React 19) | Hono (Deno / Val Town) |
| **Rôle** | Interface utilisateur, BFF, rendu hybride (SSR / Client) | Moteur d'API rapide, exécution des fonctions d'arrière-plan |
| **Base de Données** | PostgreSQL Neon via Drizzle ORM | SQLite local et Neon PostgreSQL |
| **Contrôle Typage** | Vérification stricte via `tsconfig.json` | Déployé indépendamment sur Val Town |

Les routes de l'application Next.js (`app/(chat)/api/**/route.ts`) agissent comme un Backend-For-Frontend (BFF). Elles interrogent l'API amont configurée dans `MAI_API_URL` (`https://mai.val.run` par défaut) et normalisent systématiquement les réponses et les exceptions à l'aide de l'utilitaire `lib/api/error-response.ts`.

---

## 3. Persistance & Migrations de Données

Le schéma de données central est déclaré de manière déclarative dans `lib/db/schema.ts` et administré avec **Drizzle ORM**.

### Règles Impératives de Migration
- **Idempotence Obligatoire** : Toutes les instructions SQL générées dans `lib/db/migrations/` emploient des gardes conditionnelles (`IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`).
- **Synchronisation Binaire** : Chaque migration requiert le fichier `.sql` descriptif ainsi que l'entrée horodatée correspondante dans `meta/_journal.json` au sein du même commit.
- **Absence de DDL au Runtime** : Les tables et types ne sont jamais créés dynamiquement lors des requêtes utilisateur en production (`DB_RUNTIME_DDL_REPAIR=false`). Toute évolution du modèle exige une migration formelle exécutée via `pnpm db:migrate`.

---

## 4. Ordonnancement & Tâches d'Arrière-Plan

L'automatisation et la maintenance des données reposent sur un ordonnanceur centralisé unique :

- Le module `cron.ts` situé à la racine du dépôt s'exécute à une cadence régulière (toutes les 5 minutes).
- Il invoque en parallèle, sous l'autorité du secret `CRON_SECRET`, les points de terminaison internes :
  - `app/api/cron/agent` : Poursuite et expiration des boucles d'agents autonomes.
  - `app/api/cron/planning` : Déclenchement des tâches programmées de l'utilisateur.
  - `app/api/cron/notifications` : Réplication idempotente des notifications vers la table centrale de l'hôte.
  - `app/api/cron/vibe` : Purge des stories expirées après 24 heures et maintenance des flux sociaux.

Ce mécanisme garantit un fonctionnement prévisible sans introduire de goulot d'étranglement ni de concurrence non maîtrisée.
