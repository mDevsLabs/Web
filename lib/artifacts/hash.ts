/**
 * Empreinte de contenu partagée client/serveur pour la persistance fiable des
 * Artifacts et l'application des patches ciblés.
 *
 * Contraintes :
 * - synchrone : l'auto-sauvegarde et applyPatch ne peuvent pas être async ;
 * - déterministe sur tous les runtimes (Node server, navigateur, Vitest) :
 *   crypto.subtle n'est pas disponible partout ni stable pour ce besoin, on
 *   utilise donc un FNV-1a 32 bits pur JS, sans dépendance.
 *
 * Ce hash sert à détecter les conflits (« le document a changé depuis que
 * l'utilisateur a commencé à éditer ») et la péremption des propositions IA
 * (baseHash). Ce n'est pas un mécanisme de sécurité : une collision FNV-1a
 * est extrêmement improbable sur un document édité, et le pire cas reste une
 * sauvegarde écrasante classique, jamais une corruption.
 */

const FNV_OFFSET = 0x81_1c_9d_c5;
const FNV_PRIME = 0x01_00_01_93;

export function hashContent(content: string): string {
  let hash = FNV_OFFSET;

  for (let i = 0; i < content.length; i += 1) {
    const code = content.charCodeAt(i);

    // Les points de code hors BMP (emoji…) produisent deux unités UTF-16 :
    // c'est couvert naturellement par charCodeAt.
    hash ^= code;
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Représentation hexadécimale stable, préfixée pour la lisibilité en base.
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
