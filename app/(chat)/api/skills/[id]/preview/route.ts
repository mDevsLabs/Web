import { validateSkillParams } from "@/lib/ai/skill-params";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getSkillById } from "@/lib/db/queries";

/**
 * GET /api/skills/:id/preview — aperçu d'un Skill AVANT activation.
 *
 * Pourquoi une route dédiée : la liste `/api/skills` renvoie les instructions
 * COMPLÈTES de chaque Skill, ce qui est voulu côté bibliothèque mais coûteux
 * à recharger pour un simple aperçu dans Wakies, et son appel direct depuis
 * un picker oblige le client à décider seul de ce qu'il affiche. Ici :
 *
 *   - le Skill est relu CÔTÉ SERVEUR, filtré par `userId` : un identifiant
 *     deviné depuis le navigateur ne révèle rien d'un autre compte ;
 *   - les instructions sont données UN SEUL ÉCRAN À LA FOIS (tronquées à
 *     2 000 caractères, avec le total) : l'aperçu informe, il ne rechargera
 *     jamais toute la fiche dans le chat ;
 *   - les paramètres sont validés AVEC AUCUNE valeur fournie : le résultat
 *     signale les paramètres requis que l'utilisateur devra remplir après
 *     activation — la même validation que le tour réel (`validateSkillParams`),
 *     donc le message affiché est exactement celui du tour si on activait sans
 *     paramètre ;
 *   - surface des permissions implicites = outils + serveurs MCP déclarés :
 *     ce que l'activation ADJOUTE à la conversation, jamais ce qu'elle
 *     retire (un filtre MCP ne peut que rétrécir).
 */

const APERCU_INSTRUCTIONS = 2000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { id } = await params;

  const skill = await getSkillById({ id, userId: session.userId });
  if (!skill) {
    return errorResponse("not_found", { message: "Skill introuvable." });
  }

  const parameters = Array.isArray(skill.parameters)
    ? (skill.parameters as Array<{
        defaultValue?: string;
        description?: string;
        enumValues?: string[];
        name: string;
        required?: boolean;
        type?: string;
      }>)
    : [];

  return Response.json(
    {
      color: skill.color,
      description: skill.description,
      icon: skill.icon,
      /** Champs de traçabilité : ce qui s'affiche dans le panneau Wakies. */
      installed: true,
      /** Aperçu : un écran, et le total pour savoir s'il manque quelque chose. */
      instructionsPreview: skill.instructions.slice(0, APERCU_INSTRUCTIONS),
      instructionsTotalLength: skill.instructions.length,
      instructionsTruncated: skill.instructions.length > APERCU_INSTRUCTIONS,
      lastUsedAt: skill.lastUsedAt?.toISOString() ?? null,
      mcpServerCount: Array.isArray(skill.mcpServerIds)
        ? skill.mcpServerIds.length
        : 0,
      /** Origine : slug du modèle installé, sinon création manuelle. */
      origin: skill.templateId
        ? { kind: "template" as const, templateId: skill.templateId }
        : { kind: "custom" as const },
      parameters: parameters.map((param) => ({
        defaultValue: param.defaultValue ?? null,
        description: param.description ?? null,
        enumValues: param.enumValues ?? null,
        name: param.name,
        required: param.required === true,
        type: param.type ?? "string",
      })),
      /** Validation réelle : zéro paramètre fourni = message effictif du tour. */
      parameterWarning: validateSkillParams(parameters, null),
      pinned: skill.pinned,
      templateId: skill.templateId,
      /** Surface d'outils AJOUTÉE par l'activation, enChat + sentinelle MCP. */
      tools: Array.isArray(skill.tools) ? (skill.tools as string[]) : [],
      usageCount: skill.usageCount,
      version: skill.version,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
