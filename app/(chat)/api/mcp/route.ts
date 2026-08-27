import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import {
  createMcpServer,
  getMcpServersByUserId,
  getMcpStats,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { fetchMcpTools } from "@/lib/mcp/client";

const createMcpSchema = z.object({
  args: z.array(z.string()).optional(),
  authConfig: z
    .object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      tokenUrl: z.string().optional(),
      username: z.string().optional(),
    })
    .optional(),
  authType: z
    .enum(["none", "bearer", "basic", "oauth2", "custom_headers"])
    .default("none"),
  command: z.string().optional(),
  description: z.string().max(1000).optional(),
  env: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  icon: z.string().max(50).optional(),
  isEnabled: z.boolean().optional(),
  name: z.string().min(1).max(100),
  requireApproval: z
    .enum(["always_allow", "ask_permission", "write_only"])
    .default("write_only"),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).default("sse"),
  url: z.string().optional(),
});

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;

  const [servers, stats] = await Promise.all([
    getMcpServersByUserId({ userId }),
    getMcpStats({ userId }),
  ]);

  return Response.json({
    servers,
    stats,
  });
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    const json = await request.json();
    const parsed = createMcpSchema.parse(json);

    // Tentative de découverte automatique des outils à la création
    let discoveredTools: any[] = [];
    try {
      discoveredTools = await fetchMcpTools({
        args: parsed.args,
        authConfig: parsed.authConfig,
        authType: parsed.authType,
        command: parsed.command,
        env: parsed.env,
        headers: parsed.headers,
        name: parsed.name,
        transport: parsed.transport,
        url: parsed.url,
      });
    } catch {
      // Ignorer l'erreur pour ne pas bloquer l'enregistrement si le serveur n'est pas encore en ligne
    }

    const created = await createMcpServer({
      ...parsed,
      toolsCache: discoveredTools,
      userId,
    });

    // Notification MCP créé
    try {
      const { createNotification } = await import("@/lib/db/queries");
      createNotification({
        body: `Le serveur MCP "${created.name}" a été ajouté.`,
        link: `/mcp`,
        title: "Nouveau MCP ajouté",
        type: "mcp_created",
        userId,
      }).catch(() => {});
    } catch {}

    return Response.json(created, { status: 201 });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Paramètres de serveur MCP invalides" },
      { status: 400 }
    );
  }
}
