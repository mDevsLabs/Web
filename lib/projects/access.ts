import "server-only";

import { type SQL, sql } from "drizzle-orm";
import {
  canManageInvites,
  canManageMembers,
  canManageProjectSettings,
  canViewProject,
  type ProjectRole,
  resolveProjectRole,
} from "@/lib/projects/permissions";

export type ProjectAccess = {
  project: {
    color: string | null;
    createdAt: Date;
    customInstructions: string | null;
    defaultModel: string | null;
    description: string | null;
    icon: string | null;
    id: string;
    isArchived: boolean;
    name: string;
    updatedAt: Date;
  };
  role: ProjectRole;
};

// Identité canonique : les champs userId historiques du dépôt mélangent
// users.id, email et username (cf. chatOwnerMatches, getPersistedTier). La
// table users fait foi : on résout les variantes (id + email + username) une
// seule fois, puis on filtre les tables de collaboration sur ces variantes.
// SQL natif paramétré (client.unsafe) : le paramètre ne peut pas altérer la
// requête, mêmes garanties que les tags template drizzle.
const IDENTITY_LOOKUP_SQL = `
  SELECT id::text AS id, email, username
  FROM users
  WHERE id::text = $1::text
     OR (email IS NOT NULL AND LOWER(email) = LOWER($1::text))
     OR (username IS NOT NULL AND LOWER(username) = LOWER($1::text))
  ORDER BY (id::text = $1::text) DESC
  LIMIT 1
`;

async function resolveUserIdentityVariants(params: {
  userEmail?: string | null;
  userId: string;
}): Promise<string[]> {
  const variants = new Set<string>();
  if (params.userId) {
    variants.add(params.userId);
  }
  if (params.userEmail) {
    variants.add(params.userEmail);
  }
  try {
    const { dbReady, getRawClient } = await import("@/lib/db/queries");
    await dbReady();
    const client = getRawClient();
    if (client) {
      const rows = (await client.unsafe(IDENTITY_LOOKUP_SQL, [
        params.userId,
      ])) as Array<{
        email: string | null;
        id: string | null;
        username: string | null;
      }>;
      const row = rows[0];
      if (row) {
        for (const value of [row.id, row.email, row.username]) {
          if (value) {
            variants.add(value);
          }
        }
      }
    }
  } catch {
    // Table users indisponible (tests, environnement dégradé) : les variantes
    // littérales fournies suffisent — la garde stricte est conservée.
  }
  return Array.from(variants).filter(Boolean);
}

// Les variantes d'identité sont insérées comme littéraux échappés ('](' n'est
// pas possible : apostrophes doublées) dans un ARRAY text[] comparé avec
// ANY(). Elles proviennent exclusivement de la table users et de la session
// serveur, jamais du client.
function buildTextArrayLiteral(variants: string[]): SQL {
  const list = variants.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
  return sql.raw(`ARRAY[${list}]::text[]`);
}

function buildOwnershipCondition(variants: string[]): SQL {
  const arr = buildTextArrayLiteral(variants);
  return sql`("Project"."userId"::text = ANY(${arr}) OR EXISTS (SELECT 1 FROM "ProjectMember" pm WHERE pm."projectId" = "Project"."id" AND pm."userId"::text = ANY(${arr})))`;
}

function buildMembershipCondition(variants: string[]): SQL {
  return sql`EXISTS (SELECT 1 FROM "ProjectMember" pm WHERE pm."projectId" = "Project"."id" AND pm."userId"::text = ANY(${buildTextArrayLiteral(variants)}))`;
}

/**
 * Accès complet à un projet : propriétaire (owner) ou membre (ProjectMember).
 * Une seule requête SQL, condition injectée avec les variantes d'identité
 * résolues — un utilisateur extérieur ne peut pas lire un projet en devinant
 * un projectId (le rôle est null → 404 côté routes).
 */
export async function getProjectAccess(params: {
  userEmail?: string | null;
  projectId: string;
  userId: string;
}): Promise<ProjectAccess | null> {
  if (!params.projectId) {
    return null;
  }
  const variants = await resolveUserIdentityVariants({
    userEmail: params.userEmail,
    userId: params.userId,
  });
  if (variants.length === 0) {
    return null;
  }
  try {
    const { getDb } = await import("@/lib/db/queries");
    const db = await getDb();
    const ownerArray = buildTextArrayLiteral(variants);
    const memberArray = buildTextArrayLiteral(variants);
    const rows = await db.execute(sql`
      SELECT "Project"."id"::text AS "id",
             "Project"."name" AS "name",
             "Project"."description" AS "description",
             "Project"."icon" AS "icon",
             "Project"."color" AS "color",
             "Project"."customInstructions" AS "customInstructions",
             "Project"."defaultModel" AS "defaultModel",
             "Project"."isArchived" AS "isArchived",
             "Project"."createdAt" AS "createdAt",
             "Project"."updatedAt" AS "updatedAt",
             ("Project"."userId"::text = ANY(${ownerArray})) AS "isOwner",
             (SELECT pm."role" FROM "ProjectMember" pm
               WHERE pm."projectId" = "Project"."id"
                 AND pm."userId"::text = ANY(${memberArray}))
               AS "memberRole"
      FROM "Project"
      WHERE "Project"."id" = ${params.projectId}::uuid
        AND ${buildOwnershipCondition(variants)}
      LIMIT 1
    `);
    const row =
      (rows as unknown as { rows?: unknown[] }).rows?.[0] ??
      (rows as unknown as unknown[])[0];
    if (!row || typeof row !== "object") {
      return null;
    }
    const r = row as Record<string, unknown>;
    const role = resolveProjectRole({
      isOwner: r.isOwner === true,
      membership: r.memberRole ? { role: r.memberRole as ProjectRole } : null,
    });
    if (!canViewProject(role)) {
      return null;
    }
    return {
      project: {
        color: (r.color as string) ?? null,
        createdAt: r.createdAt as Date,
        customInstructions: (r.customInstructions as string) ?? null,
        defaultModel: (r.defaultModel as string) ?? null,
        description: (r.description as string) ?? null,
        icon: (r.icon as string) ?? null,
        id: r.id as string,
        isArchived: r.isArchived === true,
        name: r.name as string,
        updatedAt: r.updatedAt as Date,
      },
      role: role as ProjectRole,
    };
  } catch {
    return null;
  }
}

export async function requireProjectAccess(params: {
  userEmail?: string | null;
  projectId: string;
  userId: string;
}): Promise<ProjectAccess> {
  const access = await getProjectAccess(params);
  if (!access) {
    throw new Error("project_not_found");
  }
  return access;
}

// Identifiants de tous les projets où l'utilisateur est owner ou membre.
// Utilisé pour agréger les conversations de l'espace (comptes, recherche) sans
// exposer de projet étranger.
export async function getAccessibleProjectIds(params: {
  userEmail?: string | null;
  userId: string;
}): Promise<string[]> {
  const variants = await resolveUserIdentityVariants({
    userEmail: params.userEmail,
    userId: params.userId,
  });
  if (variants.length === 0) {
    return [];
  }
  try {
    const { getDb } = await import("@/lib/db/queries");
    const db = await getDb();
    const arr = buildTextArrayLiteral(variants);
    const rows = await db.execute(sql`
      SELECT DISTINCT "Project"."id"::text AS "id"
      FROM "Project"
      WHERE "Project"."userId"::text = ANY(${arr})
         OR EXISTS (SELECT 1 FROM "ProjectMember" pm
            WHERE pm."projectId" = "Project"."id"
              AND pm."userId"::text = ANY(${arr}))
    `);
    const list =
      (rows as unknown as { rows?: Array<{ id: string }> }).rows ??
      (rows as unknown as Array<{ id: string }>) ??
      [];
    return list.map((r) => r.id);
  } catch {
    return [];
  }
}

export async function requireProjectOwner(params: {
  userEmail?: string | null;
  projectId: string;
  userId: string;
}): Promise<ProjectAccess> {
  const access = await requireProjectAccess(params);
  if (!canManageProjectSettings(access.role)) {
    throw new Error("project_forbidden");
  }
  return access;
}

// Garde pour les routes de gestion : owner uniquement (réglages, invitations,
// suppression). Retourne null quand le rôle ne suffit pas.
export function hasProjectManageAccess(access: ProjectAccess): boolean {
  return canManageProjectSettings(access.role);
}

export function hasMemberManagementAccess(access: ProjectAccess): boolean {
  return canManageMembers(access.role) && canManageInvites(access.role);
}

export type { ProjectRole } from "@/lib/projects/permissions";
