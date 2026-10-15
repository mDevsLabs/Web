import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { _rawClient, dbReady, getDb, getRawClient } from "./connection";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  type DocumentProposal,
  document,
  documentProposal,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  message,
  pluginInstallation,
  project,
  projectFile,
  projectInvite,
  projectMember,
  type ScheduledMessage,
  type Skill,
  type Suggestion,
  scheduledMessage,
  skill,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  toolExecution,
  userMcpPrefs,
  userMemory,
  vote,
} from "../schema";
import { ChatbotError } from "@/lib/errors";

import type { ArtifactKind } from "@/components/chat/artifact";
import { getProjectById } from "./projects";

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .insert(document)
      .values({ content, createdAt: new Date(), id, kind, title, userId })
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const db = await dbReady();
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const [latest] = docs;
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document introuvable");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));
    return selectedDocument;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Rattache (ou retire) un livrable à un projet. Le filtrage par userId est
// appliqué ici : un livrable d'un autre utilisateur ne peut jamais être
// rattaché à un projet, même si l'identifiant est deviné.
export async function attachDocumentToProject({
  documentId,
  projectId,
  userId,
}: {
  documentId: string;
  projectId: string | null;
  userId: string;
}) {
  try {
    const db = await dbReady();
    const rows = await db
      .update(document)
      .set({ projectId })
      .where(and(eq(document.id, documentId), eq(document.userId, userId)))
      .returning();
    return rows.at(-1) ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentsByProject({
  projectId,
}: {
  projectId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(document)
      .where(eq(document.projectId, projectId))
      .orderBy(desc(document.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const db = await dbReady();
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    const db = await dbReady();
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// ------------------------------------------------------------------
// Propositions de modifications ciblées (DocumentProposal).
// Toutes les lectures/écritures filtrent par userId : un utilisateur ne peut
// jamais voir ni résoudre les propositions d'un autre compte.
// ------------------------------------------------------------------

export async function saveDocumentProposal({
  id,
  documentId,
  userId,
  chatId,
  ops,
  baseHash,
  description,
}: {
  id: string;
  documentId: string;
  userId: string;
  chatId: string | null;
  ops: unknown;
  baseHash: string;
  description: string | null;
}): Promise<DocumentProposal> {
  try {
    const db = await dbReady();
    const [row] = await db
      .insert(documentProposal)
      .values({ baseHash, chatId, description, documentId, id, ops, userId })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentProposalById({
  id,
}: {
  id: string;
}): Promise<DocumentProposal | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(documentProposal)
      .where(eq(documentProposal.id, id))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getPendingProposalsByDocumentId({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}): Promise<DocumentProposal[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(documentProposal)
      .where(
        and(
          eq(documentProposal.documentId, documentId),
          eq(documentProposal.userId, userId),
          eq(documentProposal.status, "pending")
        )
      )
      .orderBy(desc(documentProposal.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function resolveDocumentProposal({
  id,
  status,
}: {
  id: string;
  status: "accepted" | "rejected" | "stale";
}): Promise<DocumentProposal | null> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(documentProposal)
      .set({ resolvedAt: new Date(), status })
      .where(eq(documentProposal.id, id))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
