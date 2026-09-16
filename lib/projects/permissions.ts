// Logique de permissions des Projets partagés — PURE, sans accès base.
// Toute la matrice de rôles (owner / member / extérieur) et la validation des
// invitations vivent ici pour être testables unitairement (voir
// tests/unit/project-permissions.test.ts). La couche d'accès aux données
// (lib/projects/access.ts) résout le rôle puis délègue les décisions à ces
// fonctions : masquer un bouton côté client n'est jamais un contrôle d'accès.

export type ProjectRole = "owner" | "member";

export type ProjectMembership = {
  role: ProjectRole;
} | null;

export function resolveProjectRole(params: {
  isOwner: boolean;
  membership: ProjectMembership;
}): ProjectRole | null {
  if (params.isOwner) {
    return "owner";
  }
  return params.membership?.role ?? null;
}

export function canViewProject(role: ProjectRole | null): boolean {
  return role === "owner" || role === "member";
}

// Réglages (nom, description, instructions, modèle par défaut, icône, couleur,
// archive) : propriétaire uniquement. Les membres contribuent (conversations,
// fichiers) mais ne réécrivent pas le cadre de travail.
export function canManageProjectSettings(role: ProjectRole | null): boolean {
  return role === "owner";
}

export function canDeleteProject(role: ProjectRole | null): boolean {
  return role === "owner";
}

export function canManageMembers(role: ProjectRole | null): boolean {
  return role === "owner";
}

export function canManageInvites(role: ProjectRole | null): boolean {
  return role === "owner";
}

// Un membre peut ajouter ses propres conversations au projet partagé.
export function canAddChatToProject(role: ProjectRole | null): boolean {
  return role === "owner" || role === "member";
}

export function canUploadProjectFile(role: ProjectRole | null): boolean {
  return role === "owner" || role === "member";
}

// Un fichier projet peut être supprimé par son auteur ou par le propriétaire.
export function canDeleteProjectFile(params: {
  role: ProjectRole | null;
  fileUploadedBy: string | null | undefined;
  userId: string;
}): boolean {
  if (params.role === "owner") {
    return true;
  }
  if (params.role === "member") {
    return Boolean(params.fileUploadedBy) && params.fileUploadedBy === params.userId;
  }
  return false;
}

export type InviteLike = {
  code: string;
  expiresAt: Date | null | undefined;
  maxUses: number | null | undefined;
  useCount: number | null | undefined;
  revokedAt: Date | null | undefined;
};

export type InviteCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason: "revoked" | "expired" | "exhausted";
    };

// Validation d'une invitation : révoquée > expirée > quota épuisé. Une
// invitation invalide, expirée ou révoquée ne doit jamais rejoindre un projet
// (testée : « invitation invalide ou expirée »).
export function checkInviteUsability(
  invite: InviteLike | null | undefined,
  now: Date = new Date()
): InviteCheckResult {
  if (!invite) {
    return { ok: false, reason: "revoked" };
  }
  if (invite.revokedAt) {
    return { ok: false, reason: "revoked" };
  }
  if (invite.expiresAt && invite.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  if (
    typeof invite.maxUses === "number" &&
    invite.maxUses > 0 &&
    (invite.useCount ?? 0) >= invite.maxUses
  ) {
    return { ok: false, reason: "exhausted" };
  }
  return { ok: true };
}
