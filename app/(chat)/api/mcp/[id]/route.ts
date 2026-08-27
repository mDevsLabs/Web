import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteMcpServer,
  getMcpServerById,
  toggleMcpServer,
  updateMcpServer,
  updateMcpToolsCache,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { fetchMcpTools } from "@/lib/mcp/client";

const updateMcpSchema = z.object({
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
    .optional(),
  command: z.string().nullable().optional(),
  description: z.string().max(1000).optional(),
  env: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  icon: z.string().max(50).optional(),
  isEnabled: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  requireApproval: z
    .enum(["always_allow", "ask_permission", "write_only"])
    .optional(),
  toolsCache: z.array(z.any()).optional(),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).optional(),
  url: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  const found = await getMcpServerById({ id, userId });
  if (!found) {
    return Response.json({ error: "Serveur MCP introuvable" }, { status: 404 });
  }

  return Response.json(found);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  try {
    const json = await request.json();

    // 1. Bascule d'activation rapide
    if (json.toggleEnabled) {
      const updated = await toggleMcpServer({ id, userId });
      return Response.json(updated);
    }

    // 2. Rafraîchissement des outils en cache
    if (json.refreshTools) {
      const server = await getMcpServerById({ id, userId });
      if (!server) {
        return Response.json(
          { error: "Serveur MCP introuvable" },
          { status: 404 }
        );
      }
      const tools = await fetchMcpTools({
        args: server.args as string[],
        authConfig: server.authConfig as any,
        authType: server.authType as any,
        command: server.command,
        env: server.env as Record<string, string>,
        headers: server.headers as Record<string, string>,
        name: server.name,
        transport: server.transport as any,
        url: server.url,
      });

      const updated = await updateMcpToolsCache({
        id,
        toolsCache: tools,
        userId,
      });

      return Response.json({
        message: `${tools.length} outil(s) synchronisé(s)`,
        server: updated,
        tools,
      });
    }

    const parsed = updateMcpSchema.parse(json);
    const updated = await updateMcpServer({
      data: parsed as any,
      id,
      userId,
    });

    if (!updated) {
      return Response.json(
        { error: "Serveur MCP introuvable" },
        { status: 404 }
      );
    }

    return Response.json(updated);
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Erreur lors de la mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  const deleted = await deleteMcpServer({ id, userId });
  if (!deleted) {
    return Response.json({ error: "Serveur MCP introuvable" }, { status: 404 });
  }

  return Response.json({
    message: "Serveur MCP supprimé avec succès",
    success: true,
  });
}
