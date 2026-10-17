/** Keep in sync with renderer `ComposerPlusMenu.ComposerMode`. */
export const COMPOSER_MODES = [
  "agent",
  "plan",
  "team",
  "debug",
  "ask",
] as const;
export type ComposerMode = (typeof COMPOSER_MODES)[number];

export function parseComposerMode(raw: unknown): ComposerMode {
  if (
    typeof raw === "string" &&
    (COMPOSER_MODES as readonly string[]).includes(raw)
  ) {
    return raw as ComposerMode;
  }
  return "agent";
}
