// Installation d'un modèle MCP statique (lib/mcp-templates) : crée le serveur
// via l'API MCP existante. La correspondance se fait par identifiant du
// template ; les credentials (tokens) restent à renseigner ensuite par
// l'utilisateur, guidé par les instructions affichées sur la fiche.

import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMcpTemplate } from "@/lib/mcp-templates/catalog";

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  const json = await request.json().catch(() => ({}));
  const parsed = z.object({ templateId: z.string().min(1) }).safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de modèle invalide.",
    });
  }

  const template = getMcpTemplate(parsed.data.templateId);
  if (!template) {
    return errorResponse("not_found", {
      message: "Modèle MCP introuvable.",
    });
  }

  const { getUserMcpPrefs, createMcpServer } = await import("@/lib/db/queries");
  try {
    const prefs = await getUserMcpPrefs(userId);
    if (prefs.globalKillSwitch) {
      return errorResponse("access_denied", {
        message: "MCP désactivé globalement par l'administrateur.",
      });
    }
    if (template.transport === "stdio" && !prefs.allowStdio) {
      return errorResponse("access_denied", {
        message: "Transport stdio désactivé dans les paramètres.",
      });
    }
  } catch {
    // Préférences indisponibles : on laisse la création se poursuivre.
  }

  // Les tokens ne sont pas encore connus au moment de l'installation : on
  // installe la configuration (transport/URL/commande) et l'utilisateur
  // complète auth/env ensuite depuis l'écran avancé /mcp.
  const created = await createMcpServer({
    args: template.args ? template.args.split(" ").filter(Boolean) : [],
    authType: template.authType,
    command: template.command ?? undefined,
    description: `${template.description}`,
    env: template.env ?? undefined,
    icon: template.icon.name.toLowerCase(),
    name: template.name,
    requireApproval: template.requireApproval,
    transport: template.transport,
    url: template.url ?? undefined,
    userId,
  });

  return Response.json(
    {
      message: `Serveur "${template.name}" installé depuis le modèle. Renseignez les tokens indiqués sur la fiche du modèle.`,
      server: created,
      template: template.name,
    },
    { status: 201 }
  );
}
