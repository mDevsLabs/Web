import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { toMcpServerDto } from "@/lib/mcp/dto";
import { MCP_TEMPLATE_LIST } from "@/lib/mcp-templates/catalog";
import { installMcpTemplate } from "@/lib/mcp-templates/install";

// Catalogue MCP de l'écran /mcp : il expose désormais le catalogue statique
// (source de vérité unique) et plus les lignes de la table McpTemplate, qui
// pouvaient diverger. Le format de réponse reste compatible avec le client.
export async function GET() {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }

  return Response.json({
    templates: MCP_TEMPLATE_LIST.map((template) => ({
      // Les métadonnées de configuration sont utiles aux clients hors UI et
      // restent sans valeur de credential : seules les instructions et les
      // noms de champs sont exposés.
      activation: template.activation,
      args: template.args ?? "",
      author: template.author,
      authType: template.authType,
      category: template.category,
      command: template.command ?? "",
      credentials: template.credentials,
      description: template.description,
      docsUrl: template.docsUrl,
      icon: template.icon.name.toLowerCase(),
      id: template.id,
      minTier: template.minTier,
      name: template.name,
      readOnly: template.readOnly,
      requireApproval: template.requireApproval,
      setupInstructions: template.setupInstructions,
      tags: template.tags,
      transport: template.transport,
      url: template.url ?? "",
      verifiedAt: template.verifiedAt,
    })),
  });
}

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
