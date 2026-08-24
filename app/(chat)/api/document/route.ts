import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import type { ArtifactKind } from "@/components/chat/artifact";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
  updateDocumentContent,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const documentSchema = z.object({
  content: z.string(),
  isManualEdit: z.boolean().optional(),
  kind: z.enum(["text", "code", "image", "sheet", "html"]),
  title: z.string(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter id is missing"
    ).toResponse();
  }

  const maiUser = await getMaiUser();

  if (!maiUser) {
    return new ChatbotError("unauthorized:document").toResponse();
  }

  const documents = await getDocumentsById({ id });
  const [doc] = documents;

  if (!doc) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const userId = maiUser.id || maiUser.email;
  if (doc.userId !== userId && doc.userId !== maiUser.email) {
    return new ChatbotError("forbidden:document").toResponse();
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  const maiUser = await getMaiUser();

  if (!maiUser) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const userId = maiUser.id || maiUser.email;

  let content: string;
  let title: string;
  let kind: ArtifactKind;
  let isManualEdit: boolean | undefined;

  try {
    ({ content, isManualEdit, kind, title } = documentSchema.parse(
      await request.json()
    ));
  } catch {
    return new ChatbotError(
      "bad_request:api",
      "Invalid request body."
    ).toResponse();
  }

  const documents = await getDocumentsById({ id });

  if (documents.length > 0) {
    const [doc] = documents;

    if (doc.userId !== userId && doc.userId !== maiUser.email) {
      return new ChatbotError("forbidden:document").toResponse();
    }
  }

  if (isManualEdit && documents.length > 0) {
    const result = await updateDocumentContent({ content, id });
    return Response.json(result, { status: 200 });
  }

  const savedDoc = await saveDocument({
    content,
    id,
    kind,
    title,
    userId,
  });

  return Response.json(savedDoc, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const timestamp = searchParams.get("timestamp");

  if (!id) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  if (!timestamp) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter timestamp is required."
    ).toResponse();
  }

  const maiUser = await getMaiUser();

  if (!maiUser) {
    return new ChatbotError("unauthorized:document").toResponse();
  }

  const userId = maiUser.id || maiUser.email;

  const documents = await getDocumentsById({ id });
  const [doc] = documents;

  if (doc && doc.userId !== userId && doc.userId !== maiUser.email) {
    return new ChatbotError("forbidden:document").toResponse();
  }

  const parsedTimestamp = new Date(timestamp);

  if (Number.isNaN(parsedTimestamp.getTime())) {
    return new ChatbotError(
      "bad_request:api",
      "Invalid timestamp."
    ).toResponse();
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: parsedTimestamp,
  });

  return Response.json(documentsDeleted, { status: 200 });
}
