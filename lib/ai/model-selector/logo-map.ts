/**
 * Résolution de la source d'un logo de laboratoire.
 *
 * Deux origines, dans cet ordre :
 *
 * 1. `public/models/<fichier>.svg` — l'icône embarquée dans l'hôte. Elle est
 *    servie par notre propre CDN, sans requête tierce, et suit le thème.
 * 2. `https://models.dev/logos/<id>.svg` — le repli distant, pour les
 *    laboratoires que models.dev sert réellement.
 *
 * Pourquoi une table locale explicite : le nom du fichier ne suit pas la clé
 * canonique du fournisseur (`ibm` → `ibm-granite.svg`, `qwen` →
 * `qwen-alibaba.svg`, `amazon` → `amazon-bedrock.svg`…), et 19 laboratoires
 * n'ont aucune entrée dans la table d'alias. Sans table, l'icône locale
 * n'était jamais atteinte.
 *
 * Pourquoi une table `MODELS_DEV_IDS` distincte : l'identifiant models.dev
 * n'est PAS la clé canonique. La table d'alias réécrivait `amazon` en
 * `amazon`, alors que models.dev sert `amazon-bedrock` : la requête revenait
 * sur le glyphe générique du site, jamais sur le vrai logo.
 *
 * Fichier PUR : aucun import React, testable directement.
 */

import { normalizeProviderKey, PROVIDER_NAMES } from "./provider";

/** Répertoire public des icônes embarquées. */
export const LOCAL_LOGO_BASE = "/models";

/** Base du repli distant. */
export const MODELS_DEV_LOGO_BASE = "https://models.dev/logos";

/**
 * Icônes embarquées, indexées par clé canonique de fournisseur.
 *
 * Cette table est le catalogue de référence : le test d'inventaire vérifie
 * qu'elle et le dossier `public/models/` ne divergent jamais (ni fichier
 * manquant, ni fichier orphelin).
 */
export const LOCAL_LOGOS: Record<string, string> = {
  aionlabs: "aion-labs.svg",
  amazon: "amazon-bedrock.svg",
  "anthracite-org": "anthracite-org.svg",
  arceeai: "arcee-ai.svg",
  bytedance: "bytedance-seed.svg",
  cognitivecomputations: "cognitivecomputations.svg",
  "dots-studio": "dots-studio.svg",
  elorian: "elorian.svg",
  gryphe: "gryphe.svg",
  ibm: "ibm-granite.svg",
  "inclusion-ai": "inclusion-ai.svg",
  "inference-net": "inference-net.svg",
  "liquid-ai": "liquid-ai.svg",
  mai: "mai.svg",
  mancer: "mancer.svg",
  meituan: "meituan.svg",
  "meta-llama": "meta-llama.svg",
  moondream: "moondream.svg",
  morph: "morph.svg",
  nextagi: "nex-agi.svg",
  "nous-research": "nous-research.svg",
  "prism-ml": "prism-ml.svg",
  qwen: "qwen-alibaba.svg",
  rekaai: "reka-ai.svg",
  relace: "relace.svg",
  sakana: "sakana.svg",
  sao10k: "sao10k.svg",
  tencent: "tencent.svg",
  "the-drummer": "the-drummer.svg",
  typesafe: "typesafe.svg",
  unbiased: "unbiased.svg",
  "undi-95": "undi-95.svg",
  upstage: "upstage.svg",
  writer: "writer.svg",
  "xingchen-agi": "xingchen-agi.svg",
};

/**
 * Identifiants models.dev, pour les clés dont le nom diffère.
 *
 * Seules les différences sont listées : par défaut, l'identifiant distant est
 * la clé canonique elle-même.
 */
export const MODELS_DEV_IDS: Record<string, string> = {
  amazon: "amazon-bedrock",
  bytedance: "volcengine",
  "meta-llama": "meta",
  qwen: "alibaba",
};

export type LogoSource = {
  /** Clé canonique du fournisseur. */
  key: string;
  /** URL de l'image à afficher. */
  src: string;
  /** L'icône est-elle servie par l'hôte (et non par models.dev) ? */
  isLocal: boolean;
  /** Libellé lisible du laboratoire. */
  label: string;
};

/**
 * Mémo de résolution.
 *
 * Le sélecteur affiche une ligne par modèle : la même clé est normalisée des
 * dizaines de fois par ouverture de menu. La normalisation enchaîne une
 * trentaine de comparaisons, on la mémorise donc une fois pour toutes.
 */
const memo = new Map<string, LogoSource>();

export function resolveLogoSource(provider: string): LogoSource {
  const key = normalizeProviderKey(provider);
  const cached = memo.get(key);
  if (cached) {
    return cached;
  }

  const fichier = LOCAL_LOGOS[key];
  const source: LogoSource = fichier
    ? {
        isLocal: true,
        key,
        label: PROVIDER_NAMES[key] ?? key,
        src: `${LOCAL_LOGO_BASE}/${fichier}`,
      }
    : {
        isLocal: false,
        key,
        label: PROVIDER_NAMES[key] ?? key,
        src: `${MODELS_DEV_LOGO_BASE}/${MODELS_DEV_IDS[key] ?? key}.svg`,
      };

  memo.set(key, source);
  return source;
}
