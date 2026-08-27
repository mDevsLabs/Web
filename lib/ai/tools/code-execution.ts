import { tool } from "ai";
import { z } from "zod";

const MAX_CODE_LENGTH = 20_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const ALLOWED_LANGUAGES = ["python", "javascript", "js"] as const;

/**
 * Browser-only code execution tool.
 * The AI generates code; execution happens client-side via Pyodide (window.pyodide).
 * Server just validates and returns the code payload with needsClient flag.
 * The client component <CodeExecution> will actually run it.
 */
export const codeExecution = tool({
  description:
    "Generate and execute code in the browser (Python via Pyodide ou JavaScript). Use when user asks to run, execute, test, or compute code. The code is executed client-side securely. Provide full self-contained runnable code without markdown fences. The server does NOT execute the code; the client component runs it.",
  execute: ({ code, language, timeoutMs }) => {
    const lang = (language || "python").toLowerCase();
    const trimmed = (code || "").trim();
    if (!trimmed) {
      return { error: "Code vide" };
    }
    if (trimmed.length > MAX_CODE_LENGTH) {
      return {
        error: `Code trop long (max ${MAX_CODE_LENGTH} caractères, reçu ${trimmed.length}).`,
        maxLength: MAX_CODE_LENGTH,
      };
    }
    if (
      !ALLOWED_LANGUAGES.includes(lang as (typeof ALLOWED_LANGUAGES)[number])
    ) {
      return {
        error: `Langage non supporté : "${lang}". Utilisez l'un des suivants : ${ALLOWED_LANGUAGES.join(", ")}.`,
        supported: ALLOWED_LANGUAGES,
      };
    }

    const safeTimeoutMs = Math.min(
      Math.max(timeoutMs ?? DEFAULT_TIMEOUT_MS, 1000),
      MAX_TIMEOUT_MS
    );

    return {
      code: trimmed,
      language: lang,
      length: trimmed.length,
      message:
        "Code prêt pour exécution côté navigateur (Pyodide). Le client va l'exécuter et afficher le résultat.",
      needsClientExecution: true as const,
      timeoutMs: safeTimeoutMs,
    };
  },
  inputSchema: z.object({
    code: z
      .string()
      .min(1)
      .max(MAX_CODE_LENGTH)
      .describe("Code complet exécutable, sans fences markdown ni balises ```"),
    language: z
      .enum(ALLOWED_LANGUAGES)
      .optional()
      .default("python")
      .describe("Langage à exécuter (python ou javascript/js)"),
    timeoutMs: z
      .number()
      .int()
      .min(1000)
      .max(MAX_TIMEOUT_MS)
      .optional()
      .describe(
        "Timeout d'exécution en millisecondes côté client (1000-60000, défaut 10000)"
      ),
  }),
});
