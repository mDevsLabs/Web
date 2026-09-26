# Espace Agent (Alpha)

> Document technique de l'espace **Agent** de mAI Web : ce qu'il ajoute au Chat,
> comment il fonctionne, et comment l'étendre sans toucher au reste.

---

## 1. Principe

Chat est conversationnel ; Agent travaille par objectif :

```
Utilisateur → objectif → modèle → tool calls
           → résultats → modèle → vérification → réponse / livrable
```

Le plan de tâches est une **exception**, jamais un acquis : il n'existe que si
l'utilisateur a activé l'option « Tâches » du menu « + ». L'outil `tasks` est
donc marqué `optIn` au catalogue — invisible au sélecteur en mode `auto`, `all`
comme `categories` — et c'est lui, et lui seul, qui rédige le plan, au premier
tour. Le runtime le rappelle à chaque étape tant qu'aucune tâche n'est terminée,
pour qu'un plan soit déroulé et non seulement annoncé.

Techniquement, cette boucle reste **le tool calling standard** des API de type
Chat Completions / Responses. Agent n'introduit ni Computer Use, ni navigateur
contrôlé, ni VM, ni exécution de code sur une machine distante : uniquement
appels LLM, streaming, tools, APIs HTTP, base de données, fichiers, plugins,
MCP et skills.

Le moteur s'appuie sur les primitives déjà installées (`ai@7`) :
`streamText` multi-étapes (`stopWhen`), `prepareStep`, `onStepEnd`, `onChunk`,
`needsApproval` par outil (décisions persistées et liées à l'empreinte des paramètres),
`toUIMessageStream` et les streams resumables Redis (reprise après refresh).

## 2. Chat vs Agent

- Sélecteur **Chat | Agent** sur la page principale (`AgentModeSwitcher`),
  visible par tous, animé, accessible au clavier.
- **Free** : voit Agent, ne peut pas l'utiliser → `AgentUpgradeDialog`
  (« Agent est disponible avec mAI Plus, Pro et Max. » → page de forfaits).
- **Plus / Pro / Max** : Agent disponible.
- La garde réelle est **serveur** : `checkAgentAccess` (flag `agent.enabled`,
  forfait payant, quota) dans `lib/agent/gate.ts`.
- Le **mode Fantôme** n'est pas disponible dans Agent (la persistance des runs
  est nécessaire) : l'API refuse `isGhostMode`.
- Le canal est diffusé par `lib/agent/channel.ts` (`AGENT_CHANNEL = "alpha"`).
  Passer à Beta puis Stable se fait en changeant cette seule constante : badge,
  textes et écrans s'y adaptent.

## 3. Architecture serveur

```
POST /api/agent
  ↓
authentification + rate limit (lib/chat/auth)
  ↓
checkAgentAccess                → flag + forfait + quota
buildChatContext({ mode: "agent" })
  ↓
ModelRegistry (/api/models)     → modèle utilisable + capacités
checkAgentModelAccess           → tool calling obligatoire, forfait
collectAttachments + validation → types / nombre / capacités détaillées du modèle effectif
normalizeAgentReasoningLevel    → valeur validée
resolveAgentExecutionBudget     → maxSteps, maxToolCalls, durée, retries
ToolSelector (hybride)          → outils pertinents (hors outils « opt-in »)
applyToolPermissions            → auto / ask / off (autonomie + surcharges)
createAgentRun / reprise        → unicité conversation/message, réservation d'exécution
loadAgentProjectContext         → contexte projet ciblé
buildAgentContext               → compaction + budget de tokens
createAgentStream               → boucle LLM ↔ tools + événements
```

Le **ModelGateway** est `lib/ai/providers.ts` (un seul point d'entrée), l'entrée
runtime est `lib/agent/runtime.ts`.

## 4. Boucle d'exécution et budgets

```
pour chaque étape (maxSteps) :
  response = model(messages, tools)
  si tool_calls → permissions → exécution → résultats réinjectés
  sinon → réponse finale
```

Garde-fous (`lib/agent/budget.ts`) : `maxSteps`, `maxToolCalls`,
`maxDurationMs`, `maxRetries`. Quand un budget est épuisé, `prepareStep` force
`toolChoice: "none"` pour obtenir une réponse finale plutôt qu'une coupure.

## 5. Outils

Un outil = un petit fichier + un enregistrement. Aucun composant d'interface,
ni le runtime, ni le gateway ne doivent être modifiés pour en ajouter un.

```ts
// lib/agent/tools/internal/mon-outil.ts
export const monOutil = defineTool({
  ...requireAgentToolMetadata("mon_outil"), // libellé, famille, permissions
  schema: z.object({ query: z.string() }),
  execute: async ({ query }, context) => toolSuccess(await chercher(query)),
});
```

Puis : `registerAgentTool(monOutil)` dans `lib/agent/tools/registry.ts` et une
entrée dans `lib/agent/tools/catalog.ts` (métadonnées partagées avec l'UI).

Ce qui est automatique ensuite : JSON Schema envoyé au modèle, validation zod de
l'appel, exécution, persistance (`ToolExecution`), diffusion des événements,
réinjection du résultat, permissions et budget.

Outils internes livrés en Alpha : `search_web`, `read_url`, `read_file`,
`create_artifact`, `export_deliverable`, `attach_to_project`, `ask_user`.
Les outils existants du Chat (plugins, MCP) sont branchés via
`lib/agent/tools/adapters/`.

### Clarification interactive (`ask_user`)

Le questionnaire est un **contrat structuré** (`lib/agent/contracts.ts`) : de 1
à 6 questions typées (choix unique/multiple, texte, curseur, booléen, date),
identifiants stables uniques, au moins une question obligatoire. Le serveur
**refuse** un questionnaire incohérent (doublons, choix sans options, bornes
incohérentes) au lieu de le corriger.

Cycle de vie : l'outil persiste une `AgentUserInputRequest` (liée au ToolCall
exact, empreinte canonique des questions, TTL 24 h) → le run passe à
`waiting_for_user` → la carte (`components/agent/agent-user-input-card.tsx`)
reste posée après refresh → la réponse est validée **côté serveur** contre les
questions persistées (`POST /api/agent/runs/[id]/user-input`, écriture atomique
conditionnée par statut + révision + empreinte : double clic, question expirée,
questionnaire modifié après affichage ou réponse d'un autre utilisateur sont
refusés) → la réponse relue en base est **réinjectée dans le MÊME run**
(`lib/agent/user-input/inject.ts`) au POST suivant, avec une étape timeline
« Réponse reçue ».

### Approbations persistantes

Une écriture soumise à approbation crée une `ApprovalRequest` persistée (params
exactes + hash SHA-256 canonique + TTL 24 h) et une étape timeline
« Approbation requise » ; le run passe à `waiting_for_approval`. La décision
arrive par la reprise : les messages entrants portent la réponse, le serveur la
rattache à la demande persistée du run (`lib/agent/approvals/incoming.ts`) et
n'applique l'accord que si les paramètres présentés n'ont pas changé — toute
modification du ToolCall invalide l'accord. Le contrôleur relit ensuite la base
à chaque appel (`needsApproval` par outil) : fail-closed, aucun fallback, retry
ou MCP ne contourne une permission.

> Note : les tools natifs à carte de confirmation du Chat (`updateAccountProfile`,
> `updateProfilePicture`) ne sont pas exposés au registre Agent : leur contrat
> `awaiting_user` exige une carte interactive rendable dans le fil de messages,
> sans équivalent dans la timeline Agent. Exposition reportée à un lot dédié
> (adaptateur + carte timeline), sans exception dans `AgentRuntime`.

## 6. Sélection et permissions

- `ToolSelector` hybride : règles d'intention (`families.ts`, `rules.ts`) puis
  routage LLM uniquement en cas d'ambiguïté (`llm-router.ts`). L'objectif est de
  ne jamais envoyer 100 outils au modèle.
- Trois modes depuis le composer : `auto`, `all`, `categories`.
- Permissions par outil : `auto`, `ask`, `off`, avec impact déclaré (`read`,
  `local_creation`, `external_mutation`, `deletion`). Une mutation externe ou
  suppression exige toujours un accord ; la création locale suit les réglages.
  Les règles et l'autonomie sont
  évaluées **côté serveur** ; sans flag d'approbations, un outil qui exigerait
  une confirmation est retiré plutôt qu'exécuté silencieusement.

## 7. Persistance

| Table            | Rôle                                                        |
| ---------------- | ----------------------------------------------------------- |
| `AgentRun`       | une requête utilisateur exécutée (modèle, plan, statuts)     |
| `AgentStep`      | actions visibles (tool_call, tool_result, artifact, message, user_input_request, user_input_answer, approval_request) |
| `ToolExecution`  | appels d'outils (entrée, sortie, statut, durée, erreur)       |
| `AgentUserInputRequest` | questionnaire posé par `ask_user` : questions, empreinte, statut, révision, réponse |
| `ApprovalRequest` | accord attendu sur des paramètres exacts (hash, décision, TTL) |
| `AgentSettings`  | modèle, réflexion, autonomie, catégories, permissions        |
| `AgentScheduleVersion` | versions immuables des consignes et réglages planifiés |
| `AgentScheduleOccurrence` | échéance liée à la version exécutée, si attribuable |
| `Chat.mode`      | `chat` ou `agent`                                            |

Statuts de run : `queued`, `running`, `waiting_for_tool`,
`waiting_for_approval`, `waiting_for_user`, `completed`, `failed`, `cancelled`,
`timed_out`.

Migrations : `0016_agent.sql`, `0017_agent_foundation.sql`,
`0018_agent_user_input.sql` et `0022_agent_reliability.sql`. La dernière
réconcilie les anciens doublons actifs sans supprimer leurs étapes ou livrables,
puis ajoute les contraintes d'unicité, le lien parent, la réservation, les
versions et les champs de retour d'expérience.

Rien de sensible n'est journalisé : pas de secrets, pas de clés API, pas de
chaîne de raisonnement.

## 8. Streaming et reprise

Événements diffusés en **data parts natifs** du flux AI SDK (`lib/agent/events.ts`) :

`data-agent-run`, `data-agent-plan`, `data-agent-step`, `data-agent-tool`,
`data-agent-artifact`, `data-agent-sources` (+ `data-waiting-status`).

Ils sont émis en `transient` : **la vérité est en base**, le flux n'est qu'un
confort d'affichage. Après un refresh, `GET /api/agent/runs?chatId=…` restitue
runs, steps et exécutions ; `useAgentChat` reprend automatiquement le flux
resumable Redis (`/api/chat/[id]/stream`).

**Stop** : annule le flux (abort) puis `DELETE /api/agent/runs/[id]` marque le
run `cancelled` en conservant les étapes déjà réalisées.

Une nouvelle consigne pendant un run actif reçoit un conflit explicite. Le
rejeu du même identifiant de message retrouve le run existant sans nouvel effet.
Après `timed_out`, `resumeFromRunId` démarre un nouveau run dans la même
conversation ; le serveur vérifie le parent et transmet un résumé borné des
étapes, sources et livrables. L'ancien run et ses compteurs restent intacts.

Une tâche planifiée en attente passe à l'état d'occurrence `waiting` : aucune
nouvelle échéance n'est réclamée tant que la demande n'est pas résolue. Après
24 heures, l'occurrence échoue et la tâche est mise en pause avec un motif.
Le tick cron est borné à 285 secondes, avec 240 secondes au plus par run ;
l'annulation atteint le runtime, qui conserve son checkpoint.

## 9. Contexte intelligent

`lib/agent/context/build.ts` assemble le contexte : conversation récente,
résumé éventuel, projet ciblé, pièces jointes, instructions (utilisateur, chat,
assistant, skill), plan, autonomie. `compaction.ts` résume les échanges anciens
selon `contextWindow` / budget de tokens, sans jamais modifier l'historique
affiché à l'utilisateur. Le projet n'est jamais envoyé en entier :
`context/project.ts` sélectionne les ressources pertinentes.

## 10. Interface

| Élément                    | Fichier                                         |
| -------------------------- | ----------------------------------------------- |
| Sélecteur Chat \| Agent    | `components/agent/agent-mode-switcher.tsx`      |
| Accueil « Sur quoi travaille-t-on ? » | `components/agent/agent-home.tsx`     |
| Composer adaptatif         | `components/agent/agent-composer.tsx`           |
| Menu « + » extensible      | `lib/agent/ui/composer-actions.ts`              |
| Timeline d'exécution       | `components/agent/agent-run-timeline.tsx`       |
| Badge Alpha                | `components/agent/alpha-badge.tsx`              |
| Dialogue Free → forfaits   | `components/agent/agent-upgrade-dialog.tsx`     |
| Paramètres Agent           | `app/(chat)/settings/agent/page.tsx`            |
| Activité individuelle et versions planifiées | `components/agent/agent-activity-panel.tsx`, `agent-schedule-history-panel.tsx` |

Le composer s'adapte aux capacités du modèle : Réflexion n'apparaît que si
`flags["agent.reasoning"] && capabilities.reasoning`, Fichiers est grisé si le
modèle n'accepte pas de fichiers, Agent est bloqué si `capabilities.tools` est
faux.

## 11. Feature flags

`lib/agent/flags.ts` — valeurs par défaut et surcharge par environnement
(`AGENT_MCP=false`, ou `AGENT_FLAGS='{"agent.mcp":true}'`).

`agent.enabled`, `agent.projects`, `agent.files`, `agent.webSearch`,
`agent.plugins`, `agent.artifacts`, `agent.approvals`, `agent.reasoning`,
`agent.skills`, `agent.mcp`.

Les interfaces `agent.approvalPreview`, `agent.guidedResume`,
`agent.scheduleHistory` et `agent.activity` sont activées progressivement.
Elles sont désactivées par défaut et peuvent être ouvertes par `AGENT_FLAGS`.

## 12. API

| Route                       | Rôle                                        |
| --------------------------- | ------------------------------------------- |
| `POST /api/agent`           | lancer ou reprendre un run                  |
| `GET /api/agent/flags`      | flags + canal + forfait pour l'interface    |
| `GET /api/agent/settings`   | paramètres + modèles + outils disponibles   |
| `PATCH /api/agent/settings` | enregistrer les paramètres                  |
| `GET /api/agent/runs`       | runs, steps, exécutions d'une conversation  |
| `GET /api/agent/runs?view=activity` | agrégats et runs de l'utilisateur courant |
| `GET /api/agent/runs?view=approvalPreview&chatId=…&toolCallId=…` | aperçu serveur lié à l'empreinte des paramètres |
| `PATCH /api/agent/runs/[id]` | avis « utile » et « objectif atteint » séparés |
| `GET /api/agent/schedules/[id]/versions` | versions immuables de la tâche |
| `DELETE /api/agent/runs/[id]` | Stop : marque le run `cancelled`          |

## 13. Points ouverts (non bloquants)

1. **Paramètre de réflexion** : le catalogue déclare la capacité, mais le nom
   exact du paramètre transmis par le proxy amont n'est pas contractualisé dans
   ce dépôt. Le sélecteur reste donc derrière `agent.reasoning`
   (`REASONING_CONTRACT_CONFIRMED = false`) ; l'activer = renseigner
   `REASONING_PARAM_MAPPINGS`, sans toucher au reste.
2. **Contenu des fichiers cloud** : selon l'endpoint disponible côté backend
   mAI, `read_file` lit soit une URL de contenu, soit retombe sur un échec
   structuré que le modèle peut expliquer. L'intervalle de l'outil ne change pas.

## 14. Hors périmètre (Alpha)

Éditeur de workflow visuel, DAG, multi-agents, agent-to-agent, Computer Use,
navigateur autonome, exécution desktop, VM, orchestration distribuée.
