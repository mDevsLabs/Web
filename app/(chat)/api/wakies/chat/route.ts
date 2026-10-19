import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
import { fetchUserModels } from "@/lib/ai/models.server";
import { getLanguageModel } from "@/lib/ai/providers";
import { createReasoningDetailsSink } from "@/lib/ai/reasoning-details";
import { createReasoningChunkWriter } from "@/lib/ai/reasoning-stream";
import { getModelCapabilitiesFor } from "@/lib/ai/registry";
import { resolveReasoningEffort } from "@/lib/ai/registry/capabilities";
import {
  REASONING_LEVELS,
  resolveReasoningProviderOptions,
} from "@/lib/ai/registry/reasoning";
import {
  filterModelsForTier,
  isModelAllowedForTier,
} from "@/lib/ai/registry/tiers";
import { MCP_TOOL_SENTINEL } from "@/lib/ai/tools/ids";
import { errorResponse } from "@/lib/api/error-response";
import { isPaidTier } from "@/lib/auth/plan";
import {
  authenticateChatRequest,
  enforceChatRateLimit,
  weeklyQuotaExceeded,
} from "@/lib/chat/auth";
import { loadMcpContext } from "@/lib/chat/mcp";
import { createChatTools } from "@/lib/chat/tools";
import { MAI_API_URL, MAI_UPGRADE_URL } from "@/lib/constants";
import {
  getUserMcpPrefs,
  getUserModelPreferences,
  recordTokenUsage,
} from "@/lib/db/queries";
import { createIntegrationSecretResolver } from "@/lib/integrations/tokens";
import { createMcpChatTools } from "@/lib/mcp/chat-tools";
import { toMcpRuntimePreferences } from "@/lib/mcp/policy";
import { getWakiesQuota } from "@/lib/plans/tier-limits";
import { createPluginTools } from "@/lib/plugins/server";
import {
  lireProfilVibeBref,
  resumeProfilPourPrompt,
} from "@/lib/vibe/server/profil";
import {
  durableUserAttachments,
  resolveMessageAttachments,
} from "@/lib/wakies/attachments";
import {
  applyIntegrationMentions,
  resolveSelection,
} from "@/lib/wakies/capabilities";
import { rejectCrossOriginMutation } from "@/lib/wakies/http";
import {
  appliquerMentionsPersistantes,
  contexteRegleSurLeFil,
  resoudreMentionsCapacites,
} from "@/lib/wakies/mentions";
import { resolveWakieCatalogModel } from "@/lib/wakies/model";
import { createWakiePageTools } from "@/lib/wakies/page-tools";
import { inviteSysteme } from "@/lib/wakies/prompt";
import {
  appendMessages,
  ensureSettings,
  findConversation,
  findWakie,
  finishChatTurn,
  listMemories,
  listMessages,
  messageCite,
  messageExists,
  pageForConversation,
  reserveChatTurn,
  resoudreMentions,
  touchConversation,
  updateConversation,
  type WakieMessageInput,
} from "@/lib/wakies/queries";
import { analyserMentions } from "@/lib/wakies/shared/mentions";
import {
  incomingUserMessage,
  storedMessages,
} from "@/lib/wakies/shared/messages";
import {
  parseMentions,
  parseSlashCommand,
  resolveSlashCommand,
} from "@/lib/wakies/slash";
import {
  createWakieReactionTool,
  WAKIE_REACTION_TOOL_ID,
} from "@/lib/wakies/tools";

/**
 * ============================================================================
 * POST /api/wakies/chat — la réponse d'un Wakie
 * ============================================================================
 *
 * CE QUE REMPLACE CE POINT D'ENTRÉE
 *
 * Dans le gabarit, le chat passait par CopilotKit : le navigateur parlait au
 * runtime `/api/copilotkit`, qui interpollait CopilotKit Intelligence, service
 * externe qui STOCKAIT les messages, portait les threads et exécutait les
 * outils. Trois conséquences incompatibles avec l'hôte : une dépendance
 * distante pour répondre, une base de messages hors de la nôtre, et des
 * quotas qui ne sont pas ceux du compte.
 *
 * Ici, la conversation est un POST comme le chat principal : mêmes modèle,
 * mêmes outils, mêmes quotas, même comptage d'usage. Un message écrit dans un
 * Wakie consomme le quota hebdomadaire du compte, exactement comme dans le
 * chat — pas un quota parallèle qui laisserait croire à du volume infini.
 *
 * CE QUI EST ÉCRIT, ET OÙ
 *
 * Les parts du message (texte, appels d'outils, résultats) sont stockées dans
 * `WakiesMessage` à la fin du tour. L'historique rejoue la forme exacte, donc un
 * ancien message reste lisible même si le rendu change. L'écriture est
 * idempotente sur l'identifiant : un flux rejoué ne duplique rien.
 *
 * LA RECHERCHE WEB
 *
 * Le gabarit scrutait Parallel (MCP) ou un navigateur isolé. L'hôte a déjà un
 * OUTIL de recherche Web (`webSearch`) qui interroge l'API mAI avec repli
 * DuckDuckGo/Searx : il est réutilisé tel quel, et n'est proposé au modèle que
 * si le compte a accordé la recherche (`researchAllowed`).
 *
 * LE MODÈLE EST CELUI QUE L'UTILISATEUR A CHOISI
 *
 * Le gabarit et la première version du port appelaient le modèle par défaut
 * codé en dur : impossible de choisir, et le journal d'usage portait toujours
 * le même identifiant. Le modèle vient maintenant de la conversation (menu de
 * l'en-tête du chat, comme dans le Chat principal) puis du Wakie, puis du
 * défaut — et c'est CE modèle qui est journalisé, en base ET via `/log-usage`.
 *
 * L'IDENTIFIANT DE RÉPONSE EST GÉNÉRÉ EXPLICITEMENT
 *
 * Sans `generateMessageId`, l'AI SDK émet un chunk `start` SANS `messageId` et
 * `responseMessage.id` vaut la chaîne vide : la réponse était écrite en base
 * avec une clé primaire vide, donc la PREMIÈRE seulement (les suivantes
 * tombaient en conflit silencieux et l'historique ne conservait qu'une réponse
 * assistant par conversation). Le chat principal passe par
 * `createUIMessageStream({ generateId })` ; ici l'identifiant est fourni au
 * flux de réponse, ce qui rend la persistance idempotente ET complète.
 */

export const maxDuration = 300;

/**
 * PARTIES DE MESSAGE ACCEPTÉES
 *
 * Une part est validée par TYPE, pas seulement par sa forme globale. Le
 * navigateur peut envoyer n'importe quoi, et une part `tool-invocation` ou
 * `approval-responded` fabriquée à la main ferait du client une source
 * d'autorité : il pourrait s'accorder à lui-même une décision d'outil
 * enregistrée pour un autre compte. Seules les parts de LECTURE (texte, fichier,
 * raisonnement, réponse d'outil déjà produite par le serveur) sont admises ; un
 * type inconnu est refusé.
 */
// L'historique assistant et les résultats d'outils fournis par le navigateur
// sont ignorés : seules les lignes de PostgreSQL font autorité.
const schema = z
  .object({
    conversationId: z.string().uuid(),
    messages: z.array(z.unknown()).min(1).max(200),
    reasoningLevel: z.enum(REASONING_LEVELS).nullable().optional(),
    // Message auquel CE message répond. La cible est revalidée en base contre
    // la conversation ET le compte : un identifiant inventé n'entre pas dans
    // le prompt, et une cible d'un autre fil est refusée, pas « citée ».
    replyToId: z.string().min(1).max(200).optional(),
    sourceUrl: z.string().max(500).optional(),
    // Participant qui répond (lot messagerie) : absent = organisateur du fil.
    // Le client enchaîne un tour par Wakie mentionné dans l'ordre du texte.
    wakieId: z.string().uuid().optional(),
  })
  .passthrough();

/**
 * L'invite système vit dans `lib/wakies/prompt.ts` : elle y est PURE et
 * testée, alors qu'elle était recopiée ici — deux copies qui avaient déjà
 * divergé (la copie locale ignorait les mentions et le profil utilisateur,
 * que le prompt partagé accepte). Un seul endroit décide désormais de la
 * hiérarchie des consignes.
 */

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const { auth, error } = await authenticateChatRequest();
  if (error === "forbidden") {
    return errorResponse("access_denied");
  }
  if (error === "unauthorized" || !auth) {
    return errorResponse("auth_required");
  }

  if (!isPaidTier(auth.maiUser.tier)) {
    return errorResponse("plan_required", {
      details: { upgradeUrl: MAI_UPGRADE_URL },
      message: "Wakies est disponible avec les forfaits mAI Plus, Pro et Max.",
    });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Requête de conversation invalide.",
    });
  }

  if (weeklyQuotaExceeded(auth.maiUser)) {
    return errorResponse("quota_exceeded", {
      details: {
        limit: auth.maiUser.limit,
        resetAt: auth.maiUser.resetAt,
        used: auth.maiUser.tokensUsed,
      },
      message:
        "Votre limite hebdomadaire de tokens est atteinte. Un message envoyé à un Wakie la consomme comme un message du chat.",
    });
  }
  await enforceChatRateLimit(request, auth.userId);

  const { conversationId, sourceUrl } = parsed.data;
  const conversation = await findConversation(auth.userId, conversationId);
  if (!conversation) {
    return errorResponse("not_found", {
      message: "Conversation introuvable.",
    });
  }
  const reglage = await ensureSettings(auth.userId);
  if (reglage.paused) {
    return errorResponse("access_denied", {
      message: "Les Wakies sont en pause. Reactivez-les dans les réglages.",
    });
  }
  const [wakie, memories, page] = await Promise.all([
    findWakie(auth.userId, conversation.wakieId),
    listMemories(auth.userId),
    pageForConversation(auth.userId, conversationId),
  ]);
  if (!wakie) {
    return errorResponse("not_found", { message: "Wakie introuvable." });
  }

  /**
   * RÉPONSE À UN MESSAGE
   *
   * La cible est résolue ICI, une fois, et sert deux fois : elle est écrite
   * sur le message utilisateur (donc l'interface affiche la citation) et elle
   * entre dans le prompt (donc le Wakie répond au bon propos). Un identifiant
   * qui n'appartient pas à cette conversation est une erreur explicite :
   * silencieusement ignoré, il ferait croire à une réponse ciblée qui n'en est
   * pas une.
   */
  const cite = parsed.data.replyToId
    ? await messageCite(auth.userId, conversationId, parsed.data.replyToId)
    : null;
  if (parsed.data.replyToId && !cite) {
    return errorResponse("invalid_request", {
      message:
        "Le message auquel vous répondez n'est pas dans cette conversation.",
    });
  }

  const incoming = incomingUserMessage.safeParse(parsed.data.messages.at(-1));
  if (!incoming.success)
    return errorResponse("invalid_request", {
      message:
        "Envoyez un message utilisateur contenant du texte ou un fichier.",
    });
  let dernier: UIMessage;
  try {
    dernier = durableUserAttachments(incoming.data, auth.userId);
  } catch {
    return errorResponse("access_denied", {
      message: "Pièce jointe privée invalide pour ce compte.",
    });
  }
  // Texte brut du message : /slash et @mentions y sont lus. PURE : le
  // parsing est testable, la résolution reste serveur (base + catalogue).
  const texteBrut = dernier.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        (p as { type?: string }).type === "text"
    )
    .map((p) => p.text)
    .join("\n")
    .slice(0, 4000);
  const slash = parseSlashCommand(texteBrut);
  const textePourMentions = slash ? slash.reste : texteBrut;
  const nomsMentionnes = parseMentions(textePourMentions);
  /**
   * Mentions d'OUTILS et de DOCUMENTS, lues à part des mentions de membres.
   *
   * `parseMentions` répond à « qui est nommé ici » ; `analyserMentions` répond
   * à « que demande-je pour ce tour (`@`) ou pour toujours (`@@`) ». Les deux
   * coexistent parce que les deux questions ont des réponses différentes :
   * nommer un Wakie ne l'active pas, mentionner un plugin ne le rend pas
   * répondant.
   */
  const mentionsTour = analyserMentions(textePourMentions);
  /**
   * Contexte du tour : mentions et PROFIL de l'utilisateur, lus ensemble.
   *
   * Le profil Vibe (lecture seule) est ce qui évite au Wakie de demander qui
   * il a en face de lui à chaque conversation. Il est réduit à un texte court
   * (`resumeProfilPourPrompt`) et vaut `null` quand Vibe n'a rien de plus que
   * le pseudo — un bloc de prompt vide ne consomme pas de contexte.
   */
  const [mentions, profilUtilisateur] = await Promise.all([
    resoudreMentions(auth.userId, nomsMentionnes),
    lireProfilVibeBref().then((profil) => resumeProfilPourPrompt(profil)),
  ]);
  /**
   * QUI RÉPOND
   *
   * Un fil n'a qu'un répondant : le Wakie qui le porte. Les conversations de
   * groupe entre Wakies sont retirées du produit — `@all` n'élargit donc plus
   * le fil, et les noms mentionnés ne servent qu'à enrichir le contexte.
   */
  const repondants = [{ nomme: false, wakieId: conversation.wakieId }];
  /** Notes affichées au lieu d'un silence : /slash, réponses écartées. */
  const notes: string[] = [];
  if (await messageExists(auth.userId, dernier.id))
    return Response.json(
      {
        code: "turn_already_saved",
        message:
          "Ce message est déjà enregistré. Rouvrez la conversation pour retrouver la réponse.",
      },
      { status: 409 }
    );

  // Modèle de CETTE conversation, sinon du Wakie, sinon la préférence de
  // l'hôte, sinon le défaut produit : c'est le choix fait dans le menu de
  // modèle (le même composant que le Chat et le mode Agent), appliqué à
  // l'appel réel.
  const models = await fetchUserModels();
  const userPrefs = await getUserModelPreferences(auth.userId).catch(
    () => null
  );
  const modelId = resolveWakieCatalogModel(
    filterModelsForTier(models, auth.maiUser.tier),
    conversation.model,
    wakie.model,
    userPrefs?.defaultChatModel ?? null
  );
  if (
    !models.some((candidate) => candidate.id === modelId) ||
    !isModelAllowedForTier(modelId, auth.maiUser.tier)
  )
    return errorResponse("access_denied", {
      message:
        "Ce modèle n’est pas disponible pour votre compte. Choisissez un modèle du catalogue mAI.",
    });
  const capabilities = getModelCapabilitiesFor(modelId, models);
  let modelMessages: UIMessage[];

  /**
   * MENTIONS DE CAPACITÉS ET DE DOCUMENTS — deux temps, une seule validation.
   *
   * `@@` d'abord : le réglage est écrit en base, puis reporté EN MÉMOIRE pour
   * que ce tour déjà le voie. Sans ce report, le premier `@@` n'aurait aucun
   * effet visible et l'utilisateur le repéterait.
   *
   * `@` ensuite : il ne s'écrit nulle part et entre dans la sélection par le
   * même couloir que le réglage du Wakie (`supplement` de `resolveSelection`),
   * donc sous la même revalidation. C'est ce qui empêche deux chemins d'avoir
   * deux idées différentes de ce qu'un plugin a le droit de faire ici.
   */
  const [resoluTour, resoluFil] = await Promise.all([
    resoudreMentionsCapacites({
      jetons: mentionsTour.tourCourant,
      userId: auth.userId,
    }),
    resoudreMentionsCapacites({
      jetons: mentionsTour.persistants,
      userId: auth.userId,
    }),
  ]);
  const reglageFil = await appliquerMentionsPersistantes({
    conversation,
    resolu: resoluFil,
    wakie,
  });
  const conversationEffective = { ...conversation, ...reglageFil.patch };
  if (Object.keys(reglageFil.patch).length > 0) {
    await updateConversation(auth.userId, conversation.id, reglageFil.patch);
    notes.push(...reglageFil.notes);
  }
  if (mentionsTour.depassements > 0) {
    notes.push(
      "Un message ne peut invoquer que cinq mentions : les suivantes ont été ignorées."
    );
  }
  for (const inconnu of [...resoluTour.inconnus, ...resoluFil.inconnus]) {
    notes.push(`Rien ne correspond à « @${inconnu} » dans vos capacités.`);
  }
  /** Contexte du tour : ce que le fil a réglé, plus ce que le message invoque. */
  const documentsTour = [
    ...(await contexteRegleSurLeFil({
      conversation: conversationEffective,
      userId: auth.userId,
    })),
    ...resoluTour.documents,
  ].slice(0, 3);

  /**
   * SÉLECTION RÉSOLUE — conversation d'abord, Wakie en repli, puis
   * revalidation contre l'état réel du compte. Un identifiant demandé mais
   * inexistant, non installé, désactivé ou hors forfait devient une ISSUE
   * affichée, jamais un outil quietly ajouté ni un plateau élargi.
   */
  const selection = await resolveSelection({
    conversation: {
      mcpServerIds: conversationEffective.mcpServerIds,
      pluginIds: conversationEffective.pluginIds,
      skillIds: conversationEffective.skillIds,
      skillParams: conversationEffective.skillParams,
      toolIds: conversationEffective.toolIds,
    },
    isGhostMode: false,
    supplement: resoluTour.ids,
    tier: auth.maiUser.tier,
    userId: auth.userId,
    wakie,
  });

  /**
   * APPLICATIONS CONNECTÉES MENTIONNÉES
   *
   * Un `@Google` ou `@GitHub` dans le message ajoute les outils de lecture du
   * connecteur à CE seul tour. La demande passe par la même revalidation que la
   * configuration du Wakie et exige une connexion réelle : sans compte relié,
   * l'utilisateur reçoit la raison plutôt qu'un appel qui échouerait en 401.
   */
  const mentionsConnectees = await applyIntegrationMentions({
    nomsMentionnes,
    tier: auth.maiUser.tier,
    userId: auth.userId,
  });
  for (const pluginId of mentionsConnectees.pluginIds) {
    if (!selection.pluginIds.includes(pluginId)) {
      selection.pluginIds.push(pluginId);
    }
  }
  selection.issues.push(...mentionsConnectees.issues);

  /**
   * /SLASH — la commande de CE message est résolue ici : un lot d'outils à
   * activer pour ce seul tour, un prompt prédéfini, ou une note. La résolution
   * reste dans `lib/wakies/slash.ts` : cette route ne fait qu'assembler.
   */
  const slashResolution = slash
    ? await resolveSlashCommand(auth.userId, slash.commande)
    : null;
  // Outils activés POUR CE SEUL TOUR : validés côté catalogue, jamais globaux.
  const slashOutils = slashResolution?.outilsSupplementaires ?? [];
  if (slashResolution?.notice) {
    notes.push(slashResolution.notice);
  }

  /**
   * Invite du TOUR.
   *
   * Le nom du dessinateur, ses instructions et ses mémoires viennent du
   * répondant ; tout le reste (conversation, mentions, citation, profil,
   * /slash) décrit le tour.
   */
  const promptDuTour = (dessinateur: typeof wakie) =>
    `${inviteSysteme({
      // Pages, Espaces et Wakies invoqués (`@`) ou réglés sur le fil (`@@`).
      documents: documentsTour,
      instructions: dessinateur.instructions,
      memories:
        reglage.memoryAllowed && dessinateur.memoryAllowed
          ? memories.map((memoire) => memoire.text)
          : [],
      // Les Wakies cités par `@` : leur persona PUBLIÉE (ou, pour les miens,
      // leurs instructions) entre comme contexte de lecture seule.
      mentions,
      nom: dessinateur.name,
      outils: [...new Set([...selection.toolIds, ...slashOutils])],
      page: page ? { contenu: page.content, title: page.title } : null,
      // Vitrine Vibe du compte, présentée comme une DONNÉE (contrat ci-dessus).
      profilUtilisateur,
      // Le prompt prédéfini de /slash, la plus ponctuelle du tour.
      promptSlash: slashResolution?.promptPrefixe ?? null,
      reactionCible: capabilities.tools,
      // La réaction n'est proposée que si le modèle sait appeler un outil : un
      // modèle sans outils ne peut ni réagir ni choisir le triple mode.
      reactionDisponible: capabilities.tools,
      // Réponse CIBLÉE : le Wakie voit le message visé, donc il répond au bon
      // propos — et l'interface affiche la même citation de son côté.
      reponseA: cite
        ? {
            // L'auteur est nommé : « l'utilisateur », moi-même, ou un invité du
            // fil. Le modèle ne choisit jamais ce nom — il vient de la base.
            auteur:
              cite.role === "user"
                ? "l'utilisateur"
                : cite.authorWakieId === null || cite.authorWakieId === wakie.id
                  ? wakie.name
                  : "un autre Wakie du fil",
            extrait: cite.extrait,
          }
        : null,
      skills: selection.skills.instructions,
    })}${
      sourceUrl
        ? `\n\nSource prioritaire demandée par l'utilisateur : ${sourceUrl}`
        : ""
    }`;

  /**
   * SERVEURS MCP
   *
   * `serverIds` est TOUJOURS explicite : `[]` signifie « aucun serveur » et
   * court-circuite toute lecture de secrets et toute découverte réseau
   * (`lib/chat/mcp.ts:123`). Passer `undefined` ferait deviner les serveurs
   * d'après les outils demandés, donc ouvrirait l'accès à des serveurs non
   * choisis.
   */
  let mcpUnavailable = false;
  const mcpContext =
    capabilities.tools && selection.mcpServerIds.length > 0
      ? await loadMcpContext({
          chatId: conversationId,
          isToolApprovalFlow: true,
          messages: [],
          requestedTools: [MCP_TOOL_SENTINEL],
          serverIds: selection.mcpServerIds,
          skillMcpServerIds: selection.skills.mcpServerIds,
          skillMcpToolFilter: selection.skills.mcpToolFilter,
          userId: auth.userId,
        }).catch(() => {
          mcpUnavailable = true;
          return null;
        })
      : null;

  const prefs = await getUserMcpPrefs(auth.userId);
  const mcpTools = mcpContext
    ? createMcpChatTools({
        // `chatId` est l'uuid de la conversation. `McpLog.chatId` n'a pas de
        // clé étrangère, donc l'écriture est acceptée ; il sert à rattacher
        // l'appel à la conversation dans le journal MCP.
        chatId: conversationId,
        prefs: toMcpRuntimePreferences(prefs),
        servers: mcpContext.userMcpServers,
        userId: auth.userId,
      })
    : {};

  const pluginTools =
    capabilities.tools && selection.pluginIds.length > 0
      ? createPluginTools(
          {
            channel: "chat",
            chatModel: modelId,
            isGhostMode: false,
            // Identité + coffre : un connecteur lit le compte de l'utilisateur,
            // et `createPluginTools` l'écarte sans ces deux-la.
            secretResolver: createIntegrationSecretResolver({
              userId: auth.userId,
            }),
            session: {
              token: auth.sessionToken,
              user: { email: auth.maiUser.email, id: auth.userId },
            },
            userId: auth.userId,
          },
          selection.pluginIds
        )
      : {};

  /**
   * COMPTAGE D'USAGE
   *
   * La clé d'idempotence est DÉRIVÉE, pas aléatoire : `wakies:<conversation>
   * <message>:<modèle>`. Avec un `randomUUID()` par requête, un rejeu du même
   * tour — un double-clic, un onglet dupliqué, une reprise après coupure —
   * passait une clé neuve à chaque fois et était facturé DEUX FOIS, en base
   * comme sur le quota du compte. Le chat principal construit sa clé de la
   * même façon (`lib/chat/stream.ts:94`) : on lui copie ce modèle.
   *
   * `chatId` est `null` : un identifiant de conversation Wakies n'est pas un
   * identifiant de la table `Chat`, et l'écrire dans `UsageEvent.chatId`
   * ferait apparaître une conversation du produit principal dans les
   * statistiques. La clé porte déjà toute la traçabilité nécessaire.
   */
  const usageEventKey = `wakies:${conversationId}:${dernier.id}:${modelId}`;

  const reservation = await reserveChatTurn(
    auth.userId,
    conversationId,
    dernier.id,
    parsed.data.wakieId
  );
  if ("conflict" in reservation)
    return Response.json(
      {
        code: "conversation_busy",
        message:
          reservation.conflict === "busy"
            ? "Une réponse est déjà en cours dans cette conversation. Réessayez après sa fin."
            : "Ce tour a déjà été lancé. Rechargez l’historique avant un nouvel envoi.",
      },
      { status: 409 }
    );
  try {
    // Lire après la réservation pour inclure le tour précédent désormais terminé.
    const history = storedMessages(
      await listMessages(auth.userId, conversationId, { limite: 199 })
    );
    modelMessages = await resolveMessageAttachments(
      auth.userId,
      [...history, dernier],
      capabilities
    );
  } catch (error) {
    await finishChatTurn(auth.userId, reservation.id, "failed");
    return errorResponse("invalid_request", {
      message:
        error instanceof Error && error.name === "WakiesAttachmentError"
          ? error.message
          : "Impossible de préparer la conversation. Réessayez dans quelques instants.",
    });
  }
  try {
    await appendMessages(auth.userId, [
      {
        conversationId,
        id: dernier.id,
        parts: dernier.parts,
        replyToId: cite?.id ?? null,
        role: dernier.role,
      },
    ]);
  } catch (e) {
    await finishChatTurn(auth.userId, reservation.id, "failed");
    throw e;
  }
  let streamFailed = false;
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Notes visibles au lieu d'un silence : limite de 5, invités disparus.
      if (notes.length) {
        writer.write({ data: notes, transient: true, type: "data-notes" });
      }
      // Chaque RÉPONDANT joue son tour dans l'ordre de `repondants` : il relit
      // l'historique au début de son tour (même modèle, mêmes buckets), donc
      // il voit les réponses de ses prédécesseurs — c'est le débat de groupe.
      for (const repondant of repondants.length > 0
        ? repondants
        : [{ nomme: false, wakieId: conversation.wakieId }]) {
        const wakieDuTour =
          repondant.wakieId === conversation.wakieId
            ? wakie
            : await findWakie(auth.userId, repondant.wakieId);
        // Un invité supprimé entre l'invitation et le tour : une note, pas une
        // erreur — le groupe ne se tait pas pour un membre parti.
        if (!wakieDuTour) {
          writer.write({
            data: [
              "Un Wakie invité a été supprimé : il ne répond pas à ce message.",
            ],
            transient: true,
            type: "data-notes",
          });
          continue;
        }
        // Instruments du tour portés par le répondant (modèle, résolution,
        // système rechargés par bulle ci-dessous) ; le reste des outils est
        // transversal au compte.
        const outils: ToolSet = createChatTools(
          {
            chatId: null,
            chatModel: modelId,
            dataStream: writer,
            effectiveAgentId: null,
            isGhostMode: false,
            maiUser: auth.maiUser,
            memoryActive: reglage.memoryAllowed && wakie.memoryAllowed,
            memoryAllowAdd: reglage.memoryAllowed && wakie.memoryAllowed,
            memoryLimit:
              getWakiesQuota(auth.maiUser.tier, "memories") ??
              Number.MAX_SAFE_INTEGER,
            sessionToken: auth.sessionToken,
            userEmail: auth.maiUser.email,
            userId: auth.userId,
          },
          mcpTools,
          pluginTools
        );
        // L'OUTIL DE RÉACTION (triple choix IA) est ajouté au plateau quand le
        // modèle sait appeler un outil. La cible est le message utilisateur de
        // CE tour, jamais choisie par le modèle.
        const outilsReaction = capabilities.tools
          ? createWakieReactionTool({
              messageId: dernier.id,
              userId: auth.userId,
              wakieId: wakie.id,
            })
          : {};

        /**
         * OUTILS DE PAGE.
         *
         * Ils n'existent que si CE fil porte une page : le modèle ne choisit
         * jamais sur quelle page écrire. La suppression et le renommage
         * demandent l'approbation, le contenu et les réglages s'écrivent
         * directement — voir `lib/wakies/page-tools.ts`.
         */
        const outilsPage =
          page && capabilities.tools
            ? createWakiePageTools({ pageId: page.id, userId: auth.userId })
            : {};
        const idsOutilsFil = new Set([
          WAKIE_REACTION_TOOL_ID,
          ...Object.keys(outilsPage),
        ]);

        /**
         * ACTIVE TOOLS
         *
         * Le tableau est TOUJOURS passé, y compris vide. Pour le SDK,
         * `undefined` signifie « aucune restriction » : le modèle reverrait
         * alors voir TOUTES les clés de `tools`, y compris celles que la
         * sélection exclut. Une sélection vide doit vouloir dire zéro outil,
         * jamais « tous les outils du compte ».
         *
         * Le filtre `id in outils` fait deux choses : il retire les outils
         * demandés que `createChatTools` n'instancie pas, et il garantit qu'un
         * outil listé deux fois n'apparaît qu'une fois.
         */
        const actifs = [
          ...new Set([
            ...selection.toolIds,
            // Outils activés pour CE SEUL tour par /slash, validés par le
            // catalogue (`estOutilConnu`) : pas une sélection persistante.
            ...slashOutils,
            ...Object.keys(pluginTools),
            ...Object.keys(mcpTools),
            // L'outil de réaction est TOUJOURS actif quand le modèle sait
            // appeler un outil : pas une sélection d'utilisateur, pas un risque.
            ...(capabilities.tools ? [WAKIE_REACTION_TOOL_ID] : []),
            ...Object.keys(outilsPage),
          ]),
        ].filter(
          (id) =>
            capabilities.tools &&
            (id in outils || idsOutilsFil.has(id)) &&
            ((reglage.researchAllowed && wakie.researchAllowed) ||
              (id !== "webSearch" && id !== "readUrl")) &&
            // Les outils MCP sensibles sans execute attendent le moteur d'approbation Agent.
            // Ne jamais les considérer exécutables ni autoriser globalement un nom d'outil.
            (!id.startsWith("mcp_") ||
              typeof outils[id]?.execute === "function")
        );
        const issues = [...selection.issues.map((issue) => issue.raison)];
        if (mcpUnavailable) {
          issues.push(
            "Les connexions MCP sélectionnées n'ont pas pu être chargées. La conversation reste disponible sans ces outils."
          );
        }
        if (
          !capabilities.tools &&
          (selection.toolIds.length ||
            selection.mcpServerIds.length ||
            selection.pluginIds.length)
        )
          issues.push(
            "Ce modèle ne prend pas en charge les outils. La conversation reste disponible en texte."
          );
        if (issues.length)
          writer.write({
            data: issues,
            transient: true,
            type: "data-capability-issues",
          });

        const chosenEffort =
          parsed.data.reasoningLevel ?? userPrefs?.reasoningLevel ?? null;
        // Le niveau préféré peut ne pas exister sur ce modèle (mAI-2-Mini
        // n'en expose aucun) : on laisse alors le fournisseur trancher au lieu
        // d'envoyer un effort qu'il refuserait.
        const resolvedEffort = resolveReasoningEffort({
          capabilities,
          preferred: chosenEffort,
        });
        const providerOptions = resolvedEffort.effort
          ? resolveReasoningProviderOptions(resolvedEffort.effort)
          : undefined;

        // Un collecteur PAR RÉPONDANT : le modèle est instancié ici et non
        // plus une fois pour tout le fil, sinon deux Wakies qui répondent
        // successivement partageraient le même tampon de raisonnement.
        const reasoningSink = createReasoningDetailsSink();
        const reasoningWriter = createReasoningChunkWriter(
          writer,
          `reasoning-${reservation.responseId}-${repondant.wakieId}`
        );
        reasoningSink.onDelta = (text) => reasoningWriter.push(text);
        const model = getLanguageModel(modelId, {
          reasoningSink,
          sessionToken: auth.sessionToken,
          userId: auth.userId,
        });

        const result = streamText({
          abortSignal: request.signal,
          ...(providerOptions ? { providerOptions } : {}),
          // Toujours passé : `undefined` réactiverait tout le plateau.
          activeTools: actifs as never,
          messages: await convertToModelMessages(
            // Relecture PAR TOUR : chaque Wakie voit les réponses de ses
            // prédécesseurs — le fil est relit après chaque bulle écrite.
            [
              ...storedMessages(
                await listMessages(auth.userId, conversationId, { limite: 199 })
              ),
              dernier,
            ]
          ),
          model,
          onAbort() {
            reasoningWriter.finish();
          },
          onEnd: async ({ totalUsage: usage }) => {
            reasoningWriter.finish();
            // `promptTokens`/`completionTokens` sont les noms historiques de
            // certains fournisseurs ; ils ne sont pas dans le type de l'AI SDK v7
            // mais restent retournés à l'exécution. On les lit donc sans le
            // typer, exactement comme le chat principal.
            const brut = usage as {
              completionTokens?: number;
              promptTokens?: number;
            };
            const inputTokens = usage.inputTokens ?? brut.promptTokens ?? 0;
            const outputTokens =
              usage.outputTokens ?? brut.completionTokens ?? 0;
            // La réflexion est un sous-ensemble des tokens de sortie côté
            // fournisseur, mais l'AI SDK la sort de `outputTokens` : elle est
            // recomposée explicitement, sans double comptage — même règle que le
            // chat principal (`resolveBillableTotal`).
            const reasoningTokens = readReasoningTokens(usage);
            const totalTokens = resolveBillableTotal({
              inputTokens,
              outputTokens,
              reasoningTokens,
              totalTokens: usage.totalTokens ?? 0,
            });
            if (totalTokens <= 0) {
              return;
            }

            // Écriture Base : ATTENDUE et rattrapée. Un `void` sans `catch`
            // laisserait une promesse rejetée non gérée, et la perte serait
            // invisible — le quota local ne serait jamais débité.
            try {
              await recordTokenUsage({
                chatId: null,
                chatMode: "chat",
                idempotencyKey: usageEventKey,
                inputTokens,
                model: modelId,
                outputTokens,
                reasoningTokens,
                totalTokens,
                userEmail: auth.maiUser.email,
                userId: auth.userId,
              });
            } catch (erreurEcriture) {
              console.error(
                "[wakies-chat] Échec du décompte local:",
                erreurEcriture
              );
            }

            // Notification du compteur côté API mAI, comme `/api/chat` : la base
            // Next n'est pas la seule à tenir le quota du compte.
            try {
              const logRes = await fetch(`${MAI_API_URL}/log-usage`, {
                body: JSON.stringify({
                  idempotencyKey: usageEventKey,
                  inputTokens,
                  isGhostMode: false,
                  model: modelId,
                  outputTokens,
                  reasoningTokens,
                  tokensUsed: totalTokens,
                }),
                headers: {
                  Authorization: `Bearer ${auth.sessionToken}`,
                  "Content-Type": "application/json",
                },
                method: "POST",
                signal: AbortSignal.timeout(10_000),
              });
              if (!logRes.ok) {
                console.error(
                  "[wakies-chat][API log-usage] Status:",
                  logRes.status,
                  await logRes.text()
                );
              }
            } catch (logErr) {
              console.error("[wakies-chat] Erreur décompte log-usage:", logErr);
            }

            // Overlay de session pour le compteur du client : la valeur serveur
            // est mise en cache 180 s, donc un compteur qui ne verrait qu'elle
            // semblerait immobile pendant plusieurs tours.
            try {
              writer.write({
                data: {
                  inputTokens,
                  outputTokens,
                  reasoningTokens,
                  tokens: totalTokens,
                  total: totalTokens,
                } as never,
                transient: true,
                type: "data-usage" as never,
              });
            } catch (erreurFlux) {
              console.warn(
                "[wakies-chat] data-usage non écrit (flux fermé ?):",
                erreurFlux
              );
            }
          },
          onError() {
            reasoningWriter.finish();
          },
          stopWhen: stepCountIs(8),
          system: promptDuTour(wakieDuTour),
          tools: { ...outils, ...outilsReaction, ...outilsPage },
        });
        writer.merge(result.toUIMessageStream({ sendReasoning: true }));
      } // fin du for sur les répondants
    },
    // Identifiant de réponse EXPLICITE : sans lui, l'AI SDK émet un chunk
    // `start` sans `messageId` et la réponse est écrite en base avec une clé
    // primaire vide — donc la PREMIÈRE seulement, les suivantes entrant en
    // conflit silencieux (voir le commentaire d'en-tête).
    generateId: () => reservation.responseId,
    // La persistance passe par la fin du flux UI et non par `streamText` :
    // c'est le seul moment où la forme EXACTE envoyée au client est connue.
    // Seul ce qui n'est pas déjà en base est écrit (le message de l'utilisateur
    // est conservé avant génération). Les réponses partielles sont conservées
    // et leur exécution est marquée interrompue.
    onEnd: async ({ isAborted, isCancelled, responseMessage }) => {
      const aEcrire: WakieMessageInput[] = [];
      if (dernier?.id && !(await messageExists(auth.userId, dernier.id))) {
        aEcrire.push({
          conversationId,
          id: dernier.id,
          parts: dernier.parts,
          role: dernier.role,
        });
      }
      if (
        responseMessage.id &&
        responseMessage.parts.length > 0 &&
        !(await messageExists(auth.userId, responseMessage.id))
      ) {
        aEcrire.push({
          conversationId,
          id: responseMessage.id,
          parts: responseMessage.parts,
          role: responseMessage.role,
        });
      }
      await appendMessages(auth.userId, aEcrire);
      await touchConversation(auth.userId, conversationId);
      await finishChatTurn(
        auth.userId,
        reservation.id,
        isAborted || isCancelled || request.signal.aborted
          ? "interrupted"
          : streamFailed
            ? "failed"
            : "completed"
      );
    },
    // Le client affiche déjà « en cours » de son côté ; renvoyer un texte
    // d'erreur comme message de tour le ferait apparaître comme une réponse
    // du Wakie, ce qu'elle n'est pas.
    onError: (erreur) => {
      streamFailed = true;
      void finishChatTurn(auth.userId, reservation.id, "failed").catch(
        () => {}
      );
      console.error("[wakies-chat] erreur de flux:", erreur);
      return "La réponse n'a pas pu être terminée. Votre conversation est conservée.";
    },
  });

  // PAS de `consumeSseStream` : le chat principal s'y accroche pour créer une
  // ligne dans `Stream`, dont `chatId` est une clé étrangère VERS `Chat.id`. Un
  // identifiant de conversation Wakies y serait refusé par PostgreSQL.
  return createUIMessageStreamResponse({ stream });
}
