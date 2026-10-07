# 🏛️ Architecture Technique de Vibe

Ce document détaille l'architecture logicielle de l'application Vibe, tant dans sa version source autonome (`apps/vibe/`) que dans son articulation avec le backend Hono.

---

## 1. 📂 Arborescence de la source Vite (`apps/vibe/`)

```
apps/vibe/src/
├── algorithms/               # Algorithmes client (détection des mentions @, calcul des vues, filtres)
├── components/               # Composants React modulaires
│   ├── books/                # Interface des livres collaboratifs
│   ├── comments/             # Système de commentaires arborescents (CommentItem, CommentForm)
│   ├── feed/                 # Fil de publications, CreatePostModal, PostCard
│   ├── layout/               # Header, BottomNav, Sidebar, TopBar, UserMenu
│   ├── mai/                  # Interface du mAI Hub et commandes conversationnelles
│   ├── messages/             # Messagerie privée DMs et groupes
│   ├── modals/               # Modales de configuration, signalement, partage
│   ├── notifications/        # Centre de notifications temps réel
│   ├── profile/              # Page profil, onglets posts/médias/likes, modale d'édition
│   ├── settings/             # Panneau de réglages (thèmes, animations, vie privée)
│   └── ui/                   # Composants d'interface atomiques
├── context/                  # Contextes React : AuthContext, ThemeContext, AudioPlayerContext
├── pages/                    # 15 pages de vues principales (HomePage, ExplorePage, etc.)
├── services/                 # Clients d'API (api.ts vers /v1/*), PWA, WebSocket/SSE
├── types/                    # Définitions TypeScript (Post, Comment, User, Book, etc.)
├── App.tsx                   # Point d'entrée de l'application React
└── index.css                 # Feuille de style Tailwind v4 source (42 Ko)
```

---

## 2. ⚡ Le Backend Hono Dédié à Vibe

Le backend à la racine du dépôt regroupe 8 fichiers majeurs qui gèrent la logique sociale de Vibe sous les préfixes `/v1/*`, `/vibe/*` et `/api/vibe/*` :

| Fichier Backend | Responsabilité |
|---|---|
| `vibe-feed.ts` | Algorithme d'agrégation des fils *Pour Vous*, *Abonnements*, *Tendances*, pagination et cache. |
| `vibe-posts.ts` | Création, suppression, reposts, signets, likes, sondages et commentaires arborescents. |
| `vibe-users.ts` | Profils, réputation, abonnements/désabonnements, blocage et suggestions d'utilisateurs. |
| `vibe-dms.ts` | Messagerie privée directe et en groupe, messages vocaux, chiffrement et accusés de lecture. |
| `vibe-settings.ts`| Préférences de profil, notifications, options d'affichage et exports de données. |
| `vibe-mai.ts` | Assistant mAI Hub, tool calling avec carte d'approbation et exécution de commandes slash. |
| `vibe-circle.ts` | Cercles d'amis restreints et partage sélectif de publications. |
| `vibe-books.ts` | Création de livres, invitations par code de partage, rédactions collaboratives. |

---

## 3. 🛡️ Système d'Approbation des Outils (Human-in-the-loop)

Lorsque l'utilisateur converse avec mAI dans le Hub Vibe, certains outils entraînent des effets de bord sur le compte social. Le backend applique une vérification stricte :
- **Outils sensibles** : `create_post`, `delete_post`, `update_profile`, `follow_user`.
- **Payload retourné** : Réponse avec le statut `pendingTool` et drapeau `requiresApproval: true`.
- **Comportement UI** : L'interface affiche une carte interactive demandant confirmation à l'utilisateur avant d'exécuter l'action sur le compte, sauf si l'option `mai_auto_approve_tools` est activée dans les réglages.
