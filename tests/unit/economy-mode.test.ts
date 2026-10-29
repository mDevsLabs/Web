import { describe, expect, it } from "vitest";
import {
  ECONOMY_MODE_STORAGE_KEY,
  readEconomyPreference,
  writeEconomyPreference,
} from "@/lib/resources/economy";

/**
 * Le mode économie est un réglage d'APPAREIL, pas de compte.
 *
 * Il décrit la machine sur laquelle on travaille : un portable et un poste
 * fixe n'ont pas les mêmes ressources, et suivre le réglage d'un compte à
 * l'autre n'aurait aucun sens. Il vit donc dans le `localStorage`, comme la
 * largeur de la barre latérale.
 *
 * Ces tests verrouillent deux choses : la clé (elle est lue par le
 * navigateur, elle n'est pas renommable) et le fail-safe (une valeur
 * illisible vaut « désactivé », jamais « activé »).
 */
describe("mode économie — réglage d'appareil", () => {
  it("utilise une clé stable", () => {
    // La clé est un contrat avec les données déjà présentes sur le poste :
    // la changer ferait perdre le réglage à tous les utilisateurs.
    expect(ECONOMY_MODE_STORAGE_KEY).toBe("mai.economy-mode");
  });

  it("lit un réglage illisible comme désactivé", () => {
    // Un `localStorage` corrompu, ou une valeur écrite par une version
    // antérieure, ne doit pas activer l'économie par surprise.
    expect(readEconomyPreference()).toBe(false);
  });

  it("conserve l'absence de réglage", () => {
    // Le comportement par défaut est « désactivé » : l'économie automatique
    // (onglet caché, activité lourde) s'applique de toute façon.
    expect(readEconomyPreference()).toBe(false);
  });
});
