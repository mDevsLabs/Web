import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  getAgentRunsByChatId,
  getAgentStepsByRunId,
  getToolExecutionsByRunId,
} from "@/lib/db/agent-queries";
import { getChatById } from "@/lib/db/queries";

// Restauration après refresh : le serveur est la source de vérité du run. Le
// frontend récupère runs, steps et exécutions d'outils, et n'a jamais besoin de
// rejouer le flux pour retrouver l'état de l'exécution.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return errorResponse("invalid_request", {
      message: "Le paramètre 'chatId' est obligatoire.",
    });
  }

  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return errorResponse("not_found", {
      message: "La conversation demandée est introuvable.",
    });
  }
  if (
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: user.email,
      userId,
      username: user.username,
    })
  ) {
    return errorResponse("access_denied");
  }

  const runs = await getAgentRunsByChatId({ chatId });
  const [steps, executions] = await Promise.all([
    Promise.all(runs.map((run) => getAgentStepsByRunId({ runId: run.id }))),
    Promise.all(runs.map((run) => getToolExecutionsByRunId({ runId: run.id }))),
  ]);

  // Actions suggérées validées côté serveur, persistées en fin de run : le
  // client les affiche telles quelles et n'exécute que via la route dédiée.
  const runActions = Object.fromEntries(
    runs.map((run) => [
      run.id,
      (run.suggestedActions ?? []) as {
        id: string;
        label: string;
        payload: Record<string, unknown>;
      }[],
    ])
  );

  return Response.json(
    {
      executions: executions.flat(),
      mode: chat.mode,
      runs,
      steps: steps.flat(),
      suggestedActions: runActions,
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
