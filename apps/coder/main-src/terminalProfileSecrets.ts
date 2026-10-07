import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { app, safeStorage } from "electron";

type SecretStoreShape = {
  passwords?: Record<string, string>;
};

const runtimePasswords = new Map<string, string>();

function getSecretsFilePath(): string {
  return path.join(
    app.getPath("userData"),
    "mai",
    "terminal-profile-secrets.json"
  );
}

function readSecretStore(): SecretStoreShape {
  const filePath = getSecretsFilePath();
  if (!existsSync(filePath)) {
    return {};
  }
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as SecretStoreShape;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed.passwords && typeof parsed.passwords !== "object")
    ) {
      throw new Error("invalid-shape");
    }
    return parsed;
  } catch (e) {
    // Fichier corrompu: backup au lieu d'effacer silencieusement tous les mots de passe.
    try {
      const bak = `${filePath}.corrupt-${Date.now()}.bak`;
      writeFileSync(bak, readFileSync(filePath), "utf8");
      console.error(
        `[terminalProfileSecrets] store corrompu, backup ${bak}:`,
        e
      );
    } catch {
      console.error("[terminalProfileSecrets] read failed:", e);
    }
    return {};
  }
}

function writeSecretStore(store: SecretStoreShape): void {
  const filePath = getSecretsFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  // Permissions restrictives (0o600) — secrets lisibles uniquement par l'utilisateur.
  writeFileSync(filePath, JSON.stringify(store, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    if (process.platform !== "win32") {
      chmodSync(filePath, 0o600);
    }
  } catch {
    /* ignore */
  }
}

function encodeSecret(secret: string): string {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return `safe:${safeStorage.encryptString(secret).toString("base64")}`;
    }
  } catch {
    /* fall back */
  }
  // Fallback plain: chiffré OS indisponible (Linux sans keyring). On lève
  // plutôt que d'écrire réversible silencieusement — l'appelant décide.
  // Pour compat ascendante on conserve le format plain: mais avec avertissement.
  console.warn(
    "[terminalProfileSecrets] safeStorage indisponible, stockage base64 réversible (configurez un keyring)."
  );
  return `plain:${Buffer.from(secret, "utf8").toString("base64")}`;
}

function decodeSecret(encoded: string): string | null {
  try {
    if (encoded.startsWith("safe:")) {
      const buffer = Buffer.from(encoded.slice(5), "base64");
      return safeStorage.decryptString(buffer);
    }
    if (encoded.startsWith("plain:")) {
      return Buffer.from(encoded.slice(6), "base64").toString("utf8");
    }
    return Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function hasTerminalProfilePassword(profileId: string): boolean {
  if (!profileId.trim()) {
    return false;
  }
  const store = readSecretStore();
  return Boolean(store.passwords?.[profileId]);
}

export function getTerminalProfilePassword(profileId: string): string | null {
  if (!profileId.trim()) {
    return null;
  }
  const runtime = runtimePasswords.get(profileId);
  if (runtime) {
    return runtime;
  }
  const encoded = readSecretStore().passwords?.[profileId];
  return encoded ? decodeSecret(encoded) : null;
}

export function setTerminalProfileRuntimePassword(
  profileId: string,
  password: string
): boolean {
  if (!profileId.trim() || !password) {
    return false;
  }
  runtimePasswords.set(profileId, password);
  return true;
}

export function setTerminalProfilePassword(
  profileId: string,
  password: string
): boolean {
  if (!profileId.trim() || !password) {
    return false;
  }
  runtimePasswords.set(profileId, password);
  const store = readSecretStore();
  store.passwords = {
    ...(store.passwords || {}),
    [profileId]: encodeSecret(password),
  };
  writeSecretStore(store);
  return true;
}

export function clearTerminalProfilePassword(profileId: string): boolean {
  if (!profileId.trim()) {
    return false;
  }
  runtimePasswords.delete(profileId);
  const store = readSecretStore();
  if (!store.passwords?.[profileId]) {
    return false;
  }
  delete store.passwords[profileId];
  writeSecretStore(store);
  return true;
}
