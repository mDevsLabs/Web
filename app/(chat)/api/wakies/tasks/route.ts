import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  enforceWakiesLimit,
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import {
  createTask,
  ensureSettings,
  findConversation,
  listTasks,
} from "@/lib/wakies/queries";

/**
 * POST /api/wakies/tasks — planifie une tâche récurrente.
 *
 * Le gabarit exécutait ces tâches dans un `setInterval` du process Node : rien
 * ne tournait si le serveur s'arrêtait, et rien ne tournait sur Vercel. Ici la
 * file est en base et le tick est une route cron (`app/api/cron/wakies`), avec
 * un bail par tâche : deux ticks concurrents ne peuvent pas exécuter la même.
 *
 * La conversation est OBLIGATOIRE, comme dans le gabarit : une tâche doit
 * pouvoir écrire son résultat quelque part de lisible par l'utilisateur.
 */

const schema = z
  .object({
    conversationId: z.string().min(1),
    intervalSeconds: z
      .number()
      .int()
      .min(60)
      .max(31_536_000)
      .nullable()
      .optional(),
    prompt: z.string().trim().min(3).max(4000),
  })
  .strict();

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const reglage = await ensureSettings(identite.userId);
  if (!reglage.researchAllowed) {
    return errorResponse("access_denied", {
      message: "La recherche est désactivée dans les réglages.",
    });
  }
  if (!(await findConversation(identite.userId, parsed.data.conversationId))) {
    return errorResponse("access_denied", {
      message: "Cette conversation n'appartient pas à ce compte.",
    });
  }
  const limite = await enforceWakiesLimit({
    limit: "tasks",
    tier: identite.tier,
    used: (await listTasks(identite.userId)).length,
  });
  if (limite) {
    return limite;
  }
  try {
    const task = await createTask(identite.userId, {
      conversationId: parsed.data.conversationId,
      intervalSeconds: parsed.data.intervalSeconds ?? null,
      prompt: parsed.data.prompt,
    });
    return json(task, { status: 201 });
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
