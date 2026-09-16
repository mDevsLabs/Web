import { getMaiUser } from "@/lib/auth/session";
import { getDocumentById } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  buildExportFilename,
  DOCUMENT_EXPORT_MIME,
  markdownToDocx,
  markdownToHtml,
} from "@/lib/export/document-export";

const ALLOWED_FORMATS = ["html", "md", "docx"] as const;
type ExportFormat = (typeof ALLOWED_FORMATS)[number];

/**
 * Export d'un Artifact textuel en Markdown, HTML ou DOCX.
 *
 * Sécurité : la route vérifie la session MAI ET la propriété du document
 * (comme GET /api/document) — aucun export croisé entre comptes.
 *
 * DOCX : import dynamique de `docx` uniquement sur ce chemin (pur JS,
 * runtime Node ; compatible Vercel, aucune dépendance native).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const formatParam = searchParams.get("format") ?? "md";

  if (!id) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  const format = ALLOWED_FORMATS.find((f) => f === formatParam) as
    | ExportFormat
    | undefined;
  if (!format) {
    return new ChatbotError(
      "bad_request:api",
      `Invalid format. Allowed: ${ALLOWED_FORMATS.join(", ")}.`
    ).toResponse();
  }

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return new ChatbotError("unauthorized:document").toResponse();
  }

  const doc = await getDocumentById({ id });
  if (!doc) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const userId = maiUser.id || maiUser.email;
  if (doc.userId !== userId && doc.userId !== maiUser.email) {
    return new ChatbotError("forbidden:document").toResponse();
  }

  const content = doc.content ?? "";
  const title = doc.title;

  if (format === "md") {
    return new Response(content, {
      headers: {
        "Content-Disposition": `attachment; filename="${buildExportFilename(title, "md")}"`,
        "Content-Type": DOCUMENT_EXPORT_MIME.md,
      },
      status: 200,
    });
  }

  if (format === "html") {
    const html = markdownToHtml(content, title);
    return new Response(html, {
      headers: {
        "Content-Disposition": `attachment; filename="${buildExportFilename(title, "html")}"`,
        "Content-Type": DOCUMENT_EXPORT_MIME.html,
      },
      status: 200,
    });
  }

  // DOCX : seulement si le contenu s'y prête (documents textuels).
  if (doc.kind !== "text") {
    return new ChatbotError(
      "bad_request:api",
      "DOCX export is only available for text artifacts."
    ).toResponse();
  }

  const bytes = await markdownToDocx(content, title);
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Disposition": `attachment; filename="${buildExportFilename(title, "docx")}"`,
      "Content-Type": DOCUMENT_EXPORT_MIME.docx,
    },
    status: 200,
  });
}
