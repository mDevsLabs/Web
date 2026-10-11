import "server-only";

/**
 * ============================================================================
 * Mentions `@` (ce tour) et `@@` (réglage du fil) — suggestions et résolution
 * ============================================================================
 *
 * LE PRINCIPE, EMPRUNTÉ À `lib/wakies/capabilities.ts`
 *
 * Un jeton tapé dans une conversation n'est PAS une autorisation. Il ne prouve
 * que l'intention de l'utilisateur. Ce module transforme un jeton en
 * IDENTIFIANT, et c'est `resolveSelection` qui, ensuite, revalide chaque
 * identifiant contre l'état réel du compte (installé, activé, dans le forfait).
 * Deux règles en découlent, et elles ne sont pas négociables :
 *
 *   1. ce module ne produit JAMAIS un outil directement — il ne fait que nommer
 *      ce que l'utilisateur a demandé, pour que la voie unique de revalidation
 *      en décide ;
 *   2. un jeton qui ne correspond à rien n'élargit pas non plus le plateau :
 *      « tous les outils du compte » n'est jamais le sens d'une faute de frappe.
 *
 * CE QUI N'EST PAS UN OUTIL
 *
 * Une page, un Espace ou un Wakie mentionné ne s'active pas : il entre dans le
 * prompt comme CONTEXTE de lecture seule, borné. Un `@page` qui déclencherait
 * une écriture serait une prise de contrôle du document par un message.
 */

import {
  getMcpServersByUserId,
  getPluginInstallationsByUserId,
  getProjectsByUserId,
  getSkillsByUserId,
} from "@/lib/db/queries";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";
import { listActiveConnections } from "@/lib/integrations/repository";
import { PLUGIN_MANIFEST_LIST } from "@/lib/plugins/catalog";
import { canUsePlugin } from "@/lib/plugins/tier-lock";
import { hasReadTool } from "@/lib/plugins/tool-effect";
import {
  findPage,
  findSpace,
  listPages,
  listSpaces,
  listWakies,
  rechercherPagesParTitre,
} from "@/lib/wakies/queries";
import { WAKIE_TOOL_CATALOG } from "@/lib/wakies/tool-catalog";

/** Famille d'objet mentionnable. Le serveur seul sait à quoi elle ressemble. */
export type FamilleMention =
  | "ami"
  | "connecteur"
  | "espace"
  | "mcp"
  | "outil"
  | "page"
  | "plugin"
  | "projet"
  | "skill"
  | "wakie";

export type SectionMention =
  | "agents"
  | "competences"
  | "documents"
  | "extensions";

export type SuggestionMention = {
  badges: string[];
  /** Le nom porte un espace : seul le jeton cité `@"…"` est relisible. */
  cite: boolean;
  famille: FamilleMention;
  id: string;
  /** Motif affichable d'une indisponibilité ; la ligne reste visible. */
  indisponible?: string;
  jeton: string;
  label: string;
  /** `@@` impossible : l'objet n'a pas de colonne de réglage durable. */
  persistable: boolean;
  section: SectionMention;
  sousLabel?: string;
};

export type MentionResolue = {
  /** Documents à injecter en contexte (lecture seule), déjà bornés. */
  documents: { contenu: string; titre: string }[];
  /** Identifiants à soumettre à `resolveSelection`, famille par famille. */
  ids: {
    mcpServerIds: string[];
    pluginIds: string[];
    skillIds: string[];
    toolIds: string[];
  };
  /** Identifiants de contexte, pour le réglage durable `@@`. */
  idsEspaces: string[];
  idsPages: string[];
  idsWakies: string[];
  /** Ce qui ne correspond à rien : une note, jamais un plateau élargi. */
  inconnus: string[];
  /** Wakies et amis nommés, pour le contexte (ils ne répondent jamais). */
  wakies: string[];
};

/** Trois documents, huit mille caractères : le contexte d'un tour, pas un cours. */
const DOCUMENTS_MAX = 3;
const DOCUMENTS_CARACTERES_MAX = 8000;
const PAR_FAMILLE = 6;

/** Comparaison insensible aux accents, à la casse, aux espaces et aux tirets. */
function nettoie(valeur: string): string {
  return valeur
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Un jeton est un mot court : tout nom qui n'en est pas un s'écrit entre guillemets. */
function jetonDe(nom: string): { cite: boolean; jeton: string } {
  const simple = nom.trim().split(/\s+/)[0] ?? "";
  const utilise = nettoie(simple);
  if (utilise.length >= 2 && nettoie(nom) === utilise) {
    return { cite: false, jeton: utilise };
  }
  return { cite: true, jeton: nom.trim() };
}

function correspond(jeton: string, terme: string): boolean {
  const n = nettoie(jeton);
  const t = nettoie(terme);
  return t.length === 0 || n.includes(t);
}

/**
 * Tout ce qu'un compte peut mentionner, en sections.
 *
 * Aucune donnée d'un autre compte ne sort d'ici : les amis ne sont proposés que
 * par leur nom public, jamais par leurs instructions ou leurs capacités.
 */
export async function suggestMentions(params: {
  q: string;
  tier: string;
  userEmail?: string;
  userId: string;
}): Promise<SuggestionMention[]> {
  const { q, tier, userId } = params;
  const [installations, serveurs, skills, espaces, wakies, connexions] =
    await Promise.all([
      getPluginInstallationsByUserId({ userId }),
      getMcpServersByUserId({ userId }),
      getSkillsByUserId({ userId }),
      listSpaces(userId),
      listWakies(userId),
      listActiveConnections({ userId }).catch(() => []),
    ]);
  const pages = await rechercherPagesParTitre(userId, q, PAR_FAMILLE);
  const suggestions: SuggestionMention[] = [];

  for (const manifest of PLUGIN_MANIFEST_LIST) {
    const installation = installations.find(
      (item) => item.pluginId === manifest.id
    );
    const horsForfait = !canUsePlugin(manifest, tier);
    const sansLecture = !hasReadTool(manifest);
    suggestions.push({
      badges: installation?.isEnabled ? ["installée"] : [],
      ...jetonDe(manifest.name),
      famille: "plugin",
      id: manifest.id,
      indisponible: horsForfait
        ? `Réservé au forfait ${manifest.minTier}.`
        : installation
          ? installation.isEnabled
            ? sansLecture
              ? "Écriture seule : disponible depuis l'Agent."
              : undefined
            : "Désactivée dans vos réglages."
          : "Non installée sur ce compte.",
      label: manifest.name,
      persistable: true,
      section: "extensions",
      sousLabel: manifest.description,
    });
  }

  for (const serveur of serveurs) {
    if (!correspond(serveur.name, q)) continue;
    suggestions.push({
      badges: serveur.isEnabled ? [] : ["désactivé"],
      ...jetonDe(serveur.name),
      famille: "mcp",
      id: serveur.id,
      indisponible: serveur.isEnabled ? undefined : "Serveur désactivé.",
      label: serveur.name,
      persistable: true,
      section: "extensions",
    });
  }

  for (const connecteur of INTEGRATION_PROVIDERS) {
    const relie = connexions.some(
      (connexion) => connexion.provider === connecteur.id
    );
    // Une application non reliée n'a aucun outil à offrir : la proposer ne
    // produirait qu'un refus après l'envoi — la règle déjà posée côté composeur.
    if (!relie) continue;
    if (
      !correspond(connecteur.label, q) &&
      !correspond(connecteur.mentionToken, q)
    )
      continue;
    suggestions.push({
      badges: ["connectée"],
      cite: false,
      famille: "connecteur",
      id: connecteur.pluginId,
      jeton: connecteur.mentionToken,
      label: connecteur.label,
      persistable: false,
      section: "extensions",
      sousLabel: "Lecture seule dans le fil",
    });
  }

  for (const skill of skills) {
    if (!correspond(skill.name, q)) continue;
    suggestions.push({
      badges: [],
      ...jetonDe(skill.name),
      famille: "skill",
      id: skill.id,
      label: skill.name,
      persistable: true,
      section: "competences",
      sousLabel: skill.description ?? undefined,
    });
  }

  for (const outil of WAKIE_TOOL_CATALOG) {
    if (!correspond(outil.label, q) && !correspond(outil.id, q)) continue;
    suggestions.push({
      badges: outil.ecritCompte ? ["modifie le compte"] : [],
      cite: false,
      famille: "outil",
      id: outil.id,
      jeton: nettoie(outil.id),
      label: outil.label,
      persistable: true,
      section: "competences",
      sousLabel: outil.description,
    });
  }

  for (const espace of espaces) {
    if (!correspond(espace.name, q)) continue;
    suggestions.push({
      badges: espace.pinned ? ["épinglé"] : [],
      ...jetonDe(espace.name),
      famille: "espace",
      id: espace.id,
      label: espace.name,
      persistable: true,
      section: "documents",
      sousLabel: espace.description || undefined,
    });
  }

  for (const page of pages) {
    suggestions.push({
      badges: [],
      ...jetonDe(page.title),
      famille: "page",
      id: page.id,
      label: page.title,
      persistable: true,
      section: "documents",
    });
  }

  for (const wakie of wakies) {
    const nom = wakie.handle ?? wakie.name;
    if (!correspond(nom, q) && !correspond(wakie.name, q)) continue;
    suggestions.push({
      badges: [],
      ...jetonDe(nom),
      famille: "wakie",
      id: wakie.id,
      label: wakie.name,
      // Un Wakie mentionné apporte son contexte ; le répondant du fil ne
      // change jamais, c'est la règle du port (`INTEGRATION.md` § Fiche).
      persistable: true,
      section: "agents",
      sousLabel: wakie.publicPersona || undefined,
    });
  }

  if (params.userEmail) {
    const projets = await getProjectsByUserId({
      userEmail: params.userEmail,
      userId,
    }).catch(() => []);
    for (const projet of projets.slice(0, PAR_FAMILLE)) {
      if (!correspond(projet.name, q)) continue;
      suggestions.push({
        badges: [],
        ...jetonDe(projet.name),
        famille: "projet",
        id: projet.id,
        label: projet.name,
        // Un projet mAI n'est pas un objet de `WakiesConversation` : il se
        // mentionne pour le tour, pas pour toujours.
        persistable: false,
        section: "agents",
      });
    }
  }

  return suggestions
    .filter(
      (suggestion) =>
        correspond(suggestion.label, q) || correspond(suggestion.jeton, q)
    )
    .slice(0, 24);
}

/**
 * Jetons → identifiants et contexte.
 *
 * `resoudreMentionsCapacites` ne tranche rien : elle NOMME. La décision
 * d'activer ou non un plugin, un serveur MCP, une compétence ou un outil
 * appartient à `resolveSelection`, qui revalide contre le compte. C'est ce qui
 * garantit qu'une mention et un réglage de Wakie ne peuvent jamais avoir deux
 * droits différents sur la même capacité.
 *
 * (Le nom est distinct de `resoudreMentions`, dans `queries.ts` : celui-là
 * résout des Wakies nommés pour le contexte, et les deux vivent dans la même
 * route de chat.)
 */
export async function resoudreMentionsCapacites(params: {
  jetons: readonly string[];
  userId: string;
}): Promise<MentionResolue> {
  const demandes = [
    ...new Set(
      params.jetons.map((jeton) => jeton.trim().toLowerCase()).filter(Boolean)
    ),
  ].slice(0, 5);
  const resolu: MentionResolue = {
    documents: [],
    ids: { mcpServerIds: [], pluginIds: [], skillIds: [], toolIds: [] },
    idsEspaces: [],
    idsPages: [],
    idsWakies: [],
    inconnus: [],
    wakies: [],
  };
  if (demandes.length === 0) return resolu;

  const [serveurs, skills, espaces, wakies] = await Promise.all([
    getMcpServersByUserId({ userId: params.userId }),
    getSkillsByUserId({ userId: params.userId }),
    listSpaces(params.userId),
    listWakies(params.userId),
  ]);

  for (const demande of demandes) {
    const cible = nettoie(demande);
    let touche = false;

    for (const outil of WAKIE_TOOL_CATALOG) {
      if (nettoie(outil.id) === cible || nettoie(outil.label) === cible) {
        if (!resolu.ids.toolIds.includes(outil.id)) {
          resolu.ids.toolIds.push(outil.id);
        }
        touche = true;
      }
    }
    for (const manifest of PLUGIN_MANIFEST_LIST) {
      if (nettoie(manifest.id) === cible || nettoie(manifest.name) === cible) {
        // La revalidation (installée, activée, forfait, lecture seule) ne se
        // rejoue pas ici : on transmet l'identifiant, `resolveSelection` décide.
        if (!resolu.ids.pluginIds.includes(manifest.id)) {
          resolu.ids.pluginIds.push(manifest.id);
        }
        touche = true;
      }
    }
    for (const serveur of serveurs) {
      if (nettoie(serveur.name) === cible) {
        if (!resolu.ids.mcpServerIds.includes(serveur.id)) {
          resolu.ids.mcpServerIds.push(serveur.id);
        }
        touche = true;
      }
    }
    for (const skill of skills) {
      if (nettoie(skill.name) === cible) {
        if (!resolu.ids.skillIds.includes(skill.id)) {
          resolu.ids.skillIds.push(skill.id);
        }
        touche = true;
      }
    }
    for (const espace of espaces) {
      if (nettoie(espace.name) !== cible) continue;
      const contenu = await contexteEspace(params.userId, espace.id);
      if (contenu) {
        resolu.documents.push({ contenu, titre: `Espace « ${espace.name} »` });
        if (!resolu.idsEspaces.includes(espace.id)) {
          resolu.idsEspaces.push(espace.id);
        }
        touche = true;
      }
    }
    for (const wakie of wakies) {
      const nom = wakie.handle ? nettoie(wakie.handle) : nettoie(wakie.name);
      if (nom !== cible && nettoie(wakie.name) !== cible) continue;
      resolu.wakies.push(wakie.handle ?? wakie.name);
      if (!resolu.idsWakies.includes(wakie.id)) {
        resolu.idsWakies.push(wakie.id);
      }
      touche = true;
    }
    if (!touche) {
      // Les pages sont recherchées par titre en base : un nom exact de page
      // n'est pas devinable depuis une liste chargée.
      const parTitre = await rechercherPagesParTitre(params.userId, demande, 1);
      const page = parTitre.find(
        (candidate) => nettoie(candidate.title) === cible
      );
      if (page) {
        resolu.documents.push({
          contenu: page.content.slice(0, 2000),
          titre: `Page « ${page.title} »`,
        });
        if (!resolu.idsPages.includes(page.id)) {
          resolu.idsPages.push(page.id);
        }
      } else {
        resolu.inconnus.push(demande);
      }
    }
  }

  resolu.documents = bornerDocuments(resolu.documents);
  return resolu;
}

/**
 * Contexte d'un Espace mentionné : son plan, pas le contenu de ses pages.
 *
 * Un `@Espace` répond à « de quoi je parle ici », pas « recopie-moi tout ».
 * Vingt pages intégrales dans le prompt coûteraient le tour entier pour une
 * information que le modèle pouvait trouver page par page, lui.
 */
async function contexteEspace(
  userId: string,
  spaceId: string
): Promise<string | null> {
  const espace = await findSpace(userId, spaceId);
  if (!espace) return null;
  const pages = await listPages(userId, spaceId);
  const titres = pages.slice(0, 20).map((page) => `- ${page.title}`);
  return [
    espace.description.trim() || "(sans description)",
    titres.length
      ? `Pages :\n${titres.join("\n")}${pages.length > 20 ? `\n- … ${pages.length - 20} autre(s)` : ""}`
      : "Aucune page pour l'instant.",
  ].join("\n");
}

/**
 * Contexte DÉJÀ réglé sur le fil (`@@` d'un tour précédent).
 *
 * Rechargé à chaque tour depuis les colonnes, jamais depuis ce que le client
 * croit avoir réglé : un onglet périmé ne peut pas apporter son propre contexte.
 * Les identifiants devenus pendants sont simplement ignorés.
 */
export async function contexteRegleSurLeFil(params: {
  conversation: {
    contextPageIds?: string[] | null;
    contextSpaceIds?: string[] | null;
    contextWakieIds?: string[] | null;
  };
  userId: string;
}): Promise<{ contenu: string; titre: string }[]> {
  const documents: { contenu: string; titre: string }[] = [];
  for (const spaceId of (params.conversation.contextSpaceIds ?? []).slice(
    0,
    DOCUMENTS_MAX
  )) {
    const espace = await findSpace(params.userId, spaceId);
    if (!espace) continue;
    const contenu = await contexteEspace(params.userId, spaceId);
    if (contenu)
      documents.push({ contenu, titre: `Espace « ${espace.name} »` });
  }
  for (const pageId of (params.conversation.contextPageIds ?? []).slice(
    0,
    DOCUMENTS_MAX
  )) {
    const page = await findPage(params.userId, pageId);
    if (!page) continue;
    documents.push({
      contenu: page.content.slice(0, 2000),
      titre: `Page « ${page.title} »`,
    });
  }
  // Les Wakies réglés sur le fil ne sont pas des documents : leur rôle est de
  // porter un rôle, pas un contenu. On ne rend que l'amorce de leur persona,
  // et uniquement ceux du compte — un ami public ne livre jamais ses
  // instructions, seulement sa bio publiée (`INTEGRATION.md` § Fiche).
  const wakiesRegles = (params.conversation.contextWakieIds ?? []).slice(
    0,
    DOCUMENTS_MAX
  );
  if (wakiesRegles.length > 0) {
    const annuaire = await listWakies(params.userId);
    for (const wakie of annuaire) {
      if (!wakiesRegles.includes(wakie.id)) continue;
      documents.push({
        contenu: (
          wakie.instructions ||
          wakie.publicPersona ||
          "(sans description)"
        ).slice(0, 1000),
        titre: `Wakie « ${wakie.name} » (consignes, lecture seule)`,
      });
    }
  }
  return bornerDocuments(documents);
}

/**
 * Budget de contexte : trois documents, huit mille caractères, quitte à en
 * laisser un dehors. Appliqué ICI et nulle part ailleurs — le prompt n'est pas
 * extensible à volonté, et un dépassement silencieux coûterait le tour entier.
 */
function bornerDocuments(
  documents: { contenu: string; titre: string }[]
): { contenu: string; titre: string }[] {
  let reste = DOCUMENTS_CARACTERES_MAX;
  const retenus: { contenu: string; titre: string }[] = [];
  for (const document of documents.slice(0, DOCUMENTS_MAX)) {
    if (reste <= 0) break;
    const contenu = document.contenu.slice(0, reste);
    reste -= contenu.length;
    retenus.push({ ...document, contenu });
  }
  return retenus;
}

/**
 * Ce qu'un `@@` écrit dans la conversation.
 *
 * Deux sortes de réglage durable :
 *
 *   - les CAPACITÉS (plugin, MCP, compétence, outil) vont dans les colonnes de
 *     sélection de `WakiesConversation`, déjà prévues pour ça. Comme `null` y
 *     veut dire « on replie sur le Wakie », écrire exige de MATÉRIALISER la
 *     liste effective du Wakie avant d'ajouter le jeton : sans ça, `@qdrant`
 *     réduirait le fil à ce seul serveur et ferait perdre au Wakie les siens ;
 *   - le CONTEXTE (pages, Espaces, Wakies) va dans les colonnes `context*Ids`
 *     ajoutées par la migration 0053.
 *
 * Un `@@` déjà réglé ne produit ni doublon ni note : reposter le même message
 * ne doit pas accumuler l'état.
 */
export async function appliquerMentionsPersistantes(params: {
  conversation: {
    contextPageIds?: string[] | null;
    contextSpaceIds?: string[] | null;
    contextWakieIds?: string[] | null;
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    toolIds?: string[] | null;
  };
  resolu: MentionResolue;
  wakie: {
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    toolIds?: string[] | null;
  };
}): Promise<{ notes: string[]; patch: Record<string, string[]> }> {
  const { resolu, wakie } = params;
  const notes: string[] = [];
  const patch: Record<string, string[]> = {};
  const fusion = (
    actuelle: string[] | null | undefined,
    repli: string[] | null | undefined,
    ajoute: string[]
  ): string[] | null => {
    if (ajoute.length === 0) return null;
    const base = actuelle ?? repli ?? [];
    const avant = new Set(base);
    const apres = [...new Set([...base, ...ajoute])];
    if (apres.length === avant.size) return null;
    return apres;
  };

  const outils = fusion(
    params.conversation.toolIds,
    wakie.toolIds,
    resolu.ids.toolIds
  );
  if (outils) patch.toolIds = outils;
  const plugins = fusion(
    params.conversation.pluginIds,
    wakie.pluginIds,
    resolu.ids.pluginIds
  );
  if (plugins) patch.pluginIds = plugins;
  const mcp = fusion(
    params.conversation.mcpServerIds,
    wakie.mcpServerIds,
    resolu.ids.mcpServerIds
  );
  if (mcp) patch.mcpServerIds = mcp;
  const competences = fusion(
    params.conversation.skillIds,
    wakie.skillIds,
    resolu.ids.skillIds
  );
  if (competences) patch.skillIds = competences;

  if (resolu.documents.length > 0) {
    const espaces = fusion(
      params.conversation.contextSpaceIds,
      [],
      resolu.idsEspaces ?? []
    );
    if (espaces) patch.contextSpaceIds = espaces;
    const pages = fusion(
      params.conversation.contextPageIds,
      [],
      resolu.idsPages ?? []
    );
    if (pages) patch.contextPageIds = pages;
  }
  const nommes = fusion(
    params.conversation.contextWakieIds,
    [],
    resolu.idsWakies ?? []
  );
  if (nommes) patch.contextWakieIds = nommes;

  if (Object.keys(patch).length > 0) {
    notes.push(
      "Réglé pour ce fil : ces mentions resteront actives aux tours suivants."
    );
  }
  return { notes, patch };
}
