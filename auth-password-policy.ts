// Politique de mot de passe PARTAGÉE entre les deux parcours de création de
// compte : le backend Hono (Val Town, `auth.ts`) et le parcours Next
// (`app/(auth)/actions.ts`). Un seul module, pur, sans dépendance : il tourne
// dans les deux runtimes (Deno côté Val Town, Node côté Next) et ne diverge
// jamais entre les deux.
//
// POURQUOI : l'API Hono n'appliquait qu'un contrôle truthy sur `password` ;
// un compte pouvait y être créé avec un mot de passe d'un caractère, alors que
// le parcours Next exigeait déjà 6 caractères. Les deux étapes (`/register`
// et `/verify-register`) appliquent désormais ce schéma, avant l'envoi de
// l'OTP et à nouveau lors de la validation.

/** Longueur minimale, alignée sur le parcours Next historique. */
export const PASSWORD_MIN_LENGTH = 6;

/**
 * Longueur maximale explicite.
 *
 * bcrypt tronque silencieusement au-delà de 72 octets : accepter plus long
 * laisserait croire à l'utilisateur que ses caractères supplémentaires
 * comptent, alors qu'ils sont ignorés par le hachage.
 */
export const PASSWORD_MAX_LENGTH = 72;

/**
 * Valide un mot de passe contre la politique commune.
 *
 * Renvoie `null` si le mot de passe est acceptable, sinon le message d'erreur
 * en français à présenter à l'utilisateur.
 */
export function checkPasswordPolicy(password: unknown): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "Le mot de passe est requis.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
  }
  return null;
}
