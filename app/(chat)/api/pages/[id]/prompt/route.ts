import { errorResponse } from "@/lib/api/error-response";
import { getUserPreferences } from "@/lib/db/queries/users";
import { getPageAccess } from "@/lib/pages/access";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { canReadPagePrompt } from "@/lib/pages/permissions";
import { memoryBlockForPage } from "@/lib/pages/personal";
import { buildPageSystemPrompt } from "@/lib/prompts/pages";

type Params = { params: Promise<{ id: string }> };

/** Prompt stable du panneau : sans sélection, en mode proposition. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const { id } = await params;
    const access = await getPageAccess({
      pageId: id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!access || !canReadPagePrompt(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const prefs = await getUserPreferences(auth.userId);
    const memoryBlock = await memoryBlockForPage({
      projectId: access.page.projectId ?? null,
      tier: auth.session.user.tier,
      userId: auth.userId,
    });
    return Response.json({
      prompt: buildPageSystemPrompt({
        accountEnabled: Boolean(prefs.enabled),
        accountInstructions: prefs.customInstructions,
        intent: "propose",
        memoryBlock,
        pagePrompt: access.page.customPrompt,
        projectInstructions: access.projectInstructions,
        selection: null,
      }),
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
