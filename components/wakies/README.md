# Interface Wakies dans mAI

Le port React DOM actif reprend la navigation et les interactions OpenMuse conservées dans apps/wakies. Les adaptations mAI de pages, tâches, mémoire, fichiers et personnalisation restent raccordées. Le chat utilise useChat, PostgreSQL et Streamdown ; aucun provider Intelligence, serveur source ou module Expo n'est importé.

WorkspaceNavigation, AppsScreen, GoalsScreen, IdeasScreen, DraftProvider et ToolResultCard complètent workspace-app. Les brouillons et files sont temporaires et isolés par conversation.

La messagerie repose sur trois composants : Chat (tour de conversation, réponse citée, transfert, marquage de lecture), ChatTranscript (fil, citations, séparateurs de jour, actions de bulle) et ConversationList (aperçu, heure, non-lus, participants d'un groupe). Les décisions pures du fil sont dans lib/wakies/shared/transcript.ts, testées par tests/unit/wakies-transcript.test.ts ; les métadonnées d'un message (citation, auteur, horodatage, seq) voyagent dans `UIMessage.metadata`, jamais dans un second tableau parallèle.

MonProfilCard lit le profil Vibe en lecture seule (GET /api/wakies/me/profile) et WakieProfileDrawer publie la fiche d'un Wakie : pseudo, bio, liens, persona et galerie signée, avec le quota d'images servi par le serveur. La vue « Mon profil » de workspace-app est la seule à monter le tiroir.

Les CSS sont générés depuis apps/wakies/integration/web/style.css et editor.css, ainsi que packages/ui/dist/styles.css pour wakies-ui.css. Modifier les sources puis node scripts/build-wakies-css.mjs. Conserver .wakies-root, les portails ancrés et le groupe app/(wakies).

Les boutons, champs et zones de texte du chat, de la navigation, des conversations, de la personnalisation, des fichiers et des objectifs utilisent les primitives `packages/ui`. Les anciennes feuilles sont placées dans `@layer wakies-base`, avant `mdevs` : les styles du paquet restent prioritaires sans réinitialisation globale des contrôles. `wakies-host.css` fournit uniquement des adaptations ancrées sous `.wakies-root`, avec un accent neutre et des zones tactiles de 44 px. Le paquet partagé et les autres applications ne sont pas modifiés.

Les cartes d'approbation héritées ne valent pas autorisation serveur : les outils sensibles restent exclus du chat avant implémentation de leur reprise. Voir docs/3-wakies/INTEGRATION.md.
