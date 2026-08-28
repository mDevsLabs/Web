import { getMaiUser } from "@/lib/auth/session";
import { getFilteredMcpLogs } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { formatExport, type ExportFormat } from "@/lib/export/formatters";

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "json") as ExportFormat;
  const serverId = searchParams.get("serverId") ?? undefined;
  const toolName = searchParams.get("toolName") ?? undefined;
  const actionType = searchParams.get("actionType") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const logs = await getFilteredMcpLogs({ actionType, limit, serverId, toolName, userId });
  const rows = logs.map((l) => ({
    actionType: l.actionType,
    approvalStatus: l.approvalStatus,
    chatId: l.chatId ?? "",
    createdAt: new Date(l.createdAt as any).toISOString(),
    durationMs: l.durationMs ?? 0,
    error: l.error ?? "",
    serverName: l.serverName,
    toolName: l.toolName,
  }));
  const cols = ["createdAt","serverName","toolName","actionType","approvalStatus","durationMs","error","chatId"];
  const { content, mime, ext } = formatExport(rows as any, ["json","csv","md","txt"].includes(format) ? format : "json", cols);
  return new Response(content, {
    headers: {
      "Content-Disposition": `attachment; filename="mcp-logs-${new Date().toISOString().slice(0,10)}.${ext}"`,
      "Content-Type": mime,
    },
  });
}
