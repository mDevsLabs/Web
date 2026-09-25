// Installation d'un modèle MCP du catalogue statique (lib/mcp-templates).
// La logique vit dans `lib/mcp-templates/install.ts`, partagée avec
// `/api/mcp/templates` : aucun secret n'est accepté ni créé ici, les tokens
// sont saisis ensuite dans la fiche du serveur (stockage chiffré).

import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { toMcpServerDto } from "@/lib/mcp/dto";
import { installMcpTemplate } from "@/lib/mcp-templates/install";

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

  const result = await installMcpTemplate({
    templateId: parsed.data.templateId,
    tier: user.tier,
    userId,
  });

  if (!result.ok) {
    return errorResponse(result.code, { message: result.message });
  }

  return Response.json(
    {
      alreadyInstalled: result.alreadyInstalled,
      message: result.message,
      requiresConfiguration: result.requiresConfiguration,
      server: toMcpServerDto(result.server),
      template: result.template.name,
    },
    { status: result.alreadyInstalled ? 200 : 201 }
  );
}
