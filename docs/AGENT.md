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
resolveAgentReasoning          → effort recalé sur les niveaux du modèle
resolveAgentExecutionBudget     → maxSteps, maxToolCalls, durée, retries
ToolSelector (hybride)          → outils pertinents (hors outils « opt-in »)
applyToolPermissions            → auto / ask / off (défaut « standard » + surcharges)
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
| `AgentSettings`  | mode d'accueil, modèle, réflexion, catégories, permissions   |
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

Le composer s'adapte aux capacités du modèle. Le sélecteur d'effort, placé à
côté du choix du modèle, n'apparaît que si `flags["agent.reasoning"]` **et**
que le modèle expose des niveaux (`capabilities.reasoningLevels` non vide) — un
modèle qui raisonne sans niveaux contrôlables n'a rien à proposer. Fichiers est
grisé si le modèle n'accepte pas de fichiers, Agent est bloqué si
`capabilities.tools` est faux.

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

1. **Contenu des fichiers cloud** : selon l'endpoint disponible côté backend
   mAI, `read_file` lit soit une URL de contenu, soit retombe sur un échec
   structuré que le modèle peut expliquer. L'intervalle de l'outil ne change pas.

## 14. Réflexion — contrat établi

Le point ouvert n°1 est résolu. Le contrat est le suivant.

**Ce qui est transmis.** Le provider AI SDK valide `reasoningEffort` contre un
enum contenant exactement les sept niveaux de l'API unifiée d'OpenRouter
(`max`, `xhigh`, `high`, `medium`, `low`, `minimal`, `none`) et le sérialise
sous la clé historique `reasoning_effort`. Le proxy (`models.ts`) traduit en
`reasoning: { effort }` au moment du relais, pour ses trois routes de génération.
Aucune table de correspondance n'existe, et aucun kill switch : le contrat est
dans le schéma du provider.

**Ce qui est proposé à l'utilisateur.** Rien n'est écrit à la main. Les niveaux
viennent de `GET /v1/models` → `reasoning.supported_efforts`, exposé par
`lib/ai/registry/capabilities.ts` sous `capabilities.reasoningLevels`. Si
OpenRouter ajoute, retire ou change un niveau, l'interface suit au
rechargement du catalogue. Un modèle qui raisonne sans exposer de niveaux
(`minimax/minimax-m3`, alias mAI-2-Mini) a une liste vide : le sélecteur est
masqué, il n'est jamais alimenté par une liste de repli.

**Une préférence, recalée par modèle.** `AgentSettings.reasoningLevel` est une
valeur unique parmi les sept ; elle n'a pas de sens hors du modèle. Avant
chaque requête, `resolveReasoningEffort` la recale :

1. accepté tel quel → transmis tel quel ;
2. sinon le `default_effort` du fournisseur (sur le catalogue relevé, les 186
   modèles qui exposent des niveaux en exposent tous un, et il appartient
   toujours à leur propre liste) ;
3. sinon le niveau immédiatement inférieur, jamais supérieur — élever le
   niveau gonflerait la facture sans demande ;
4. sinon le niveau le moins cher proposé.

`AgentRun.reasoningLevel` conserve l'intention, et l'événement de run porte
`effectiveReasoningLevel` pour ce qui part réellement. L'interface affiche le
niveau effectif, avec la mention « recalée sur ce modèle » quand il diffère.

`agent.reasoning` est passé à `true` par défaut. Il ne borne plus les niveaux :
un modèle sans niveaux continue de n'en recevoir aucun. Il reste le moyen de
couper la molette sans redéploiement.

**Décompte.** `reasoning_tokens` est un sous-ensemble de `completion_tokens`, et
le contrat de l'AI SDK le confirme : `onFinish` livre `outputTokens` **à plat**,
réponse déjà incluse, et `outputTokenDetails.reasoningTokens` uniquement pour la
décomposition. La réflexion est donc **déjà** dans le total — `resolveBillableTotal`
ne l'ajoute jamais, seulement recomposé quand aucun total amont n'existe. Elle est
conservée à part (`UsageEvent.reasoningTokens`, `AgentRun.usage.reasoningTokens`)
pour expliquer la facture.

**`reasoning_details`** n'est pas lu par le provider, qui n'analyse que
`content`, `tool_calls` et `annotations`. Il est donc capté sur le flux par un
tee dans le `fetch` de `lib/ai/providers.ts`, à la recherche du champ à toute
profondeur (sa position varie selon la route). Collecte plafonnée à 20 blocs et
256 Ko ; la branche de lecture ne peut ni ralentir ni casser le flux principal.

## 15. Hors périmètre (Alpha)

Éditeur de workflow visuel, DAG, multi-agents, agent-to-agent, Computer Use,
navigateur autonome, exécution desktop, VM, orchestration distribuée.
