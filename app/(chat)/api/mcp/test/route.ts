import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { getUserMcpPrefs } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { checkGlobalKillSwitch, testMcpConnection } from "@/lib/mcp/client";

const testMcpSchema = z.object({
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
  env: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  name: z.string().min(1),
  transport: z.enum(["sse", "http", "stdio", "websocket"]).default("sse"),
  url: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const json = await request.json();
    const parsed = testMcpSchema.parse(json);
    const prefs = await getUserMcpPrefs(user.id || user.email);
    checkGlobalKillSwitch(prefs);
    if (parsed.transport === "stdio") {
      return Response.json(
        {
          message:
            "Le test stdio est réservé à l'administration et n'est pas disponible ici.",
          success: false,
          tools: [],
          toolsCount: 0,
        },
        { status: 403 }
      );
    }

    const result = await testMcpConnection({
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

    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return Response.json(
      {
        message: err.message ?? "Erreur lors du test de connexion",
        success: false,
        tools: [],
        toolsCount: 0,
      },
      { status: 400 }
    );
  }
}
