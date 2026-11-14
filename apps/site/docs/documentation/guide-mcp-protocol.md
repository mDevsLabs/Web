---
title: "Protocole MCP (Model Context Protocol) & Intégrations Tierces"
description: "Intégration du standard Model Context Protocol dans mAI : serveurs MCP, OAuth Google/GitHub et chiffrement des secrets."
category: "Guides"
order: 16
---

# Protocole MCP (Model Context Protocol) & Intégrations Tierces

Le **Model Context Protocol (MCP)** est un standard ouvert permettant d'exposer de manière normalisée et sécurisée des contextes, des outils et des ressources externes aux modèles d'intelligence artificielle.

La plateforme mAI intègre nativement le protocole MCP comme fondation de son système d'outils et de connecteurs.

---

## 1. Architecture Client-Serveur MCP dans mAI

Au sein de l'architecture mAI, le runtime agit comme un **Client MCP** capable de communiquer avec une multiplicité de **Serveurs MCP** :

```
┌────────────────────────────────────────────────────────┐
│                      Client mAI                        │
│                                                        │
│  Orchestrateur d'Outils  ·  Registre  ·  Coffre Fort   │
└──────────────┬──────────────────────────┬──────────────┘
               │ Protocole JSON-RPC       │
       ┌───────┴──────┐           ┌───────┴──────┐
       ▼              ▼           ▼              ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│ Serveur MCP ││ Serveur MCP ││ Serveur MCP ││ Serveur MCP │
│ Google Docs ││   GitHub    ││ Base Données││ Outils Perso│
└─────────────┘└─────────────┘└─────────────┘└─────────────┘
```

### Capacités Normalisées
- **Tools (Outils)** : Fonctions exécutables dotées d'un schéma d'arguments JSON Schema vérifiable.
- **Resources (Ressources)** : Données structurées ou documents accessibles via des URIs normalisées.
- **Prompts (Modèles d'invites)** : Séquences d'instructions pré-packagées optimisées pour des scénarios métier spécifiques.

---

## 2. Le Coffre-Fort de Secrets & Chiffrement

La sécurité des données d'authentification tierces constitue une priorité absolue de la plateforme :

### La Clé Maîtresse `MCP_ENCRYPTION_KEY`
L'ensemble des jetons d'accès OAuth, des clés secrètes d'API et des paramètres de connexion aux serveurs MCP privés est chiffré au repos :
- **Algorithme** : Chiffrement symétrique fort AES-256-GCM géré par `lib/mcp/encryption.ts`.
- **Exigence Bloquante** : Aucun repli n'est toléré si la variable `MCP_ENCRYPTION_KEY` est absente de l'environnement de production. Les routes d'intégration refusent d'écrire ou de lire un secret non protégé par une clé cryptographique valide.
- **Rotation de Clé** : Lors de la modification de la clé de chiffrement, les jetons existants deviennent délibérément illisibles afin d'empêcher toute fuite de données compromise, nécessitant une ré-autorisation explicite par l'utilisateur.

---

## 3. Connecteurs OAuth 2.0 Intégrés

mAI fournit des intégrations officielles gérant le cycle de vie complet des autorisations OAuth :

| Service | Portée & Droits Accordés | Usages de l'Agent mAI |
|---|---|---|
| **Google Workspace** | Lecture et écriture de documents (Docs), feuilles de calcul (Sheets), agendas (Calendar) | Rédaction assistée, synthèses de réunions, planification de calendrier |
| **GitHub** | Accès aux dépôts, tickets (Issues), revues de code (Pull Requests) | Inspection de code source, création automatisée de commits et de PRs |

### Flux d'Autorisation Sécurisé
1. L'utilisateur déclenche la connexion depuis le panneau des intégrations.
2. Un état OAuth scellé et signé cryptographiquement est généré, intégrant l'identifiant du compte demandeur.
3. Après validation auprès du fournisseur tiers, le jeton de rafraîchissement est scellé dans le coffre-fort et associé à la table `IntegrationConnection`.
4. L'agent ne manipule jamais le jeton brut côté client : les requêtes sont signées et relayées exclusivement côté serveur par le BFF.

---

## 4. Ajout d'un Serveur MCP Personnalisé

Les utilisateurs peuvent déclarer des serveurs MCP sur mesure (locaux via transport standard ou distants via Server-Sent Events / HTTP) :

1. Ouvrez l'onglet **Outils & MCP** dans l'application mAI.
2. Cliquez sur **Ajouter un serveur**.
3. Renseignez l'URL d'écoute ou la commande d'exécution, ainsi que les en-têtes d'autorisation optionnels.
4. Les outils et schémas exposés par le serveur sont immédiatement validés et intégrés au catalogue dynamique de l'agent.
