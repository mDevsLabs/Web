export type SkillParameterDefinition = {
  defaultValue?: string;
  enumValues?: string[];
  name: string;
  required?: boolean;
  type?: string;
};

export function validateSkillParams(
  parameters: readonly SkillParameterDefinition[],
  values: Record<string, string> | null | undefined
): string | null {
  const supplied = values ?? {};
  for (const parameter of parameters) {
    const raw = String(
      supplied[parameter.name] ?? parameter.defaultValue ?? ""
    ).trim();
    if (parameter.required && !raw) {
      return `Le paramètre « ${parameter.name} » est obligatoire.`;
    }
    if (!raw) continue;

    const type = (parameter.type || "string").toLowerCase();
    if (type === "number" || type === "integer") {
      const number = Number(raw);
      if (
        !Number.isFinite(number) ||
        (type === "integer" && !Number.isInteger(number))
      ) {
        return `Le paramètre « ${parameter.name} » doit être un nombre${type === "integer" ? " entier" : ""}.`;
      }
    }
    if (type === "boolean" && raw !== "true" && raw !== "false") {
      return `Le paramètre « ${parameter.name} » doit être vrai ou faux.`;
    }
    if (parameter.enumValues?.length && !parameter.enumValues.includes(raw)) {
      return `Le paramètre « ${parameter.name} » doit faire partie des valeurs proposées.`;
    }
    // La valeur est une DONNÉE : elle est injectée au sein des instructions,
    // presque au centre du prompt. Une valeur qui usurpe un marqueur de
    // structure du prompt (délimiteur, titre de bloc, titre markdown) est
    // refusée comme le serait un paramètre hors bornes.
    const refus = valeurParametreAcceptable(raw);
    if (refus) {
      return `Le paramètre « ${parameter.name} » est refusé : ${refus}`;
    }
  }
  return null;
}

export function withSkillDefaults(
  parameters: readonly SkillParameterDefinition[],
  values: Record<string, string> | null | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const parameter of parameters) {
    result[parameter.name] =
      values?.[parameter.name] ?? parameter.defaultValue ?? "";
  }
  return result;
}

export function substituteSkillParams(
  instructions: string,
  params: Record<string, string> | null | undefined
): string {
  if (!params || Object.keys(params).length === 0) {
    return instructions;
  }
  return instructions.replace(
    /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g,
    (match, name: string) => {
      const value = params[name];
      if (value !== undefined && value.trim().length > 0) {
        return value.trim();
      }
      return `[non renseigné: ${name}]`;
    }
  );
}

/**
 * Valeur de paramètre refusée, ou `null` si elle est acceptable.
 *
 * Une valeur de paramètre est une DONNÉE choisie par l'utilisateur, jamais
 * une consigne : elle est substituée DANS les instructions d'un Skill, donc
 * presque au cœur du prompt système. Un paramètre peut donc devenir le
 * véhicule d'un hijack silencieux — « INSTRUCTIONS PERSONNALISÉES » ou le
 * délimiteur de bloc structurant能在 de `lib/prompts/personal.ts` feraient
 * croire au modèle qu'une valeur utilisateur EST un bloc d'autorité.
 *
 * Ce que la garde refuse, et pourquoi :
 *
 *   - le squelette du délimiteur (`══════════`) et les libellés de bloc du
 *     prompt principal (INSTRUCTIONS PERSONNALISÉES, COMMANDe PERSONNALISÉE…)
 *     : usurper ces marqueurs, c'est faire passer la valeur pour une section
 *     du prompt ;
 *   - les lignes qui BEGIN par un header markdown `#` en début de valeur :
 *     une valeur n'a pas de titre ;
 *   - une valeur viderache : un paramètre qui occupe plus d'un tiers du
 *     budget max d'un Skill n'est plus un paramètre.
 */
const MARQUEURS_STRUCTURELS = [
  "INSTRUCTIONS PERSONNALISÉES",
  "COMMANDE PERSONNALISÉE",
  "COMPÉTENCE ACTIVE",
  "COMPÉTENCES DE L'ASSISTANT",
  "══\u2550══\u2550══\u2550══\u2550",
];
const VALEUR_MAX_PARAMETRE = 2600;

export function valeurParametreAcceptable(valeur: string): string | null {
  const nettoye = valeur.trim();
  if (nettoye.length > VALEUR_MAX_PARAMETRE) {
    return `Le paramètre dépasse ${VALEUR_MAX_PARAMETRE} caractères.`;
  }
  if (
    MARQUEURS_STRUCTURELS.some((marqueur) =>
      nettoye.toUpperCase().includes(marqueur)
    )
  ) {
    return "Le paramètre contient la copie d'un marqueur de structure du prompt.";
  }
  // Un paramètre est une donnée, pas un document : une ligne commençant par
  // `#` y sert à quoi ? Un faux en-tête n'a que des raisons de contrer l'ordre.
  if (/^[ \t]*#{1,6}[ \t]/m.test(nettoye)) {
    return "Le paramètre contient un titre markdown, qui commande un niveau de structure.";
  }
  return null;
}
