# Interface Wakies dans mAI

Ce dossier est le port React DOM exécuté sous `/wakies`. Il reprend la navigation
et les interactions conservées dans
[`apps/wakies/`](../../apps/wakies/README.md) ; les pages, tâches, mémoire,
fichiers, recherche et personnalisation sont branchés sur les services de l'hôte.
Le domaine est dans `lib/wakies/`, les routes dans `app/(chat)/api/wakies/`.

## Ce qui est remplacé par l'hôte

| À la référence | Ici |
| --- | --- |
| Serveur Hono propre, `OWNER_TOKEN` | Session mAI, `proxy.ts` protège `/wakies` et `/api/wakies/**` |
| SQLite | Tables PostgreSQL `Wakies*`, chaque ligne porte `userId` |
| CopilotKit Intelligence | `useChat` (AI SDK) sur `/api/wakies/chat`, quota IA du compte |
| `react-markdown` | `markdown.tsx`, qui encapsule Streamdown, le moteur de l'hôte |
| `setInterval` du planificateur | Tick `app/api/cron/wakies` |
| Recherche reconstruite dans le navigateur | Une requête serveur `GET /api/wakies/search`, sources lues en parallèle |

## Styles générés

| Feuille | Source | Script |
| --- | --- | --- |
| `wakies.css` | `apps/wakies/integration/web/style.css` | `node scripts/build-wakies-css.mjs` |
| `wakies-editor.css` | `apps/wakies/integration/web/editor.css` | idem |
| `wakies-ui.css` | `packages/ui/dist/styles.css` | idem |

Les ajouts d'hôte s'écrivent dans **`wakies-host.css`**, ancrés sous
`.wakies-root`. Les primitives `packages/ui` (`@layer mdevs`) passent avant les
anciennes feuilles (`@layer wakies-base`) : les styles du paquet restent
prioritaires sans réinitialisation globale. Le thème suit celui de l'hôte
(`html.dark.wakies-root …`), les zones tactiles font 44 px.

## Messagerie

Trois composants : `Chat` (tour de conversation, réponse citée, transfert,
marquage de lecture), `ChatTranscript` (fil, citations, séparateurs de jour,
actions de bulle) et `ConversationList` (aperçu, heure, non-lus).

- **Les décisions pures du fil ne sont pas dans les composants** : elles vivent
  dans `lib/wakies/shared/transcript.ts` et sont testées. Une citation dont la
  cible n'est pas chargée n'affiche **rien** plutôt qu'un extrait inventé.
- **Les métadonnées voyagent dans `UIMessage.metadata`** (citation, auteur,
  horodatage, `seq`) — jamais dans un second tableau parallèle.
- **La lecture se marque sur un `seq`**, jamais sur une heure : deux messages
  d'une même salve partagent leur `createdAt`. Un compteur de non-lus vient du
  serveur et ne se recalcule pas dans l'interface.
- **SWR relève à cinq secondes**, en suspendant la fusion pendant `submitted` et
  `streaming`, sans jamais jeter une page ancienne ni un brouillon.
- **La cloche du rail a disparu** : les notifications Wakies sont portées par la
  cloche mAI, qui lit la table `Notification` unifiée.
- **La sourdine reste par fil** (champ `muted`) et n'a rien à voir avec le réglage
  de compte `replyAlertsEnabled`, qui décide si un événement est produit.

`MonProfilCard` lit le profil Vibe en **lecture seule** ; `WakieProfileDrawer`
publie la fiche d'un Wakie. Vibe n'est jamais écrit depuis Wakies.

## Frontières

Le groupe de routes est `app/(wakies)/wakies`, avec son propre layout : son rail
est en `position: fixed` et le layout `(chat)` lui superposerait une seconde
navigation. Les cartes d'approbation héritées de la référence **ne valent pas
autorisation serveur** : les outils sensibles restent exclus du chat tant que
leur reprise n'est pas implémentée.

Règles du domaine : [docs/3-wakies/AGENTS.md](../../docs/3-wakies/AGENTS.md),
[INTEGRATION.md](../../docs/3-wakies/INTEGRATION.md),
[AGENTS.md](AGENTS.md) ici.
