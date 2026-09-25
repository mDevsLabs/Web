import type { McpApprovalPolicy, McpServerConfig } from "./types";

/**
 * Préférences minimales contrôlées au moment de l'exécution.
 *
 * Une préférence absente ou invalide n'est jamais interpretée comme
 * « autorisé » : elle est remplacée par une politique fail-closed.
 */
export type McpRuntimePreferences = {
  allowStdio: boolean;
  defaultRateLimitPerMin: number;
  defaultRequireApproval: McpApprovalPolicy;
  defaultTimeoutMs: number;
  globalKillSwitch: boolean;
};

/** Forme minimale acceptée par les gardes d'exécution. */
export type McpRuntimePolicyInput = {
  allowStdio?: boolean;
  globalKillSwitch?: boolean;
};

const FAIL_CLOSED_PREFERENCES: McpRuntimePreferences = {
  allowStdio: false,
  defaultRateLimitPerMin: 60,
  defaultRequireApproval: "ask_permission",
  defaultTimeoutMs: 15_000,
  globalKillSwitch: true,
};

const APPROVAL_POLICIES = new Set<McpApprovalPolicy>([
  "always_allow",
  "ask_permission",
  "write_only",
]);

/**
 * Ces binaires sont des interpréteurs/ponts vers du code arbitraire. Les
 * autoriser par leur simple nom dans MCP_STDIO_ALLOWED_COMMANDS contourne
 * lallowlist (par exemple `npx -y un-package`).
 */
const GENERIC_COMMANDS = new Set([
  "bash",
  "bun",
  "cargo",
  "cmd",
  "curl",
  "deno",
  "docker",
  "dotnet",
  "elixir",
  "fish",
  "go",
  "java",
  "java.exe",
  "kubectl",
  "node",
  "node.exe",
  "nodejs",
  "npm",
  "npx",
  "perl",
  "php",
  "pnpm",
  "powershell",
  "pwsh",
  "python",
  "python3",
  "py",
  "ruby",
  "sh",
  "sudo",
  "uvx",
  "wget",
  "yarn",
  "zsh",
]);

const MAX_COMMAND_LENGTH = 256;
const MAX_ARGUMENTS = 64;
const MAX_ARGUMENT_LENGTH = 2000;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeCommand(value: string): string {
  return value.replace(/\\/g, "/").trim().toLowerCase();
}

function commandName(command: string): string {
  return command.replace(/\\/g, "/").split("/").pop() ?? command;
}

function parseAllowedArguments(command: string): string[] | null {
  const raw = process.env.MCP_STDIO_ALLOWED_ARGS?.trim();
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const record = asRecord(parsed);
  if (!record) {
    return null;
  }

  const normalized = normalizeCommand(command);
  const name = normalizeCommand(commandName(command));
  const entry = record[normalized] ?? record[name];
  if (!Array.isArray(entry) || entry.some((item) => typeof item !== "string")) {
    return null;
  }
  return entry as string[];
}

function sameArguments(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

/**
 * Convertit une ligne de préférences en contrat runtime. Les deux booléens de
 * sécurité sont obligatoires ; toute ligne incomplète est traitée comme un
 * kill-switch, jamais comme une autorisation.
 */
export function toMcpRuntimePreferences(value: unknown): McpRuntimePreferences {
  const record = asRecord(value);
  if (
    !record ||
    typeof record.globalKillSwitch !== "boolean" ||
    typeof record.allowStdio !== "boolean"
  ) {
    return { ...FAIL_CLOSED_PREFERENCES };
  }

  const approval = record.defaultRequireApproval;
  return {
    allowStdio: record.allowStdio,
    defaultRateLimitPerMin: boundedInteger(
      record.defaultRateLimitPerMin,
      FAIL_CLOSED_PREFERENCES.defaultRateLimitPerMin,
      1,
      1000
    ),
    defaultRequireApproval: APPROVAL_POLICIES.has(approval as McpApprovalPolicy)
      ? (approval as McpApprovalPolicy)
      : FAIL_CLOSED_PREFERENCES.defaultRequireApproval,
    defaultTimeoutMs: boundedInteger(
      record.defaultTimeoutMs,
      FAIL_CLOSED_PREFERENCES.defaultTimeoutMs,
      1000,
      120_000
    ),
    globalKillSwitch: record.globalKillSwitch,
  };
}

export function checkGlobalKillSwitch(
  prefs: McpRuntimePolicyInput | null | undefined
): void {
  if (!prefs || typeof prefs.globalKillSwitch !== "boolean") {
    throw new Error(
      "MCP indisponible : les préférences de sécurité sont introuvables."
    );
  }
  if (prefs.globalKillSwitch) {
    throw new Error(
      "MCP désactivé globalement (kill-switch activé dans les paramètres)."
    );
  }
}

/**
 * Vérifie une commande stdio avant toute découverte ou tout appel d'outil.
 *
 *allowlist porte sur un exécutable vetted, jamais sur un interpréteur
 * générique. Les arguments, lorsqu'ils existent, doivent être exactement
 * ceux déclarés dans MCP_STDIO_ALLOWED_ARGS pour cette commande.
 */
export function checkAllowStdio(
  config: Pick<McpServerConfig, "args" | "command" | "env" | "transport">,
  prefs: McpRuntimePolicyInput | null | undefined
): void {
  if (config.transport !== "stdio") {
    return;
  }

  // `assertMcpRuntimeEnabled` (toujours appelé par le runtime public) impose
  // les deux booléens. Cette garde basse-niveau reste compatible avec les
  // anciens appels qui fournissaient seulement `allowStdio`, mais ne peut
  // jamais transformer une préférence absente en autorisation.
  if (!prefs || typeof prefs.allowStdio !== "boolean") {
    throw new Error(
      "MCP indisponible : les préférences de sécurité sont introuvables."
    );
  }
  if (typeof prefs.globalKillSwitch === "boolean") {
    checkGlobalKillSwitch(prefs);
  }
  if (prefs.allowStdio !== true) {
    throw new Error(
      "Le transport stdio est désactivé dans les paramètres globaux MCP."
    );
  }
  if (process.env.MCP_STDIO_ENABLED !== "true") {
    throw new Error(
      "Le transport stdio est désactivé par la configuration serveur."
    );
  }

  const command = config.command?.trim();
  if (
    !command ||
    command.length > MAX_COMMAND_LENGTH ||
    /[\r\n\0;&|`$><]/.test(command)
  ) {
    throw new Error("Commande stdio non autorisée.");
  }

  const name = commandName(command).toLowerCase();
  if (GENERIC_COMMANDS.has(name)) {
    throw new Error(
      `Commande stdio générique interdite : ${name}. Utilisez un wrapper MCP vérifié.`
    );
  }

  const allowedCommands = new Set(
    (process.env.MCP_STDIO_ALLOWED_COMMANDS ?? "")
      .split(",")
      .map((value) => normalizeCommand(value))
      .filter(Boolean)
  );
  const normalizedCommand = normalizeCommand(command);
  if (
    !allowedCommands.has(normalizedCommand) &&
    !allowedCommands.has(normalizeCommand(name))
  ) {
    throw new Error("Commande stdio absente de l'allowlist serveur.");
  }

  const args = config.args ?? [];
  if (
    args.length > MAX_ARGUMENTS ||
    args.some(
      (arg) =>
        typeof arg !== "string" ||
        arg.length > MAX_ARGUMENT_LENGTH ||
        arg.includes("\0")
    )
  ) {
    throw new Error("Arguments stdio trop volumineux ou non autorisés.");
  }

  if (args.length > 0) {
    const allowedArgs = parseAllowedArguments(command);
    if (!allowedArgs || !sameArguments(args, allowedArgs)) {
      throw new Error(
        "Arguments stdio absents de l'allowlist exacte du serveur."
      );
    }
  }

  const envKeys = Object.keys(config.env ?? {});
  const allowedEnvKeys = new Set(
    (process.env.MCP_STDIO_ALLOWED_ENV_KEYS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  if (envKeys.some((key) => !allowedEnvKeys.has(key))) {
    throw new Error("Variable d'environnement stdio non autorisée.");
  }
}

export function assertMcpRuntimeEnabled(
  config: Pick<
    McpServerConfig,
    "isEnabled" | "transport" | "args" | "command" | "env"
  >,
  prefs: McpRuntimePolicyInput | McpRuntimePreferences | null | undefined
): void {
  if (config.isEnabled === false) {
    throw new Error("Serveur MCP désactivé.");
  }
  checkGlobalKillSwitch(prefs);
  if (config.transport === "stdio") {
    checkAllowStdio(config, prefs);
  }
}
