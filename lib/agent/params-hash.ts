import { createHash } from "node:crypto";
import { canonicalParamsKey } from "@/lib/agent/db-schema";

// Empreinte SHA-256 des paramètres exacts présentés à l'utilisateur. Toute
// modification du ToolCall produit une empreinte différente : l'accord devient
// caduc et une nouvelle demande doit être décidée. La sérialisation canonique
// (clés triées) garantit que deux objets équivalents ont la même empreinte.
export function paramsHashOf(params: unknown): string {
  return createHash("sha256").update(canonicalParamsKey(params)).digest("hex");
}
