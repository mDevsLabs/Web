import "server-only";

import { tierMeetsMinimum } from "@/lib/auth/plan";
import {
  createSkill,
  deleteSkill,
  getMcpServersByUserId,
  getSkillByTemplateId,
} from "@/lib/db/queries";
import { getSkillTemplate } from "./catalog";
import type { SkillTemplateManifest } from "./types";

// Installation d'un modèle de Skill — implémentation unique partagée par
// `/api/skills/templates` (page /skills) et `/api/skills/templates/install`
// (page Applications → Skills).
//
// Garanties :
//   • forfait : le `minTier` du modèle est réellement appliqué côté serveur ;
//   • idempotence : un seul skill par (utilisateur, modèle), matérialisée par
//     l'index unique partiel de la migration 0019 ;
//   • persistance vérifiée : la ligne créée est relue avant de répondre ;
//   • MCP : les serveurs cités par le modèle sont résolus vers les serveurs
//     réellement installés par l'utilisateur (jamais un identifiant inventé) ;
//   • réversibilité : `uninstallSkillTemplate` supprime le skill, et réussit
//     même s'il n'existe pas (aucune erreur si l'état est déjà atteint).

export type SkillTemplateFailureCode =
  | "access_denied"
  | "conflict"
  | "internal_error"
  | "not_found"
  | "plan_required";

export type SkillTemplateInstallFailure = {
  code: SkillTemplateFailureCode;
  message: string;
  ok: false;
};

export type InstalledSkill = Awaited<ReturnType<typeof createSkill>>;

export type SkillTemplateInstallSuccess = {
  ok: true;
  /** Un skill existant correspondait déjà : rien n'a été dupliqué. */
  alreadyInstalled: boolean;
  message: string;
  skill: InstalledSkill;
  template: SkillTemplateManifest;
  /** Serveurs MCP installés rattachés au skill. */
  linkedMcpServerNames: string[];
  /** Serveurs MCP cités par le modèle mais absents de la bibliothèque. */
  unresolvedMcpServerNames: string[];
};

export type SkillTemplateInstallResult =
  | SkillTemplateInstallSuccess
  | SkillTemplateInstallFailure;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

// Résout les noms de serveurs MCP déclarés par un modèle vers les serveurs
// réellement installés par l'utilisateur (correspondance insensible à la casse).
export function resolveMcpServerIds(
  template: SkillTemplateManifest,
  servers: ReadonlyArray<{ id: string; name: string }>
): { ids: string[]; linked: string[]; unresolved: string[] } {
  const byName = new Map(servers.map((s) => [s.name.toLowerCase(), s]));
  const ids: string[] = [];
  const linked: string[] = [];
  const unresolved: string[] = [];
  for (const requested of template.mcpServerNames) {
    const match = byName.get(requested.toLowerCase());
    if (match) {
      ids.push(match.id);
      linked.push(match.name);
    } else {
      unresolved.push(requested);
    }
  }
  return { ids, linked, unresolved };
}

export async function installSkillTemplate(params: {
  templateId: string;
  tier: string | null | undefined;
  userId: string;
}): Promise<SkillTemplateInstallResult> {
  const template = getSkillTemplate(params.templateId);
  if (!template) {
    return {
      code: "not_found",
      message: "Modèle de skill introuvable.",
      ok: false,
    };
  }

  if (!tierMeetsMinimum(params.tier, template.minTier)) {
    return {
      code: "plan_required",
      message: `Ce modèle de skill nécessite le forfait ${template.minTier}.`,
      ok: false,
    };
  }

  const existing = await getSkillByTemplateId({
    templateId: template.id,
    userId: params.userId,
  });
  if (existing) {
    return {
      alreadyInstalled: true,
      linkedMcpServerNames: [],
      message: `Le skill « ${existing.name} » est déjà installé.`,
      ok: true,
      skill: existing,
      template,
      unresolvedMcpServerNames: [],
    };
  }

  const servers = await getMcpServersByUserId({ userId: params.userId }).catch(
    () => []
  );
  const resolved = resolveMcpServerIds(
    template,
    servers.map((server) => ({ id: server.id, name: server.name }))
  );
  if (template.strictMcp && resolved.unresolved.length > 0) {
    return {
      code: "conflict",
      message: `Connectez d'abord le serveur MCP ${resolved.unresolved.join(", ")} avant d'installer ce skill.`,
      ok: false,
    };
  }

  let created: InstalledSkill;
  try {
    created = await createSkill({
      color: template.color,
      description: template.description,
      icon: template.icon.name.toLowerCase(),
      instructions: template.instructions,
      mcpServerIds: resolved.ids,
      name: template.name,
      parameters: template.parameters,
      tags: template.tags,
      templateId: template.id,
      tools: template.tools,
      userId: params.userId,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const concurrent = await getSkillByTemplateId({
        templateId: template.id,
        userId: params.userId,
      });
      if (concurrent) {
        return {
          alreadyInstalled: true,
          linkedMcpServerNames: [],
          message: `Le skill « ${concurrent.name} » est déjà installé.`,
          ok: true,
          skill: concurrent,
          template,
          unresolvedMcpServerNames: [],
        };
      }
    }
    return {
      code: "internal_error",
      message: "L'installation du skill a échoué. Réessayez dans un instant.",
      ok: false,
    };
  }

  // Vérification côté serveur : le skill doit être réellement présent en base
  // et rattaché au modèle demandé avant d'annoncer un succès au client.
  const persisted = await getSkillByTemplateId({
    templateId: template.id,
    userId: params.userId,
  });
  if (!persisted || persisted.id !== created.id) {
    return {
      code: "internal_error",
      message:
        "L'installation n'a pas pu être vérifiée en base. Aucun skill n'a été conservé.",
      ok: false,
    };
  }

  const suffix =
    resolved.unresolved.length > 0
      ? ` Connectez d'abord ${
          resolved.unresolved.length > 1 ? "les serveurs MCP" : "le serveur MCP"
        } ${resolved.unresolved.join(", ")} pour en bénéficier pleinement.`
      : "";

  return {
    alreadyInstalled: false,
    linkedMcpServerNames: resolved.linked,
    message: `Skill « ${template.name} » installé.${suffix}`,
    ok: true,
    skill: created,
    template,
    unresolvedMcpServerNames: resolved.unresolved,
  };
}

export type SkillTemplateUninstallResult =
  | { ok: true; removed: boolean; message: string }
  | SkillTemplateInstallFailure;

export async function uninstallSkillTemplate(params: {
  templateId: string;
  userId: string;
}): Promise<SkillTemplateUninstallResult> {
  const existing = await getSkillByTemplateId({
    templateId: params.templateId,
    userId: params.userId,
  });
  if (!existing) {
    return {
      message: "Ce skill n'est pas installé.",
      ok: true,
      removed: false,
    };
  }
  const deleted = await deleteSkill({ id: existing.id, userId: params.userId });
  if (!deleted) {
    return {
      code: "internal_error",
      message: "La désinstallation a échoué. Réessayez dans un instant.",
      ok: false,
    };
  }
  return {
    message: `Skill « ${deleted.name} » désinstallé.`,
    ok: true,
    removed: true,
  };
}
