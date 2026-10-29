import { describe, expect, it } from "vitest";
import {
  BLACKLINE_SETTINGS_MAX_BYTES,
  isValidBlacklineSettingsBody,
  normalizeBlacklineSettings,
} from "@/lib/blackline/settings";

/**
 * Les réglages du jeu Blackline sont normalisés par le serveur.
 *
 * Le contrat est celui de l'hôte : un réglage ILLISIBLE ne doit jamais
 * équivalent à une valeur fantôme. Il est ignoré, pas persisté, et il ne fait
 * jamais échouer l'enregistrement des AUTRES réglages — c'est le même
 * principe que le thème, le modèle par défaut ou le mode de création.
 */
describe("normalisation des réglages Blackline", () => {
  it("accepte les valeurs connues", () => {
    const resultat = normalizeBlacklineSettings({
      cameraMode: "third",
      fov: 100,
      quality: "balanced",
      volume: 0.4,
    });
    expect(resultat.cameraMode).toBe("third");
    expect(resultat.fov).toBe(100);
    expect(resultat.quality).toBe("balanced");
    expect(resultat.volume).toBe(0.4);
  });

  it("ignore les énumérations illisibles, sans les persister", () => {
    const resultat = normalizeBlacklineSettings({
      cameraMode: "deuxième",
      quality: "ultra",
    });
    // La clé illisible est ABSENTE : elle ne sera ni stockée ni rejouée.
    expect(resultat.cameraMode).toBeUndefined();
    expect("cameraMode" in resultat).toBe(false);
    // La clé valide, elle, est conservée.
    expect(resultat.quality).toBe("ultra");
  });

  it("borne les nombres dans l'intervalle du jeu", () => {
    const resultat = normalizeBlacklineSettings({
      fov: 500,
      sensitivity: 0.01,
      volume: 12,
    });
    expect(resultat.fov).toBe(110);
    expect(resultat.sensitivity).toBe(0.2);
    expect(resultat.volume).toBe(1);
  });

  it("complète les booléens absents par leur valeur par défaut", () => {
    const resultat = normalizeBlacklineSettings({});
    expect(resultat.autoClimb).toBe(true);
    expect(resultat.batterySaver).toBe(false);
    expect(resultat.showFPS).toBe(true);
  });

  it("accepte seulement une couleur de réticule hexadécimale", () => {
    expect(normalizeBlacklineSettings({ crosshair: "#D0E693" }).crosshair).toBe(
      "#d0e693"
    );
    expect(
      normalizeBlacklineSettings({ crosshair: "rouge" }).crosshair
    ).toBeUndefined();
  });

  it("borne la longueur de l'indicatif", () => {
    expect(
      normalizeBlacklineSettings({ callsign: "  OPÉRATEUR  " }).callsign
    ).toBe("OPÉRATEUR");
    expect(
      normalizeBlacklineSettings({ callsign: "x".repeat(100) }).callsign
    ).toHaveLength(18);
  });

  it("ne garde que des tables de touches bien formées", () => {
    const resultat = normalizeBlacklineSettings({
      bindings: {
        forward: ["KeyW", "ArrowUp"],
        melee: "KeyV",
        reload: ["KeyR", "KeyF", "KeyV", "KeyG"],
        sprint: ["KeyR2"],
      },
    });
    const bindings = resultat.bindings as Record<string, string[]>;
    expect(bindings.forward).toEqual(["KeyW", "ArrowUp"]);
    // Une action dont la valeur n'est pas un tableau est ignorée.
    expect("melee" in bindings).toBe(false);
    // Une touche que le jeu ne sait pas écouter est ignorée.
    expect("sprint" in bindings).toBe(false);
    // Le nombre de touches par action est borné.
    expect(bindings.reload).toHaveLength(3);
  });

  it("rejette tout ce qui n'est pas un objet", () => {
    expect(normalizeBlacklineSettings(null)).toEqual({});
    expect(normalizeBlacklineSettings(undefined)).toEqual({});
    expect(normalizeBlacklineSettings([])).toEqual({});
    expect(normalizeBlacklineSettings("réglages")).toEqual({});
    expect(normalizeBlacklineSettings(42)).toEqual({});
  });

  it("borne la taille du corps de requête", () => {
    expect(isValidBlacklineSettingsBody({ quality: "ultra" })).toBe(true);
    expect(isValidBlacklineSettingsBody([])).toBe(false);
    expect(isValidBlacklineSettingsBody("x")).toBe(false);
    // Un corps trop volumineux est refusé AVANT l'écriture : sans cela, une
    // clé de plusieurs mégaoctets finirait en base.
    const enorme = { notes: "x".repeat(BLACKLINE_SETTINGS_MAX_BYTES + 1) };
    expect(isValidBlacklineSettingsBody(enorme)).toBe(false);
  });
});
