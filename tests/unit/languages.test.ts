import { describe, expect, it } from "vitest";
import {
  AUTO_DICTATION_LANGUAGE,
  DEFAULT_TRANSLATION_TARGET,
  DICTATION_LANGUAGES,
  normalizeDictationLanguage,
  normalizeTranslationTarget,
  TRANSLATION_TARGETS,
  translationTargetLabel,
} from "@/lib/i18n/languages";

// Ces listes sont partagées entre le sélecteur de l'interface et le validateur
// serveur. Une divergence se traduirait par un réglage affiché mais refusé à
// l'enregistrement — ou pire, par une cible DeepL inexistante envoyée à l'API.

describe("normalizeDictationLanguage", () => {
  it("accepte une locale cataloguée", () => {
    expect(normalizeDictationLanguage("fr-FR")).toBe("fr-FR");
    expect(normalizeDictationLanguage("en-US")).toBe("en-US");
  });

  it("retombe sur « auto » pour toute valeur illisible", () => {
    // Fail-safe obligatoire : la dictée ne doit jamais être bloquée par une
    // préférence corrompue ou par une locale retirée du navigateur.
    expect(normalizeDictationLanguage("")).toBe(AUTO_DICTATION_LANGUAGE);
    expect(normalizeDictationLanguage(null)).toBe(AUTO_DICTATION_LANGUAGE);
    expect(normalizeDictationLanguage(undefined)).toBe(AUTO_DICTATION_LANGUAGE);
    expect(normalizeDictationLanguage("xx-YY")).toBe(AUTO_DICTATION_LANGUAGE);
    expect(normalizeDictationLanguage("klingon")).toBe(AUTO_DICTATION_LANGUAGE);
  });

  it("tolère la casse et les espaces", () => {
    expect(normalizeDictationLanguage("  FR-fr ")).toBe("fr-FR");
  });
});

describe("normalizeTranslationTarget", () => {
  it("accepte les codes catalogués", () => {
    expect(normalizeTranslationTarget("EN")).toBe("EN");
    expect(normalizeTranslationTarget("PT-BR")).toBe("PT-BR");
    expect(normalizeTranslationTarget("ZH-HANT")).toBe("ZH-HANT");
  });

  it("tolère la casse, les espaces et le séparateur underscore", () => {
    expect(normalizeTranslationTarget(" en ")).toBe("EN");
    expect(normalizeTranslationTarget("pt_br")).toBe("PT-BR");
  });

  it("oriente les codes de base vers une variante DeepL réelle", () => {
    // `PT` et `ZH` seuls ne sont PAS des cibles DeepL acceptées : les mapper
    // sur une variante évite un 400 de l'API pour une saisie évidente.
    expect(normalizeTranslationTarget("PT")).toBe("PT-BR");
    expect(normalizeTranslationTarget("ZH")).toBe("ZH-HANS");
  });

  it("refuse une cible inconnue au lieu de deviner", () => {
    // `null` et non une valeur par défaut : à l'API cela donne un 400, dans
    // l'interface un repli explicite. Traduire en une langue inventée serait
    // pire qu'un refus.
    expect(normalizeTranslationTarget("")).toBeNull();
    expect(normalizeTranslationTarget("klingon")).toBeNull();
    expect(normalizeTranslationTarget("XX")).toBeNull();
  });
});

describe("cohérence des listes", () => {
  it("propose « auto » en première position de la dictée", () => {
    expect(DICTATION_LANGUAGES[0].value).toBe(AUTO_DICTATION_LANGUAGE);
  });

  it("ne contient ni doublon ni locale vide", () => {
    const values = DICTATION_LANGUAGES.map((entry) => entry.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values.every((value) => value.trim().length > 0)).toBe(true);

    const codes = TRANSLATION_TARGETS.map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => code.trim().length > 0)).toBe(true);
  });

  it("étiquette une cible par son nom lisible", () => {
    expect(translationTargetLabel("EN")).toBe("Anglais");
    expect(translationTargetLabel("ZZ")).toBe("ZZ");
    expect(translationTargetLabel(null)).toBe("traduit");
  });

  it("utilise une cible DeepL par défaut", () => {
    expect(() =>
      normalizeTranslationTarget(DEFAULT_TRANSLATION_TARGET)
    ).not.toThrow();
    expect(
      normalizeTranslationTarget(DEFAULT_TRANSLATION_TARGET)
    ).not.toBeNull();
  });
});
