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
