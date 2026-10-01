import { getMaiUser } from "@/lib/auth/session";
import { getMcpServersByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { type ExportFormat, formatExport } from "@/lib/export/formatters";
import { toMcpServerDto } from "@/lib/mcp/dto";

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "json") as ExportFormat;
  const servers = await getMcpServersByUserId({ userId });
  const rows = servers.map((s) => {
    const safe = toMcpServerDto(s);
    return {
      avgLatencyMs: safe.avgLatencyMs,
      callCount: safe.callCount,
      isEnabled: safe.isEnabled ? "enabled" : "disabled",
      name: safe.name,
      requireApproval: safe.requireApproval,
      timeoutMs: safe.timeoutMs,
      transport: safe.transport,
      uptimeStatus: safe.uptimeStatus,
      // Les identifiants et paramètres de requête ressemblant à un secret
      // sont retirés ; la commande stdio passe aussi par le DTO redacted.
      url: safe.url ?? safe.command ?? "",
    };
  });
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
