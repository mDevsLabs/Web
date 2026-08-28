import { getMaiUser } from "@/lib/auth/session";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMcpTemplateById, getMcpTemplates } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
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

  const json = await request.json();
  const tpl = await getMcpTemplateById(json.templateId);
  if (!tpl) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  // prefs check
  try {
    const { getUserMcpPrefs } = await import("@/lib/db/queries");
    const prefs = await getUserMcpPrefs(userId);
    if (prefs.globalKillSwitch) return Response.json({ error: "MCP désactivé globalement" }, { status: 403 });
    if ((tpl.transport as string) === "stdio" && !prefs.allowStdio) return Response.json({ error: "Transport stdio désactivé" }, { status: 403 });
  } catch (e: any) { if (e.status === 403) throw e; }

  const { createMcpServer, fetchMcpTools } = await import("@/lib/db/queries") as any;
  // Fallback direct import for fetch
  const { fetchMcpTools: doFetch } = await import("@/lib/mcp/client");
  const args = (tpl.args ? String(tpl.args).split(" ").filter(Boolean) : []) as string[];
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
    { message: `Serveur "${tpl.name}" installé depuis le template`, server: created, template: tpl.name },
    { status: 201 }
  );
}

