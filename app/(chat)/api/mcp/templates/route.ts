import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import { getMcpTemplateById, getMcpTemplates } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }

  const templates = await getMcpTemplates();
  return Response.json({ templates });
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  const json = await request.json().catch(() => ({}));
  const parsed = z.object({ templateId: z.string().uuid() }).safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de template invalide.",
    });
  }
  const tpl = await getMcpTemplateById(parsed.data.templateId);
  if (!tpl) {
    return errorResponse("not_found", {
      message: "Template introuvable.",
    });
  }

  // prefs check
  try {
    const { getUserMcpPrefs } = await import("@/lib/db/queries");
    const prefs = await getUserMcpPrefs(userId);
    if (prefs.globalKillSwitch) {
      return errorResponse("access_denied", {
        message: "MCP désactivé globalement par l'administrateur.",
      });
    }
    if ((tpl.transport as string) === "stdio" && !prefs.allowStdio) {
      return errorResponse("access_denied", {
        message: "Transport stdio désactivé dans les paramètres.",
      });
    }
  } catch (e: any) {
    if (e.status === 403) {
      throw e;
    }
  }

  const { createMcpServer, fetchMcpTools } = (await import(
    "@/lib/db/queries"
  )) as any;
  // Fallback direct import for fetch
  const { fetchMcpTools: doFetch } = await import("@/lib/mcp/client");
  const args = (
    tpl.args ? String(tpl.args).split(" ").filter(Boolean) : []
  ) as string[];
  let tools: any[] = [];
  try {
    tools = await doFetch({
      args,
      authType: (tpl.authType as any) ?? "none",
      command: tpl.command ?? undefined,
      name: tpl.name,
      transport: (tpl.transport as any) ?? "sse",
      url: tpl.url ?? undefined,
    });
  } catch {}

  const { createMcpServer: create } = await import("@/lib/db/queries");
  const created = await create({
    args,
    authType: (tpl.authType as any) ?? "none",
    command: tpl.command ?? undefined,
    description: tpl.description ?? "",
    icon: tpl.icon ?? "server",
    name: tpl.name,
    toolsCache: tools,
    transport: (tpl.transport as any) ?? "sse",
    url: tpl.url ?? undefined,
    userId,
  });

  return Response.json(
    {
      message: `Serveur "${tpl.name}" installé depuis le template`,
      server: created,
      template: tpl.name,
    },
    { status: 201 }
  );
}
