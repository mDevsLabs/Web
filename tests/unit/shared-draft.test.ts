import { describe, expect, it } from "vitest";
import { createPreserveSignal } from "@/hooks/use-shared-draft";
import { resolveUserIdScope } from "@/lib/stats/sql-helpers";

// Le correctif de la bascule Chat ⇄ Agent repose sur un signal à durée d'une
// navigation, et la page Statistiques repose sur le périmètre d'identité.
// Ce dépôt teste en environnement `node`, sans testing-library : on verrouille
// donc la logique pure derrière ces deux comportements, pas le rendu.

describe("Signal de conservation du brouillon", () => {
  it("ne signale rien tant qu'aucune bascule n'est demandée", () => {
    const signal = createPreserveSignal();
    expect(signal.consume()).toBe(false);
  });

  it("signale une fois, puis plus jamais", () => {
    // C'est LA propriété qui rend le correctif sûr : le signal vaut pour une
    // seule navigation. Consommer (et non lire) est ce qui empêche l'exception
    // de devenir une fuite — un vrai changement de conversation suivant
    // purgerait normalement.
    const signal = createPreserveSignal();
    signal.request();
    expect(signal.consume()).toBe(true);
    expect(signal.consume()).toBe(false);
  });

  it("se réarme pour une nouvelle bascule", () => {
    const signal = createPreserveSignal();
    signal.request();
    expect(signal.consume()).toBe(true);
    // Un second aller-retour Chat → Agent → Chat doit être traité comme le
    // premier, sinon le brouillon disparaîtrait dès le deuxième passage.
    signal.request();
    expect(signal.consume()).toBe(true);
  });

  it("ne confond pas deux demandes consécutives en un seul signal", () => {
    const signal = createPreserveSignal();
    signal.request();
    signal.request();
    // Deux requêtes avant consommation valent toujours UNE navigation à
    // préserver, pas deux : le compteur reste un booléen, pas une file.
    expect(signal.consume()).toBe(true);
    expect(signal.consume()).toBe(false);
  });

  it("ne fuit pas d'état entre deux instances", () => {
    const first = createPreserveSignal();
    const second = createPreserveSignal();
    first.request();
    expect(second.consume()).toBe(false);
  });
});

describe("Périmètre d'identité des statistiques", () => {
  it("retient les deux formes d'identifiant du compte", () => {
    // `userId` est un `text` libre et `recordTokenUsage` y écrit
    // `userId || userEmail` : filtrer sur le seul identifiant courant ferait
    // disparaître silencieusement l'historique écrit sous la forme email.
    expect(resolveUserIdScope({ email: "marie@exemple.fr", id: "42" })).toEqual(
      ["42", "marie@exemple.fr"]
    );
  });

  it("déduplique un identifiant identique aux deux champs", () => {
    expect(resolveUserIdScope({ email: "meme", id: "meme" })).toEqual(["meme"]);
  });

  it("ignore les champs vides ou absents", () => {
    expect(resolveUserIdScope({ email: "", id: "42" })).toEqual(["42"]);
    expect(resolveUserIdScope({ email: null, id: null })).toEqual([]);
    expect(resolveUserIdScope({})).toEqual([]);
    // Un champ blanc ne doit pas devenir une entrée `""` qui ne matche rien.
    expect(resolveUserIdScope({ email: "   ", id: "42" })).toEqual(["42"]);
  });
});
