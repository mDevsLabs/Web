import type { z } from "zod";
import { fromExistingTool } from "@/lib/agent/tools/adapters/existing";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { askUser, askUserSchema } from "@/lib/ai/tools/ask-user";

type AskUserOutput = {
  description?: string;
  questions?: unknown[];
  status?: string;
  title?: string;
};

// Indispensable à l'état waiting_for_user : au lieu d'inventer une information
// manquante, Agent pose une question précise puis reprend le même run.
export const askUserTool = fromExistingTool({
  metadata: requireAgentToolMetadata("ask_user"),
  schema: askUserSchema as z.ZodType<z.infer<typeof askUserSchema>>,
  tool: askUser,
  toResult: (output) => {
    const result = output as AskUserOutput;
    if (!result?.title) {
      return toolFailure(
        "invalid_input",
        "Le questionnaire doit contenir au moins un titre."
      );
    }
    return toolSuccess({
      description: result.description,
      questions: result.questions ?? [],
      status: "waiting_for_user",
      title: result.title,
    });
  },
});
