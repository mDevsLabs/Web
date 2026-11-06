import "server-only";

import { and, desc, eq, inArray, ne, or, type SQL, sql } from "drizzle-orm";
import { hashContent } from "@/lib/artifacts/hash";
import type { DocumentPatch } from "@/lib/artifacts/patch";
import {
  PAGE_CONTENT_MAX,
  PAGE_LIST_LIMIT,
  PAGE_MESSAGE_KEEP,
  PAGE_REVISION_KEEP,
  pageContentTooLong,
} from "@/lib/pages/limits";
import { decideRevision } from "@/lib/pages/revision";
import {
  page,
  pageMessage,
  pageProposal,
  pageRevision,
  project,
} from "../schema";
import { dbReady } from "./connection";

export class PageRevisionConflict extends Error {
  constructor() {
    super("La page a été modifiée entre-temps.");
    this.name = "PageRevisionConflict";
  }
}

export class PageContentTooLong extends Error {
  constructor() {
    super(
      `Le contenu dépasse ${PAGE_CONTENT_MAX.toLocaleString("fr-FR")} caractères.`
    );
    this.name = "PageContentTooLong";
  }
}

type SnapshotSource = "assistant" | "manual" | "restore";

function assertContent(content: string) {
  if (pageContentTooLong(content)) {
    throw new PageContentTooLong();
  }
}

type PageTransaction = Parameters<
  Parameters<Awaited<ReturnType<typeof dbReady>>["transaction"]>[0]
>[0];

async function trimRevisions(tx: PageTransaction, pageId: string) {
  const extras = await tx
    .select({ id: pageRevision.id })
    .from(pageRevision)
    .where(eq(pageRevision.pageId, pageId))
    .orderBy(desc(pageRevision.createdAt))
    .offset(PAGE_REVISION_KEEP);
  if (extras.length === 0) {
    return;
  }
  await tx.delete(pageRevision).where(
    inArray(
      pageRevision.id,
      extras.map((row) => row.id)
    )
  );
}

export async function countPagesByOwner(ownerIds: string[]) {
  if (ownerIds.length === 0) {
    return 0;
  }
  const db = await dbReady();
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(page)
    .where(inArray(page.userId, ownerIds));
  return Number(row?.value ?? 0);
}

export async function listPages(params: {
  ownerIds: string[];
  projectId?: string;
  query?: string;
  scope: "owned" | "project" | "unassigned";
}) {
  const db = await dbReady();
  const filters: SQL[] = [];
  if (params.scope === "project" && params.projectId) {
    filters.push(eq(page.projectId, params.projectId));
  } else if (params.scope === "unassigned") {
    filters.push(inArray(page.userId, params.ownerIds));
    filters.push(sql`${page.projectId} IS NULL`);
  } else {
    filters.push(inArray(page.userId, params.ownerIds));
  }
  const query = params.query?.trim();
  if (query) {
    const pattern = `%${query.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
    const match = or(
      sql`${page.title} ILIKE ${pattern} ESCAPE '\\'`,
      sql`${page.content} ILIKE ${pattern} ESCAPE '\\'`
    );
    if (match) {
      filters.push(match);
    }
  }
  return db
    .select({
      contentPreview: sql<string>`left(${page.content}, 240)`.as(
        "contentPreview"
      ),
      id: page.id,
      projectId: page.projectId,
      projectName: project.name,
      revision: page.revision,
      title: page.title,
      updatedAt: page.updatedAt,
      userId: page.userId,
    })
    .from(page)
    .leftJoin(project, eq(page.projectId, project.id))
    .where(and(...filters))
    .orderBy(desc(page.updatedAt))
    .limit(PAGE_LIST_LIMIT);
}

export async function getPageById(id: string) {
  const db = await dbReady();
  const [row] = await db.select().from(page).where(eq(page.id, id)).limit(1);
  return row ?? null;
}

export async function createPage(params: {
  content?: string;
  customPrompt?: string | null;
  modelId?: string | null;
  projectId?: string | null;
  title?: string;
  userId: string;
}) {
  const content = params.content ?? "";
  assertContent(content);
  const db = await dbReady();
  const [created] = await db
    .insert(page)
    .values({
      content,
      customPrompt: params.customPrompt ?? null,
      modelId: params.modelId ?? null,
      projectId: params.projectId ?? null,
      title: params.title?.trim() || "Sans titre",
      userId: params.userId,
    })
    .returning();
  return created;
}

export async function deletePage(params: { id: string; userId: string }) {
  const db = await dbReady();
  const [removed] = await db
    .delete(page)
    .where(and(eq(page.id, params.id), eq(page.userId, params.userId)))
    .returning({ id: page.id });
  return Boolean(removed);
}

export async function updatePageMeta(params: {
  customPrompt?: string | null;
  id: string;
  modelId?: string | null;
  projectId?: string | null;
  userId: string;
}) {
  const db = await dbReady();
  const patch: {
    customPrompt?: string | null;
    modelId?: string | null;
    projectId?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (params.customPrompt !== undefined) {
    patch.customPrompt = params.customPrompt;
  }
  if (params.modelId !== undefined) {
    patch.modelId = params.modelId;
  }
  if (params.projectId !== undefined) {
    patch.projectId = params.projectId;
  }
  const [updated] = await db
    .update(page)
    .set(patch)
    .where(and(eq(page.id, params.id), eq(page.userId, params.userId)))
    .returning();
  return updated ?? null;
}

/** Détache sans exiger d'être l'auteur : le contrôle d'accès est en amont. */
export async function detachPage(id: string) {
  const db = await dbReady();
  const [updated] = await db
    .update(page)
    .set({ projectId: null, updatedAt: new Date() })
    .where(eq(page.id, id))
    .returning();
  return updated ?? null;
}

export async function updatePageContent(params: {
  content?: string;
  createdBy: string;
  expectedRevision: number;
  pageId: string;
  snapshot?: SnapshotSource | null;
  title?: string;
  userId: string;
}) {
  const db = await dbReady();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(page)
      .where(and(eq(page.id, params.pageId), eq(page.userId, params.userId)))
      .limit(1);
    if (!current) {
      return null;
    }
    const decision = decideRevision(current.revision, params.expectedRevision);
    if (!decision.ok) {
      throw new PageRevisionConflict();
    }
    const nextContent = params.content ?? current.content;
    const nextTitle = params.title?.trim() || current.title;
    assertContent(nextContent);
    if (params.snapshot) {
      await tx.insert(pageRevision).values({
        content: current.content,
        createdBy: params.createdBy,
        pageId: current.id,
        source: params.snapshot,
        title: current.title,
      });
      await trimRevisions(tx, current.id);
    }
    const [updated] = await tx
      .update(page)
      .set({
        content: nextContent,
        revision: decision.next,
        title: nextTitle,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(page.id, params.pageId),
          eq(page.userId, params.userId),
          eq(page.revision, params.expectedRevision)
        )
      )
      .returning();
    if (!updated) {
      throw new PageRevisionConflict();
    }
    return updated;
  });
}

export async function snapshotPage(params: {
  createdBy: string;
  pageId: string;
  source: SnapshotSource;
  userId: string;
}) {
  const db = await dbReady();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(page)
      .where(and(eq(page.id, params.pageId), eq(page.userId, params.userId)))
      .limit(1);
    if (!current) {
      return null;
    }
    const [saved] = await tx
      .insert(pageRevision)
      .values({
        content: current.content,
        createdBy: params.createdBy,
        pageId: current.id,
        source: params.source,
        title: current.title,
      })
      .returning();
    await trimRevisions(tx, current.id);
    return saved ?? null;
  });
}

export async function listPageRevisions(pageId: string) {
  const db = await dbReady();
  return db
    .select({
      createdAt: pageRevision.createdAt,
      id: pageRevision.id,
      source: pageRevision.source,
      title: pageRevision.title,
    })
    .from(pageRevision)
    .where(eq(pageRevision.pageId, pageId))
    .orderBy(desc(pageRevision.createdAt))
    .limit(PAGE_REVISION_KEEP);
}

export async function getPageRevision(params: { id: string; pageId: string }) {
  const db = await dbReady();
  const [row] = await db
    .select()
    .from(pageRevision)
    .where(
      and(
        eq(pageRevision.id, params.id),
        eq(pageRevision.pageId, params.pageId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listPageMessages(pageId: string) {
  const db = await dbReady();
  const rows = await db
    .select()
    .from(pageMessage)
    .where(eq(pageMessage.pageId, pageId))
    .orderBy(desc(pageMessage.createdAt))
    .limit(PAGE_MESSAGE_KEEP);
  return rows.reverse();
}

export async function replacePageMessages(params: {
  messages: Array<{
    id: string;
    parts: unknown;
    role: "assistant" | "system" | "user";
  }>;
  pageId: string;
  userId: string;
}) {
  const db = await dbReady();
  const kept = params.messages.slice(-PAGE_MESSAGE_KEEP);
  const base = Date.now();
  await db.transaction(async (tx) => {
    await tx.delete(pageMessage).where(eq(pageMessage.pageId, params.pageId));
    if (kept.length === 0) {
      return;
    }
    await tx.insert(pageMessage).values(
      kept.map((message, index) => ({
        createdAt: new Date(base + index),
        id: message.id,
        pageId: params.pageId,
        parts: message.parts,
        role: message.role,
        userId: params.userId,
      }))
    );
  });
}

export async function expireStaleProposals(pageId: string, content: string) {
  const db = await dbReady();
  const current = hashContent(content);
  await db
    .update(pageProposal)
    .set({ resolvedAt: new Date(), status: "stale" })
    .where(
      and(
        eq(pageProposal.pageId, pageId),
        eq(pageProposal.status, "pending"),
        ne(pageProposal.baseHash, current)
      )
    );
}

export async function listPendingProposals(pageId: string) {
  const db = await dbReady();
  return db
    .select()
    .from(pageProposal)
    .where(
      and(eq(pageProposal.pageId, pageId), eq(pageProposal.status, "pending"))
    )
    .orderBy(desc(pageProposal.createdAt));
}

export async function createPageProposal(params: {
  baseHash: string;
  description?: string | null;
  ops: DocumentPatch["ops"];
  pageId: string;
  userId: string;
}) {
  const db = await dbReady();
  const [created] = await db
    .insert(pageProposal)
    .values({
      baseHash: params.baseHash,
      description: params.description ?? null,
      ops: params.ops,
      pageId: params.pageId,
      userId: params.userId,
    })
    .returning();
  return created;
}

export async function getPageProposal(params: { id: string; pageId: string }) {
  const db = await dbReady();
  const [row] = await db
    .select()
    .from(pageProposal)
    .where(
      and(
        eq(pageProposal.id, params.id),
        eq(pageProposal.pageId, params.pageId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function resolvePageProposal(params: {
  id: string;
  status: "accepted" | "rejected" | "stale";
}) {
  const db = await dbReady();
  await db
    .update(pageProposal)
    .set({ resolvedAt: new Date(), status: params.status })
    .where(eq(pageProposal.id, params.id));
}
