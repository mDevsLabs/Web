import { getMaiUser } from "@/lib/auth/session";
import { getSkillsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { formatExport, type ExportFormat } from "@/lib/export/formatters";

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "json") as ExportFormat;
  const skills = await getSkillsByUserId({ userId });
  const rows = skills.map((s) => ({
    color: (s as any).color ?? "",
    description: s.description ?? "",
    mcpServerIds: Array.isArray((s as any).mcpServerIds) ? (s as any).mcpServerIds.join(";") : "",
    name: s.name,
    pinned: s.pinned ? "pinned" : "",
    tags: Array.isArray(s.tags) ? s.tags.join(";") : "",
    tools: Array.isArray(s.tools) ? (s.tools as string[]).join(";") : "",
  }));
  const cols = ["name","description","color","tools","mcpServerIds","tags","pinned"];
  const { content, mime, ext } = formatExport(rows as any, ["json","csv","md","txt"].includes(format) ? format : "json", cols);
  return new Response(content, {
    headers: {
      "Content-Disposition": `attachment; filename="skills-${new Date().toISOString().slice(0,10)}.${ext}"`,
      "Content-Type": mime,
    },
  });
}
