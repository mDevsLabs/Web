import { errorResponse } from "@/lib/api/error-response";
import {
  buildExportFilename,
  DOCUMENT_EXPORT_MIME,
  markdownToDocx,
  markdownToHtml,
  markdownToPdf,
  markdownToText,
} from "@/lib/export/document-export";
import { getPageAccess } from "@/lib/pages/access";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { canExportPage } from "@/lib/pages/permissions";

const FORMATS = ["md", "txt", "html", "docx", "pdf"] as const;
type Format = (typeof FORMATS)[number];

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const { id } = await params;
    const formatParam = new URL(request.url).searchParams.get("format") ?? "md";
    const format = FORMATS.find((item) => item === formatParam) as
      | Format
      | undefined;
    if (!format) {
      return errorResponse("invalid_request", {
        message: "Format d'export inconnu.",
      });
    }
    const access = await getPageAccess({
      pageId: id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!access || !canExportPage(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const title = access.page.title;
    const markdown = access.page.content;
    const extension =
      format === "txt" ? "txt" : format === "md" ? "md" : format;
    const filename = buildExportFilename(title, extension);
    const headers = {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": DOCUMENT_EXPORT_MIME[format],
    };
    if (format === "md") {
      return new Response(markdown, { headers });
    }
    if (format === "txt") {
      return new Response(markdownToText(markdown), { headers });
    }
    if (format === "html") {
      return new Response(markdownToHtml(markdown, title), { headers });
    }
    const bytes =
      format === "docx"
        ? await markdownToDocx(markdown, title)
        : await markdownToPdf(markdown, title);
    return new Response(Buffer.from(bytes), { headers });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
