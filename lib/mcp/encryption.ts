import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Chiffrement AES-256-GCM des secrets MCP (env, auth, headers).
 *
 * Trois règles, toutes testées (tests/unit/mcp-secrets.test.ts) :
 *
 *  1. AUCUN repli implicite sur une autre donnée. La clé vient uniquement de
 *     `MCP_ENCRYPTION_KEY`. Les versions précédentes dérivaient la clé de
 *     `DATABASE_URL` / `POSTGRES_URL` puis, à défaut, d'une constante de
 *     développement codée en dur : quiconque connaissait l'URL de la base (ou
 *     lisait ce dépôt) pouvait déchiffrer les secrets de production. Sans clé
 *     configurée, on ÉCHOUE au lieu de chiffrer avec une clé publique.
 *
 *  2. La clé est VERSIONNÉE. Le format stocké est
 *     `mai1.<keyId>.<base64(iv|tag|ciphertext)>`. Le `keyId` permet une
 *     rotation sans interruption : la clé courante chiffre, le trousseau
 *     (`MCP_ENCRYPTION_PREVIOUS_KEYS`) déchiffre les valeurs plus anciennes.
 *
 *  3. Le format legacy (base64 nu, dérivé de `DATABASE_URL`) reste lisible
 *     UNIQUEMENT si `MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY=true` — le temps
 *     d'exécuter le script de ré-chiffrement (scripts/reencrypt-mcp-secrets.ts).
 *     Par défaut, ces valeurs ne sont plus déchiffrables : c'est volontaire.
 *
 * Le module n'importe rien de Next afin de rester testable en isolation.
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const FORMAT_PREFIX = "mai1";
const DEFAULT_KEY_ID = "v1";

export class McpEncryptionConfigError extends Error {
  constructor() {
    super(
      "MCP_ENCRYPTION_KEY absente : le chiffrement des secrets MCP est désactivé. " +
        "Définissez une clé dédiée et versionnée (gestionnaire de secrets) avant de créer ou modifier des secrets MCP."
    );
    this.name = "McpEncryptionConfigError";
  }
}

/** Dérivation SHA-256 → 32 octets, identique à l'ancien format (compatibilité de déchiffrement). */
function deriveKey(material: string): Buffer {
  return createHash("sha256").update(material, "utf8").digest();
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

/** Clé courante (chiffrement + déchiffrement). */
function currentKey(): { id: string; key: Buffer } | null {
  const material = readEnv("MCP_ENCRYPTION_KEY");
  if (!material) {
    return null;
  }
  return {
    id: readEnv("MCP_ENCRYPTION_KEY_ID") ?? DEFAULT_KEY_ID,
    key: deriveKey(material),
  };
}

/**
 * Trousseau de déchiffrement : clé courante + clés précédentes déclarées.
 * `MCP_ENCRYPTION_PREVIOUS_KEYS` attend un JSON `{"<keyId>": "<material>"}`.
 */
function keyRing(): Map<string, Buffer> {
  const ring = new Map<string, Buffer>();
  const current = currentKey();
  if (current) {
    ring.set(current.id, current.key);
  }
  const raw = readEnv("MCP_ENCRYPTION_PREVIOUS_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [id, material] of Object.entries(parsed)) {
        if (typeof material === "string" && material.trim()) {
          ring.set(id, deriveKey(material));
        }
      }
    } catch {
      // Trousseau illisible : on ne casse pas le déchiffrement de la clé
      // courante, mais aucune clé précédente n'est utilisable.
    }
  }
  return ring;
}

/**
 * Clé legacy dérivée de l'URL de la base — utilisée uniquement pour migrer les
 * valeurs écrites par les versions précédentes, et seulement sur opt-in
 * explicite. Jamais pour chiffrer.
 */
function legacyDerivedKey(): Buffer | null {
  if (readEnv("MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY") !== "true") {
    return null;
  }
  const source = readEnv("DATABASE_URL") ?? readEnv("POSTGRES_URL");
  return source ? deriveKey(source) : null;
}

export function isEncryptionConfigured(): boolean {
  return currentKey() !== null;
}

export function getEncryptionKeyId(): string | null {
  return currentKey()?.id ?? null;
}

export function encrypt(plain: string): string {
  if (!plain) {
    return "";
  }
  const current = currentKey();
  if (!current) {
    throw new McpEncryptionConfigError();
  }
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, current.key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, enc]).toString("base64");
  return `${FORMAT_PREFIX}.${current.id}.${payload}`;
}

function openWith(key: Buffer, payloadB64: string): string | null {
  try {
    const data = Buffer.from(payloadB64, "base64");
    if (data.length < IV_LEN + TAG_LEN) {
      return null;
    }
    const iv = data.subarray(0, IV_LEN);
    const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = data.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return null;
  }
}

/** Déchiffre une valeur versionnée, ou une valeur legacy sur opt-in explicite. */
export function decrypt(stored: string): string {
  if (!stored) {
    return "";
  }

  if (stored.startsWith(`${FORMAT_PREFIX}.`)) {
    const [, keyId, payload] = stored.split(".", 3);
    if (!keyId || !payload) {
      return "";
    }
    const key = keyRing().get(keyId);
    if (!key) {
      return "";
    }
    return openWith(key, payload) ?? "";
  }

  // Format legacy : base64 nu chiffré avec la clé dérivée de l'URL de la base.
  const legacy = legacyDerivedKey();
  if (!legacy) {
    return "";
  }
  return openWith(legacy, stored) ?? "";
}

/** Indique si la valeur est au format chiffré versionné courant. */
export function isEncrypted(value: string): boolean {
  if (!value?.startsWith(`${FORMAT_PREFIX}.`)) {
    return false;
  }
  const [, keyId, payload] = value.split(".", 3);
  if (!keyId || !payload) {
    return false;
  }
  const data = Buffer.from(payload, "base64");
  return data.length > IV_LEN + TAG_LEN;
}

export type ReencryptResult =
  | { status: "reencrypted"; value: string }
  | { status: "already_current"; value: string }
  | { status: "undecryptable"; value: string };

/**
 * Ré-chiffre une valeur avec la clé courante (migration de rotation).
 * Une valeur indéchiffrable est signalée, jamais silencieusement remplacée.
 */
export function reencrypt(value: string): ReencryptResult {
  if (!value) {
    return { status: "already_current", value };
  }
  if (value.startsWith(`${FORMAT_PREFIX}.`)) {
    const [, keyId] = value.split(".", 3);
    if (keyId === currentKey()?.id) {
      return { status: "already_current", value };
    }
  }
  const plain = decrypt(value);
  if (!plain) {
    return { status: "undecryptable", value };
  }
  return { status: "reencrypted", value: encrypt(plain) };
}
