// ─────────────────────────────────────────────
// Prompt systeme obligatoire de la generation mAI-2.
//
// Tout appel dont le modele demande est un alias mAI-2 recoit ce prompt en
// tete de conversation, quel que soit le dialecte de l'appel (OpenAI
// `messages`, Anthropic `system`, Gemini `systemInstruction`). Le prompt d'un
// client n'est jamais ecrase : le notre passe simplement devant, les deux
// restent presents.
//
// Ce module n'a aucune dependance (ni Deno, ni Hono) pour rester importable
// par le serveur ET par les tests unitaires.
// ─────────────────────────────────────────────

export const MAI_IDENTITY_PROMPTS: Record<string, string> = {
  "mai-2": "You are mAI-2, developed by mAI.",
  "mai-2-mini": "You are mAI-2 Mini, developed by mAI.",
};

/** Forme du corps de requete, i.e. l'API traversee par le handler. */
export type IdentityDialect = "openai" | "anthropic" | "gemini";

export function normalizeMaiAliasId(model?: string | null): string {
  let m = String(model || "").toLowerCase().trim();
  if (m.startsWith("mdevslabs/")) m = m.slice("mdevslabs/".length);
  return m;
}

/** Prompt d'identite du modele, ou `null` si le modele n'est pas un alias mAI-2. */
export function resolveMaiIdentityPrompt(model?: string | null): string | null {
  return MAI_IDENTITY_PROMPTS[normalizeMaiAliasId(model)] ?? null;
}

/** Aplatit un contenu OpenAI/Anthropic (chaine ou blocs) en texte. */
function textFromContent(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  const parts = content
    .map((part: any) =>
      typeof part === "string"
        ? part
        : part && typeof part.text === "string"
          ? part.text
          : null
    )
    .filter((part: any): part is string =>
      typeof part === "string" && part.length > 0
    );

  return parts.length > 0 ? parts.join("\n") : null;
}

/** Dialecte OpenAI : un message `system` prependu a `messages`. */
function injectIdentityIntoMessages<T extends Record<string, any>>(
  body: T,
  prompt: string
): T {
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const alreadyPresent = messages.some(
    (message: any) =>
      message &&
      message.role === "system" &&
      textFromContent(message.content) === prompt
  );
  if (alreadyPresent) return body;

  return {
    ...body,
    messages: [{ content: prompt, role: "system" }, ...messages],
  };
}

/** Dialecte Anthropic : `system` en chaine ou en tableau de blocs de texte. */
function injectIdentityIntoAnthropic<T extends Record<string, any>>(
  body: T,
  prompt: string
): T {
  const system = body.system;

  if (system === undefined || system === null || system === "") {
    return { ...body, system: prompt };
  }
  if (typeof system === "string") {
    return system === prompt ? body : { ...body, system: `${prompt}\n\n${system}` };
  }
  if (Array.isArray(system)) {
    const alreadyPresent = system.some((block: any) =>
      textFromContent(block?.text ?? block) === prompt
    );
    if (alreadyPresent) return body;
    return { ...body, system: [{ text: prompt, type: "text" }, ...system] };
  }
  return body;
}

/** Dialecte Google Gemini : premiere partie de `systemInstruction.parts`. */
function injectIdentityIntoGemini<T extends Record<string, any>>(
  body: T,
  prompt: string
): T {
  const instruction = body.systemInstruction;
  if (!instruction || typeof instruction !== "object") {
    return { ...body, systemInstruction: { parts: [{ text: prompt }] } };
  }

  const parts = Array.isArray(instruction.parts) ? instruction.parts : [];
  const alreadyPresent = parts.some((part: any) =>
    textFromContent(part?.text ?? part) === prompt
  );
  if (alreadyPresent) return body;

  return {
    ...body,
    systemInstruction: { ...instruction, parts: [{ text: prompt }, ...parts] },
  };
}

/**
 * Applique le prompt d'identite mAI au corps d'une requete.
 *
 * Le dialecte est fourni par l'appelant (chaque handler connait la forme de
 * sa propre API) plutot que deduit du corps : un corps vide est valide pour
 * l'endpoint Gemini, et le deviner depuis ses cles le routerait a tort vers
 * le dialecte OpenAI.
 */
export function injectMaiIdentityPrompt<T extends Record<string, any>>(
  body: T,
  model: string | null | undefined,
  dialect: IdentityDialect = "openai"
): T {
  const prompt = resolveMaiIdentityPrompt(model);
  if (!prompt) return body;

  if (dialect === "gemini") return injectIdentityIntoGemini(body, prompt);
  if (dialect === "anthropic") return injectIdentityIntoAnthropic(body, prompt);
  return injectIdentityIntoMessages(body, prompt);
}