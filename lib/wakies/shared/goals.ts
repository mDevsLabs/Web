/** Un objectif simple est une page Wakies : les révisions et permissions existantes restent la source de vérité. */
export const GOAL_MARKER = "<!-- wakies:goal:v1 -->";
export function goalContent(description: string, steps: string[]): string {
  return [
    GOAL_MARKER,
    description.trim(),
    "## Étapes",
    ...steps.map((step) => `- [ ] ${step.trim()}`),
  ].join("\n\n");
}
export function goalSteps(
  content: string
): { line: number; title: string; done: boolean }[] {
  if (!content.startsWith(GOAL_MARKER)) return [];
  return content.split("\n").flatMap((text, line) => {
    const match = /^- \[([ xX])\] (.+)$/.exec(text);
    return match
      ? [{ done: match[1].toLowerCase() === "x", line, title: match[2] }]
      : [];
  });
}
export function toggleGoalStep(content: string, line: number): string {
  const step = goalSteps(content).find((item) => item.line === line);
  if (!step) throw new Error("Étape introuvable.");
  return content
    .split("\n")
    .map((text, index) =>
      index === line ? `- [${step.done ? " " : "x"}] ${step.title}` : text
    )
    .join("\n");
}

/** Le marqueur ne doit pas disparaître quand Tiptap ignore un commentaire HTML. */
export function preserveGoalMarker(previous: string, updated: string): string {
  return previous.startsWith(GOAL_MARKER) && !updated.startsWith(GOAL_MARKER)
    ? `${GOAL_MARKER}\n\n${updated}`
    : updated;
}
