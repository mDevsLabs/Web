import { getMaiUser } from "@/lib/auth/session";
import { getMcpServersByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { type ExportFormat, formatExport } from "@/lib/export/formatters";

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "json") as ExportFormat;
  const servers = await getMcpServersByUserId({ userId });
  const rows = servers.map((s) => ({
    avgLatencyMs: (s as any).avgLatencyMs ?? 0,
    callCount: (s as any).callCount ?? 0,
    isEnabled: s.isEnabled ? "enabled" : "disabled",
    name: s.name,
    requireApproval: s.requireApproval,
    timeoutMs: (s as any).timeoutMs ?? 15_000,
    transport: s.transport,
    uptimeStatus: (s as any).uptimeStatus ?? "unknown",
    url: s.url ?? s.command ?? "",
  }));
  const cols = [
    "name",
    "transport",
    "url",
    "isEnabled",
    "requireApproval",
    "timeoutMs",
    "avgLatencyMs",
    "callCount",
    "uptimeStatus",
  ];
  const { content, mime, ext } = formatExport(
    rows as any,
    ["json", "csv", "md", "txt"].includes(format) ? format : "json",
    cols
  );
  return new Response(content, {
    headers: {
      "Content-Disposition": `attachment; filename="mcp-servers-${new Date().toISOString().slice(0, 10)}.${ext}"`,
      "Content-Type": mime,
    },
  });
}
