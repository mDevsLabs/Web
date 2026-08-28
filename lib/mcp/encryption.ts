import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Chiffrage AES-256-GCM pour les secrets MCP (env, auth, headers).
 * Format stocké : base64(iv(12) + authTag(16) + ciphertext)
 * Clé : dérivée automatiquement en SHA-256 (32 bytes) à partir de
 *       process.env.MCP_ENCRYPTION_KEY / ENCRYPTION_KEY / DATABASE_URL.
 * Aucun format manuel requis — toute valeur est hashée en SHA-256.
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  // Source : MCP_ENCRYPTION_KEY > ENCRYPTION_KEY > DATABASE_URL > fallback dev
  const raw =
    process.env.MCP_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "";
  const source = raw?.trim() || "mAI-Web-MCP-Default-Dev-Key-2026-not-for-prod";
  if (!raw?.trim()) {
    if (!(globalThis as any).__mcpKeyWarned) {
      (globalThis as any).__mcpKeyWarned = true;
      console.warn(
        "[mcp/encryption] MCP_ENCRYPTION_KEY manquante — clé dérivée automatiquement en SHA-256 depuis fallback dev (non sécurisé). Définir MCP_ENCRYPTION_KEY en prod."
      );
    }
  }
  // Dérivation automatique SHA-256 → 32 bytes systématiques
  return createHash("sha256").update(source, "utf8").digest();
}

export function encrypt(plain: string): string {
  if (!plain) return "";
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(cipherB64: string): string {
  if (!cipherB64) return "";
  try {
    const key = getKey();
    const data = Buffer.from(cipherB64, "base64");
    if (data.length < IV_LEN + TAG_LEN) return "";
    const iv = data.subarray(0, IV_LEN);
    const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = data.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return "";
  }
}

export function isEncrypted(value: string): boolean {
  if (!value) return false;
  // heuristique: base64 et longueur > 30
  if (value.length < 30) return false;
  try {
    const b = Buffer.from(value, "base64");
    return b.length > IV_LEN + TAG_LEN;
  } catch {
    return false;
  }
}
