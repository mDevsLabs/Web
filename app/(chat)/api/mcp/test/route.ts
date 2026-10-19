import { z } from "zod";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { getMaiUser } from "@/lib/auth/session";
import { getUserMcpPrefs } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  checkGlobalKillSwitch,
  testMcpConnection,
  validateMcpConfig,
} from "@/lib/mcp/client";
import { toMcpRuntimePreferences } from "@/lib/mcp/policy";
import { redactMcpError } from "@/lib/mcp/redaction";
import type { McpServerConfig } from "@/lib/mcp/types";

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
  // Bornes identiques à celles de `/api/mcp/route.ts` : cette route déclenchait
  // une requête sortante vers une URL et un jeu d'en-têtes fournis par
  // l'appelant, sans la même validation que le chemin de création.
  url: z.string().max(4096).optional(),
});

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  // Requête sortante déclenchée par l'appelant : la route la plus exposée à
  // l'amplification du dépôt (balayage de ports internes depuis le serveur).
  const limited = await enforceApiRateLimit({
    action: "mcp_test",
    request,
    userId: user.id || user.email,
  });
  if (limited) {
    return limited;
  }

  try {
    const json = await request.json();
    const parsed = testMcpSchema.parse(json);

    // Même validation que le chemin de création : schéma de transport,
    // HTTPS obligatoire, contrôles d'hôte. Sans elle, la route de test
    // acceptait des configurations que la route d'enregistrement refusait.
    validateMcpConfig(parsed as McpServerConfig);
    const prefs = toMcpRuntimePreferences(
      await getUserMcpPrefs(user.id || user.email)
    );
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

    const result = await testMcpConnection(
      {
        args: parsed.args,
        authConfig: parsed.authConfig,
        authType: parsed.authType,
        command: parsed.command,
        env: parsed.env,
        headers: parsed.headers,
        name: parsed.name,
        transport: parsed.transport,
        url: parsed.url,
      },
      prefs
    );

    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return Response.json(
      {
        message: redactMcpError(err, "Erreur lors du test de connexion"),
        success: false,
        tools: [],
        toolsCount: 0,
      },
      { status: 400 }
    );
  }
}
