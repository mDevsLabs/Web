// Matrice d'accès des pages — pure, sans base.
//
// Une page appartient à son auteur. Le projet n'est qu'un classement : un
// membre voit le texte, le propriétaire du projet peut détacher, personne
// d'autre n'écrit. Le fil mAI et le prompt de page restent à l'auteur.

import type { ProjectRole } from "@/lib/projects/permissions";
import { canAddChatToProject } from "@/lib/projects/permissions";

export type PageRole = "author" | "viewer";

export function canViewPage(role: PageRole | null): boolean {
  return role === "author" || role === "viewer";
}

export function canEditPage(role: PageRole | null): boolean {
  return role === "author";
}

export function canDeletePage(role: PageRole | null): boolean {
  return role === "author";
}

export function canExportPage(role: PageRole | null): boolean {
  return role === "author";
}

export function canUsePageAssistant(role: PageRole | null): boolean {
  return role === "author";
}

export function canReadPagePrompt(role: PageRole | null): boolean {
  return role === "author";
}

/** Détacher : l'auteur, ou le propriétaire du projet qui la contient. */
export function canDetachPage(params: {
  hasProject: boolean;
  pageRole: PageRole | null;
  projectRole: ProjectRole | null;
}): boolean {
  if (!params.hasProject) {
    return false;
  }
  if (params.pageRole === "author") {
    return true;
  }
  return params.projectRole === "owner";
}

/** Rattacher : l'auteur, vers un projet où il peut déjà contribuer. */
export function canAttachPage(params: {
  isAuthor: boolean;
  projectRole: ProjectRole | null;
}): boolean {
  return params.isAuthor && canAddChatToProject(params.projectRole);
}
