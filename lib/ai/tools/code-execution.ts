import { tool } from "ai";
import { z } from "zod";

/**
 * Browser-only code execution tool.
 * The AI generates code; execution happens client-side via Pyodide (window.pyodide).
 * Server just validates and returns the code payload with needsClient flag.
 * The client component <CodeExecution> will actually run it.
 */
export const codeExecution = tool({
  description:
    "Generate and execute code in the browser (Python via Pyodide or JS). Use when user asks to run, execute, test code. The code will be executed client-side securely. Provide full runnable code.",
  execute: ({ code, language }) => {
    const lang = (language || "python").toLowerCase();
    const trimmed = code.trim();
    if (!trimmed) {
      return { error: "Code vide" };
    }
    if (trimmed.length > 20_000) {
      return { error: "Code trop long (max 20k)" };
    }

    // Server does NOT execute, just returns payload for client execution
    return {
      code: trimmed,
      language: lang,
      message:
        "Code prêt pour exécution côté navigateur (Pyodide). Le client va l'exécuter et afficher le résultat.",
      needsClientExecution: true as const,
    };
  },
  inputSchema: z.object({
    code: z.string().describe("Code complet exécutable, sans fences markdown"),
    language: z
      .enum(["python", "javascript", "js"])
      .optional()
      .default("python")
      .describe("Langage à exécuter"),
  }),
});
