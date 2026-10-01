// Langues de dictée vocale et cibles de traduction.
//
// Deux listes distinctes pour deux moteurs distincts : la dictée passe par
// l'API Web Speech du navigateur (locales BCP-47), la traduction par DeepL
// (codes DeepL). Les confondre produit des traductions invalides — « pt-BR »
// est valide pour les deux, « en-US » ne l'est que pour la dictée.
//
// Module PUR : importé par des composants clients comme par des routes. Il ne
// doit contenir aucun accès base ni secret. La validation serveur s'appuie sur
// ces MÊMES listes — jamais sur une copie divergente.

// ── Dictée vocale ──────────────────────────────────────────────────────────

/** Valeur sentinelle : suivre la langue du navigateur. */
export const AUTO_DICTATION_LANGUAGE = "auto";

export const DICTATION_LANGUAGES: readonly { label: string; value: string }[] =
  [
    {
      label: "Automatique (langue du navigateur)",
      value: AUTO_DICTATION_LANGUAGE,
    },
    { label: "Français (France)", value: "fr-FR" },
    { label: "Français (Canada)", value: "fr-CA" },
    { label: "Français (Belgique)", value: "fr-BE" },
    { label: "Français (Suisse)", value: "fr-CH" },
    { label: "Anglais (États-Unis)", value: "en-US" },
    { label: "Anglais (Royaume-Uni)", value: "en-GB" },
    { label: "Anglais (Australie)", value: "en-AU" },
    { label: "Anglais (Canada)", value: "en-CA" },
    { label: "Anglais (Inde)", value: "en-IN" },
    { label: "Espagnol (Espagne)", value: "es-ES" },
    { label: "Espagnol (Mexique)", value: "es-MX" },
    { label: "Espagnol (Argentine)", value: "es-AR" },
    { label: "Allemand (Allemagne)", value: "de-DE" },
    { label: "Allemand (Autriche)", value: "de-AT" },
    { label: "Allemand (Suisse)", value: "de-CH" },
    { label: "Italien", value: "it-IT" },
    { label: "Portugais (Brésil)", value: "pt-BR" },
    { label: "Portugais (Portugal)", value: "pt-PT" },
    { label: "Néerlandais (Pays-Bas)", value: "nl-NL" },
    { label: "Néerlandais (Belgique)", value: "nl-BE" },
    { label: "Russe", value: "ru-RU" },
    { label: "Polonais", value: "pl-PL" },
    { label: "Turc", value: "tr-TR" },
    { label: "Arabe (Arabie saoudite)", value: "ar-SA" },
    { label: "Arabe (Égypte)", value: "ar-EG" },
    { label: "Chinois (simplifié)", value: "zh-CN" },
    { label: "Chinois (traditionnel)", value: "zh-TW" },
    { label: "Japonais", value: "ja-JP" },
    { label: "Coréen", value: "ko-KR" },
    { label: "Hindi", value: "hi-IN" },
    { label: "Indonésien", value: "id-ID" },
    { label: "Suédois", value: "sv-SE" },
    { label: "Danois", value: "da-DK" },
    { label: "Finnois", value: "fi-FI" },
    { label: "Norvégien", value: "nb-NO" },
    { label: "Tchèque", value: "cs-CZ" },
    { label: "Hongrois", value: "hu-HU" },
    { label: "Grec", value: "el-GR" },
    { label: "Hébreu", value: "he-IL" },
    { label: "Roumain", value: "ro-RO" },
    { label: "Ukrainien", value: "uk-UA" },
    { label: "Vietnamien", value: "vi-VN" },
    { label: "Thaï", value: "th-TH" },
  ];

/**
 * Ramène une valeur à une locale de dictée connue, sous sa forme canonique.
 *
 * BCP-47 rend la casse non signifiante pour les sous-balises langue et région :
 * `FR-fr`, `fr_fr` et `fr-FR` désignent la même locale. On normalise donc les
 * deux, sinon une préférence venue d'un cookie ou d'une ancienne ligne serait
 * rejetée alors qu'elle est parfaitement valide.
 *
 * Fail-safe sur « auto » : une préférence illisible, une locale retirée du
 * navigateur, une valeur absente — dans tous ces cas la dictée repart sur la
 * langue du navigateur, qui fonctionne toujours. Ne jamais renvoyer `null`
 * ici : le composeur ne distingue pas « pas de réglage » de « réglage cassé ».
 */
export function normalizeDictationLanguage(raw: unknown): string {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (!value) {
    return AUTO_DICTATION_LANGUAGE;
  }
  // On relit la liste plutôt que le Set : il faut rendre la forme CATALOGUÉE,
  // pas la forme reçue, pour que `rec.lang` reçoive toujours `fr-FR`.
  const known = DICTATION_LANGUAGES.find(
    (entry) => entry.value.toLowerCase() === value
  );
  return known?.value ?? AUTO_DICTATION_LANGUAGE;
}

// ── Traduction ─────────────────────────────────────────────────────────────

/**
 * Cibles DeepL. Le code est directement le `target_lang` de l'API : aucune
 * table de correspondance n'existe côté client, donc aucune dérive possible.
 */
export const TRANSLATION_TARGETS: readonly { code: string; label: string }[] = [
  { code: "EN", label: "Anglais" },
  { code: "FR", label: "Français" },
  { code: "ES", label: "Espagnol" },
  { code: "DE", label: "Allemand" },
  { code: "IT", label: "Italien" },
  { code: "PT-BR", label: "Portugais (Brésil)" },
  { code: "PT-PT", label: "Portugais (Portugal)" },
  { code: "NL", label: "Néerlandais" },
  { code: "RU", label: "Russe" },
  { code: "PL", label: "Polonais" },
  { code: "TR", label: "Turc" },
  { code: "AR", label: "Arabe" },
  { code: "ZH-HANS", label: "Chinois (simplifié)" },
  { code: "ZH-HANT", label: "Chinois (traditionnel)" },
  { code: "JA", label: "Japonais" },
  { code: "KO", label: "Coréen" },
  { code: "HI", label: "Hindi" },
  { code: "ID", label: "Indonésien" },
  { code: "VI", label: "Vietnamien" },
  { code: "TH", label: "Thaï" },
  { code: "SV", label: "Suédois" },
  { code: "DA", label: "Danois" },
  { code: "FI", label: "Finnois" },
  { code: "NB", label: "Norvégien" },
  { code: "CS", label: "Tchèque" },
  { code: "HU", label: "Hongrois" },
  { code: "EL", label: "Grec" },
  { code: "HE", label: "Hébreu" },
  { code: "RO", label: "Roumain" },
  { code: "UK", label: "Ukrainien" },
  { code: "BG", label: "Bulgare" },
  { code: "SK", label: "Slovaque" },
  { code: "SL", label: "Slovène" },
  { code: "ET", label: "Estonien" },
  { code: "LV", label: "Letton" },
  { code: "LT", label: "Lituanien" },
];

const TRANSLATION_TARGET_CODES = TRANSLATION_TARGETS.map((entry) => entry.code);

/** Codes acceptés par la route de traduction — source de vérité du zod. */
export const TRANSLATION_TARGET_CODE_LIST: readonly string[] =
  TRANSLATION_TARGET_CODES;

export const DEFAULT_TRANSLATION_TARGET = "EN";

/**
 * Normalise une cible de traduction vers un code DeepL, ou `null` si elle est
 * inconnue. `null` permet à l'appelant de trancher (400 en API, repli sur la
 * langue par défaut dans l'interface) au lieu d'accepter une cible muette.
 *
 * Accepte « en », « en-US », « EN_GB ». Une chaîne libre est refusée : la liste
 * est courte, l'interface est en français, et une cible inventée ne produirait
 * qu'une erreur d'API sans bénéfice pour l'utilisateur.
 */
export function normalizeTranslationTarget(raw: unknown): string | null {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/_/g, "-");
  if (!value) {
    return null;
  }
  if (TRANSLATION_TARGET_CODES.includes(value)) {
    return value;
  }
  // « EN-US », « EN-GB » : variantes anglophones utiles.
  if (value === "EN-US" || value === "EN-GB") {
    return value;
  }
  // Codes de base : « ZH » et « PT » ne sont pas des cibles DeepL, on les
  // oriente vers leur variante la plus courante.
  const aliases: Record<string, string> = {
    EN: "EN",
    PT: "PT-BR",
    ZH: "ZH-HANS",
  };
  return aliases[value] ?? null;
}

/** Libellé d'une cible, pour l'en-tête du bloc traduit. */
export function translationTargetLabel(code: string | null): string {
  if (!code) {
    return "traduit";
  }
  return (
    TRANSLATION_TARGETS.find((entry) => entry.code === code)?.label ?? code
  );
}
