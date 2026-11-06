import { type ToolErrorShape, toAgentToolError } from "@/lib/agent/tool-errors";

// Pourquoi retourner la forme sûre au lieu de relancer : quand `execute` lève,
// le SDK ne transmet au modèle que `error.message`. Le contrat Agent
// (`code`, `category`, `message`, `retryable`, `retryAfterMs`) doit arriver
// comme JSON, pour que le modèle sache s'il réessaie, change d'outil ou
// prévient l'utilisateur. Les détails internes ne sortent pas.

type Executable = {
  execute?: (...args: never[]) => Promise<unknown> | unknown;
  [key: string]: unknown;
};

export function guardNativeChatTool<T extends Executable>(tool: T): T {
  const execute = tool?.execute;
  if (typeof execute !== "function") {
    return tool;
  }

  const guardedExecute = async (
    ...args: never[]
  ): Promise<unknown | ToolErrorShape> => {
    try {
      return await execute(...args);
    } catch (error) {
      return toAgentToolError(error).toSafeShape();
    }
  };

  return {
    ...tool,
    execute: guardedExecute,
  };
}

export function guardNativeChatTools<T extends Record<string, Executable>>(
  tools: T
): T {
  const guarded = {} as T;
  for (const [id, tool] of Object.entries(tools)) {
    guarded[id as keyof T] = guardNativeChatTool(tool) as T[keyof T];
  }
  return guarded;
}
