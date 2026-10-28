import "server-only";

import { createHash, randomInt } from "node:crypto";
import { timingSafeCompare } from "@/lib/security/timing";

// SHA-256 simple, sans sel : choix produit explicite. Le PIN a une faible
// entropie (4 à 6 chiffres) ; la limitation des tentatives est la protection
// contre l'attaque en ligne. Ne jamais exposer ce hash par une route.
export function hashChatPin(pin: string): string {
  return createHash("sha256").update(pin, "utf8").digest("hex");
}

export function verifyChatPin(pin: string, expectedHash: string): boolean {
  return timingSafeCompare(hashChatPin(pin), expectedHash);
}

// Six chiffres, générés par `randomInt` (jamais `Math.random`).
export function generateChatPinResetCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Le chatId sert de séparation de domaine : deux conversations qui reçoivent
// le même code n'ont pas le même hash stocké.
export function hashChatPinResetCode({
  chatId,
  code,
}: {
  chatId: string;
  code: string;
}): string {
  return createHash("sha256").update(`${chatId}:${code}`, "utf8").digest("hex");
}
