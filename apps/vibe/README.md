# Vibe — Le réseau social propulsé par mAI 🚀

**Vibe** (2026) est un réseau social moderne développé par **mCompany / mDevsLabs**, avec un assistant IA natif — **mAI** — intégré au cœur de l'expérience : génération d'images, recherche web, tendances, statistiques de compte, et bien plus. Chaque action sensible de l'IA sur votre compte est **approuvée par vous**, sauf si vous activez l'auto-approbation dans les réglages.

![Vibe Intro](public/videos/vibe-intro.mp4)

---

## ✨ Fonctionnalités

### 📱 Réseau social complet
- **Fil d'actualité** en trois onglets : Pour Vous, Abonnements, Tendances
- **Publications** riches : texte, images, hashtags, reposts, signets
- **Commentaires imbriqués** (fils jusqu'à 4 niveaux) avec likes et **synthèse IA des discussions**
- **Profils** : avatar, bannière, bio, abonnés/abonnements, score de réputation
- **Messages privés** (DM), notifications en temps quasi réel, exploration par hashtags

### 🤖 mAI — l'assistant IA intégré
- **mAI Hub** (`MAIStudioPage`) : chat multi-modèles (mAI 1.5 Apex/Light, Gemini, Claude, GPT-4o, DeepSeek…)
- **Commandes slash & mentions** : `/image`, `/search`, `/fact_check`, `/rewrite`, `/translate`, `/publish`, `/follow`, `/trends`, `/stats`, `/quotas`, `/notifications` (alias `@` disponibles)
- **Outils compte (function-style)** exécutés côté serveur avec journalisation complète (`mai_tool_executions`) :
  | Outil | Description | Approbation requise |
  |---|---|---|
  | `get_account_stats` | Statistiques du compte | Non |
  | `create_post` | Publier un post | ✅ Oui |
  | `delete_post` | Supprimer un post | ✅ Oui |
  | `update_profile` | Modifier nom affiché / bio | ✅ Oui |
  | `follow_user` | Suivre / ne plus suivre | ✅ Oui |
  | `search_posts` | Recherche de publications | Non |
  | `search_web` | Recherche web (You.com + fallbacks) | Non |
  | `generate_vibe_image` | Génération d'image IA (désactivée tant qu'aucun fournisseur réel n'est configuré) | Non |
  | `fact_check` / `rewrite_post` / `translate` | Outils textuels (OpenRouter) | Non |
  | `analyze_trends` | Tendances hashtags 7 jours | Non |
  | `check_quotas` | Quotas tokens/images | Non |
  | `get_notifications` | Notifications récentes | Non |

### 🔐 Approbation des outils IA
Par défaut, tout outil **modifiant le compte ou le contenu public** (`create_post`, `delete_post`, `update_profile`, `follow_user`) est mis en attente : mAI renvoie `requiresApproval` et l'utilisateur **approuve ou refuse** depuis le panneau dédié du mAI Hub. Pour fluidifier, un réglage **`mai_auto_approve_tools`** (icône bouclier du mAI Hub, ou Paramètres) permet l'exécution automatique. Toute exécution reste journalisée avec statut et temps de réponse.

### 💰 Tiers & quotas
- Forfaits Free / Plus / Pro / Max avec limites hebdomadaires de tokens mAI et quotidiennes d'images
- Journalisation d'usage (`weekly_usage`, `usage_logs`) et export GDPR des données

### 📲 Expérience mobile
- **Navigation latérale retractable « liquid glass »** (`MobileNav`) avec badges notifications/messages en direct
- Bannière d'introduction vidéo (2026 / mAI) masquable, rejouable, avec contrôle du son
- Zones tactiles respectées, safe-areas iOS, layouts flex adaptés (< 640 px)

---

## 🏗️ Architecture

```
├── main.ts               # Point d'entrée backend (Hono) — déploiement Deno/Val Town
├── vibe.ts               # Orchestrateur des modules Vibe (alias /api/vibe, /vibe, /v1)
├── vibe-posts.ts         # Posts (CRUD), likes, reposts, signets, vues, épinglage, commentaires
├── vibe-feed.ts          # Flux de recommandation (Pour Vous, Abonnements, Tendances), hashtags, recherche
├── vibe-users.ts         # Profils, /v1/me, follows
├── vibe-dms.ts           # Messages privés & notifications
├── vibe-settings.ts      # Paramètres, usage, export GDPR
├── vibe-mai.ts           # Chat mAI, détection d'outils, approbation, quotas
├── vibe-mai-fleet.ts     # Déclarations & exécution des outils (MAIAgentFleet)
├── vibe-recommender.ts   # Recommandations du fil « Pour Vous »
├── web.ts                # Moteur de recherche web (You.com + fallback RSS/Wikipedia)
├── auth.ts               # Inscription/connexion OTP par email, JWT (jose, HS256)
├── config.ts             # Neon Postgres, JWT, blacklist de tokens, tiers/quotas
├── storage.ts            # Upload S3 « Z1 Storage » (avatars, médias, cloud)
├── scripts/migrate.js    # Migrations SQL idempotentes
└── src/                  # Frontend React 18 + TypeScript + Tailwind (Vite)
    ├── App.tsx           # Layout racine, routing par état, modales
    ├── pages/            # Home, Explore, Messages, Notifications, mAI Hub, Profil, Réglages…
    ├── components/       # feed, comments, layout (Sidebar, MobileNav, MAIDrawer…), common
    ├── context/          # AuthContext (session JWT + quotas), ThemeContext
    ├── services/api.ts   # Client API (JWT, fallback de routes, log d'usage)
    └── data/maiTools.ts  # Catalogue des outils exposés à l'autocomplétion
```

### Pile technique
- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS, lucide-react, Vite React Compiler (SWC/Oxc)
- **Backend** : Hono (Deno / Val Town), Neon Postgres serverless, JWT `jose`, OpenRouter (LLM), You.com (recherche)
- **Stockage** : Neon Postgres + S3 « Z1 Storage » pour les médias

---

## 🚀 Démarrage

### Prérequis
- Node.js ≥ 18 (ou Bun) pour le frontend
- Une base **Neon Postgres** (`DATABASE_URL`)
- (Optionnel) `OPENROUTER_API_KEY` pour les réponses LLM, clés You.com pour la recherche web

### Frontend
```bash
npm install
npm run dev        # serveur de dev Vite
npm run build      # tsc -b && vite build
npm run preview    # prévisualisation du build
```

### Backend (Deno / Val Town)
Le backend est déployé sur `https://mai.val.run`. En local :
```bash
deno run --allow-net --allow-env main.ts
```
Puis appliquez les migrations :
```bash
npm run migrate    # DATABASE_URL requise
```

### Variables d'environnement
| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion Neon Postgres |
| `MAI_JWT_SECRET` / `JWT_SECRET` | Signature des tokens de session (obligatoire) |
| `TRUSTED_PROXY_CIDRS` | CIDR des proxys autorisés à fournir l'IP cliente |
| `BOT_PASSWORD_HASH` | Hash bcrypt optionnel du compte @bot de test |
| `OPENROUTER_API_KEY` | LLM mAI (repli : clés par utilisateur) |
| Clés You.com | Recherche web (fallbacks RSS/Wikipedia inclus) |

---

## 🔌 API (extraits)

| Route | Description |
|---|---|
| `POST /v1/mai/chat` | Chat mAI (peut renvoyer `requiresApproval` + `pendingTool`) |
| `POST /v1/logout` | Révocation serveur du JWT et fermeture de session |
| `POST /v1/mai/execute-tool` | Exécution d'un outil approuvé par l'utilisateur |
| `GET /v1/mai/quotas` | Quotas tokens/images |
| `POST /v1/mai/modulate` | Modulation de texte (ton) |
| `GET /v1/feed` | Fil d'actualité (`for_you`, `stream`, `trending`) |
| `GET/POST /v1/settings[/update]` | Paramètres utilisateur (dont `mai_auto_approve_tools`) |
| `GET /v1/notifications` | Notifications |
| `GET /v1/privacy/export` | Export GDPR |

> Chaque route est disponible sous trois alias : `/api/vibe/...`, `/vibe/...`, `/v1/...`.

---

## 🛡️ Sécurité & confidentialité
- Sessions JWT révocables (blacklist SQLite + Postgres, expiration 7 jours, TTL de conservation 14 jours)
- Connexion par **OTP email** (pas de mot de passe en clair)
- `MAI_JWT_SECRET` ou `JWT_SECRET` est obligatoire en production ; aucun secret de repli n'est accepté
- Filtre de sécurité du contenu côté IA (`assessContentSafety`) avant toute publication par agent
- Journal d'exécution des outils IA (`mai_tool_executions`) auditable
- Export GDPR à la demande

---

## 📄 Licence

Projet privé — © 2026 mCompany / mDevsLabs. Tous droits réservés.
