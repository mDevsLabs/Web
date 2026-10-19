import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync } from "node:fs";
import path from "node:path";

export type BuiltinTerminalProfileDescriptor = {
  id: string;
  builtinKey?: string;
  name: string;
  group: string;
  icon: string;
  color: string;
  disableDynamicTitle: boolean;
  behaviorOnSessionEnd: "auto" | "keep" | "reconnect" | "close";
  clearServiceMessagesOnConnect: boolean;
  terminalColorSchemeId: string;
  loginScripts: Array<{
    expect: string;
    send: string;
    isRegex: boolean;
    optional: boolean;
  }>;
  inputBackspace: "backspace" | "ctrl-h" | "ctrl-?" | "delete";
  kind: "local" | "ssh";
  shell: string;
  args: string;
  sshHost: string;
  sshPort: number;
  sshUser: string;
  sshIdentityFile: string;
  sshIdentityFiles: string[];
  sshAuthMode:
    | "auto"
    | "password"
    | "publicKey"
    | "agent"
    | "keyboardInteractive";
  sshProxyCommand: string;
  sshJumpHost: string;
  sshRemoteCommand: string;
  sshExtraArgs: string;
  sshKeepAliveInterval: number;
  sshKeepAliveCountMax: number;
  sshReadyTimeout: number;
  sshSkipBanner: boolean;
  sshForwardedPorts: Array<{
    id: string;
    type: "local" | "remote" | "dynamic";
    host: string;
    port: number;
    targetAddress: string;
    targetPort: number;
    description: string;
  }>;
  sshAlgorithms: {
    cipher: string[];
    kex: string[];
    hmac: string[];
    serverHostKey: string[];
    compression: string[];
  };
  cwd: string;
  env: string;
};

const BUILTIN_PREFIX = "builtin:";
const WSL_ENV = "TERM=xterm-color\nCOLORTERM=truecolor";

export async function listBuiltinTerminalProfiles(): Promise<
  BuiltinTerminalProfileDescriptor[]
> {
  const profiles: BuiltinTerminalProfileDescriptor[] = [
    createBuiltinProfile("system-default", {
      builtinKey: "systemDefault",
      name: "System default",
    }),
  ];

  if (process.platform === "win32") {
    for (const profile of listWindowsBuiltinProfiles()) {
      addUniqueProfile(profiles, profile);
    }
  } else {
    for (const profile of listUnixBuiltinProfiles()) {
      addUniqueProfile(profiles, profile);
    }
  }

  addUniqueProfile(
    profiles,
    createBuiltinProfile("ssh-template", {
      builtinKey: "sshConnection",
      kind: "ssh",
      name: "SSH connection",
      sshPort: 22,
      sshUser: "root",
    })
  );

  return profiles;
}

function listWindowsBuiltinProfiles(): BuiltinTerminalProfileDescriptor[] {
  const profiles: BuiltinTerminalProfileDescriptor[] = [];

  addIfPresent(profiles, resolveComSpec(), (shell) =>
    createBuiltinProfile("cmd", {
      args: "/k chcp 65001>nul",
      builtinKey: "cmd",
      name: "Command Prompt",
      shell,
    })
  );

  addIfPresent(profiles, findWindowsPowerShellCore(), (shell) =>
    createBuiltinProfile("pwsh", {
      args: "-NoLogo",
      builtinKey: "pwsh",
      name: "PowerShell 7",
      shell,
    })
  );

  addIfPresent(profiles, findWindowsPowerShell(), (shell) =>
    createBuiltinProfile("powershell", {
      args: "-NoLogo",
      builtinKey: "powershell",
      name: "PowerShell",
      shell,
    })
  );

  addIfPresent(profiles, findGitBashOnWindows(), (shell) =>
    createBuiltinProfile("git-bash", {
      args: "--login -i",
      builtinKey: "gitBash",
      name: "Git Bash",
      shell,
    })
  );

  for (const profile of listWslProfilesOnWindows()) {
    profiles.push(profile);
  }

  return profiles;
}

function listUnixBuiltinProfiles(): BuiltinTerminalProfileDescriptor[] {
  const profiles: BuiltinTerminalProfileDescriptor[] = [];
  for (const shell of findUnixShellCandidates()) {
    const normalized = shell.replace(/\\/g, "/").toLowerCase();
    if (normalized.includes("/zsh")) {
      addUniqueProfile(
        profiles,
        createBuiltinProfile("zsh", {
          args: "-l",
          builtinKey: "zsh",
          name: "zsh",
          shell,
        })
      );
    } else if (normalized.includes("/bash")) {
      addUniqueProfile(
        profiles,
        createBuiltinProfile("bash", {
          args: "-l",
          builtinKey: "bash",
          name: "bash",
          shell,
        })
      );
    }
  }
  return profiles;
}

function createBuiltinProfile(
  idSuffix: string,
  partial: Partial<BuiltinTerminalProfileDescriptor>
): BuiltinTerminalProfileDescriptor {
  return {
    args: partial.args || "",
    behaviorOnSessionEnd: partial.behaviorOnSessionEnd || "auto",
    builtinKey: partial.builtinKey,
    clearServiceMessagesOnConnect:
      partial.clearServiceMessagesOnConnect ?? false,
    color: partial.color || "#000000",
    cwd: partial.cwd || "",
    disableDynamicTitle: partial.disableDynamicTitle ?? false,
    env: partial.env || "",
    group: partial.group || "",
    icon: partial.icon || "",
    id: `${BUILTIN_PREFIX}${idSuffix}`,
    inputBackspace: partial.inputBackspace || "backspace",
    kind: partial.kind === "ssh" ? "ssh" : "local",
    loginScripts: partial.loginScripts || [],
    name: partial.name || idSuffix,
    shell: partial.shell || "",
    sshAlgorithms: partial.sshAlgorithms || {
      cipher: [],
      compression: [],
      hmac: [],
      kex: [],
      serverHostKey: [],
    },
    sshAuthMode: partial.sshAuthMode || "auto",
    sshExtraArgs: partial.sshExtraArgs || "",
    sshForwardedPorts: partial.sshForwardedPorts || [],
    sshHost: partial.sshHost || "",
    sshIdentityFile: partial.sshIdentityFile || "",
    sshIdentityFiles: partial.sshIdentityFiles || [],
    sshJumpHost: partial.sshJumpHost || "",
    sshKeepAliveCountMax: partial.sshKeepAliveCountMax ?? 3,
    sshKeepAliveInterval: partial.sshKeepAliveInterval ?? 0,
    sshPort: partial.sshPort ?? 22,
    sshProxyCommand: partial.sshProxyCommand || "",
    sshReadyTimeout: partial.sshReadyTimeout ?? 20_000,
    sshRemoteCommand: partial.sshRemoteCommand || "",
    sshSkipBanner: partial.sshSkipBanner ?? false,
    sshUser: partial.sshUser || "",
    terminalColorSchemeId: partial.terminalColorSchemeId || "",
  };
}

function addUniqueProfile(
  profiles: BuiltinTerminalProfileDescriptor[],
  profile: BuiltinTerminalProfileDescriptor
): void {
  const signature = getProfileSignature(profile);
  if (
    !profiles.some(
      (item) =>
        item.id === profile.id || getProfileSignature(item) === signature
    )
  ) {
    profiles.push(profile);
  }
}

function getProfileSignature(
  profile: BuiltinTerminalProfileDescriptor
): string {
  return [
    profile.kind,
    profile.shell.trim().toLowerCase(),
    profile.args.trim(),
    profile.sshHost.trim().toLowerCase(),
    profile.sshUser.trim().toLowerCase(),
    String(profile.sshPort),
    profile.sshRemoteCommand.trim(),
  ].join("|");
}

function addIfPresent(
  profiles: BuiltinTerminalProfileDescriptor[],
  value: string | null,
  create: (resolved: string) => BuiltinTerminalProfileDescriptor
): void {
  if (!value) {
    return;
  }
  profiles.push(create(value));
}

function isExecutable(filePath: string): boolean {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveComSpec(): string {
  const env = process.env.ComSpec || process.env.COMSPEC;
  if (env && existsSync(env)) {
    return env;
  }
  const systemRoot =
    process.env.SystemRoot || process.env.WINDIR || "C:\\Windows";
  const fallback = path.join(systemRoot, "System32", "cmd.exe");
  return existsSync(fallback) ? fallback : "cmd.exe";
}

function findWindowsPowerShellCore(): string | null {
  return (
    readRegistryValue(
      "HKLM",
      "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\pwsh.exe"
    ) ||
    readRegistryValue(
      "HKCU",
      "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\pwsh.exe"
    ) ||
    findCommandOnWindows("pwsh.exe") ||
    findExistingWindowsPath([
      path.join(
        process.env.ProgramFiles || "C:\\Program Files",
        "PowerShell",
        "7",
        "pwsh.exe"
      ),
      path.join(
        process.env.ProgramFiles || "C:\\Program Files",
        "PowerShell",
        "7-preview",
        "pwsh.exe"
      ),
      path.join(
        process.env.LocalAppData || "",
        "Microsoft",
        "WindowsApps",
        "pwsh.exe"
      ),
    ])
  );
}

function findWindowsPowerShell(): string | null {
  return (
    findCommandOnWindows("powershell.exe") ||
    findExistingWindowsPath([
      path.join(
        process.env.SystemRoot || process.env.WINDIR || "C:\\Windows",
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe"
      ),
      path.join(
        process.env.SystemRoot || process.env.WINDIR || "C:\\Windows",
        "System32",
        "powershell.exe"
      ),
    ])
  );
}

function findCommandOnWindows(command: string): string | null {
  const result = spawnSync("where.exe", [command], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  });
  if (result.status !== 0 || typeof result.stdout !== "string") {
    return null;
  }
  const first = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return first || null;
}

function findExistingWindowsPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function readRegistryValue(
  hive: "HKLM" | "HKCU",
  key: string,
  valueName = ""
): string | null {
  const args = ["query", `${hive}\\${key}`, valueName ? "/v" : "/ve"];
  if (valueName) {
    args.push(valueName);
  }
  const result = spawnSync("reg.exe", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  });
  if (result.status !== 0 || typeof result.stdout !== "string") {
    return null;
  }
  for (const line of result.stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("REG_")) {
      continue;
    }
    const match = trimmed.match(/^(.*?)\s+REG_\w+\s+(.*)$/);
    if (match?.[2]) {
      return match[2].trim() || null;
    }
  }
  return null;
}

function findGitBashOnWindows(): string | null {
  const installRoots = new Set<string>();

  for (const value of [
    readRegistryValue("HKLM", "Software\\GitForWindows", "InstallPath"),
    readRegistryValue("HKCU", "Software\\GitForWindows", "InstallPath"),
  ]) {
    if (value) {
      installRoots.add(value);
    }
  }

  for (const gitPath of [
    findCommandOnWindows("git.exe"),
    findExistingWindowsPath([
      "C:\\Program Files\\Git\\cmd\\git.exe",
      "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
      path.join(
        process.env.LocalAppData || "",
        "Programs",
        "Git",
        "cmd",
        "git.exe"
      ),
    ]),
  ]) {
    if (!gitPath) {
      continue;
    }
    const gitDir = path.dirname(gitPath);
    installRoots.add(gitDir);
    installRoots.add(path.dirname(gitDir));
  }

  for (const candidate of [
    "C:\\Program Files\\Git",
    "C:\\Program Files (x86)\\Git",
    path.join(process.env.LocalAppData || "", "Programs", "Git"),
  ]) {
    if (candidate) {
      installRoots.add(candidate);
    }
  }

  for (const root of installRoots) {
    for (const candidate of [
      path.join(root, "bin", "bash.exe"),
      path.join(root, "usr", "bin", "bash.exe"),
      path.join(root, "git-bash.exe"),
    ]) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function listWslProfilesOnWindows(): BuiltinTerminalProfileDescriptor[] {
  const wslPath = findCommandOnWindows("wsl.exe");
  if (!wslPath) {
    return [];
  }

  const profiles = [
    createBuiltinProfile("wsl", {
      builtinKey: "wsl",
      env: WSL_ENV,
      name: "WSL",
      shell: wslPath,
    }),
  ];

  for (const distro of listWslDistributionNames(wslPath)) {
    profiles.push(
      createBuiltinProfile(`wsl-${slugifyBuiltinIdFragment(distro)}`, {
        args: `-d "${distro}"`,
        env: WSL_ENV,
        name: `WSL / ${distro}`,
        shell: wslPath,
      })
    );
  }

  return profiles;
}

function listWslDistributionNames(wslPath: string): string[] {
  const result = spawnSync(wslPath, ["--list", "--quiet"], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  });
  if (result.status !== 0 || !result.stdout) {
    return [];
  }
  const text = decodeCommandOutput(result.stdout as Buffer);
  return Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.replace(/\u0000/g, "").trim())
        .filter((line) => /^[\p{L}\p{N}._-]+$/u.test(line))
    )
  );
}

function decodeCommandOutput(output: Buffer): string {
  if (output.length >= 2 && output[0] === 0xff && output[1] === 0xfe) {
    return output.toString("utf16le");
  }
  let zeroBytes = 0;
  for (let i = 1; i < output.length; i += 2) {
    if (output[i] === 0) {
      zeroBytes += 1;
    }
  }
  if (output.length > 4 && zeroBytes >= Math.floor(output.length / 4)) {
    return output.toString("utf16le");
  }
  return output.toString("utf8");
}

function slugifyBuiltinIdFragment(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "default";
}

function findUnixShellCandidates(): string[] {
  const candidates = new Set<string>();
  const envShell = process.env.SHELL?.trim();
  if (envShell && isExecutable(envShell)) {
    candidates.add(envShell);
  }
  for (const shellPath of [
    "/bin/bash",
    "/usr/bin/bash",
    "/usr/local/bin/bash",
    "/opt/homebrew/bin/bash",
    "/bin/zsh",
    "/usr/bin/zsh",
    "/usr/local/bin/zsh",
    "/opt/homebrew/bin/zsh",
  ]) {
    if (existsSync(shellPath) && isExecutable(shellPath)) {
      candidates.add(shellPath);
    }
  }
  return Array.from(candidates);
}
