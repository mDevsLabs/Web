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
