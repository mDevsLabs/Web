export function getCometApiKey(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.COMET_API_KEY || "";
  }
  return "";
}

export const FALLBACK_IMAGE_MODELS = [
  {
    created: Math.floor(Date.now() / 1000) - 86_400 * 30,
    description:
      "Modèle de génération d'images ultra-rapide en 4 étapes par Black Forest Labs (Text-to-Image).",
    features: ["text-to-image"],
    id: "black-forest-labs/flux-1-schnell",
    model_type: "image",
    name: "FLUX.1 Schnell",
  },
  {
    created: Math.floor(Date.now() / 1000) - 86_400 * 30,
    description:
      "Modèle phare de haute précision pour la synthèse d'images photoréalistes et artistiques (Text-to-Image).",
    features: ["text-to-image"],
    id: "black-forest-labs/flux-1-dev",
    model_type: "image",
    name: "FLUX.1 Dev",
  },
  {
    created: Math.floor(Date.now() / 1000) - 86_400 * 15,
    description:
      "Le sommet de la qualité visuelle, cohérence typographique et détails avancés par Black Forest Labs.",
    features: ["text-to-image"],
    id: "black-forest-labs/flux-1.1-pro",
    model_type: "image",
    name: "FLUX 1.1 Pro",
  },
  {
    created: Math.floor(Date.now() / 1000) - 86_400 * 20,
    description:
      "Modèle de pointe de 8 milliards de paramètres de Stability AI pour une variété stylistique maximale.",
    features: ["text-to-image", "image-to-image"],
    id: "stabilityai/stable-diffusion-3.5-large",
    model_type: "image",
    name: "Stable Diffusion 3.5 Large",
  },
  {
    created: Math.floor(Date.now() / 1000) - 86_400 * 60,
    description:
      "Génération stylisée haut de gamme avec esthétique et prompt comprehension avancée.",
    features: ["text-to-image"],
    id: "midjourney/v6",
    model_type: "image",
    name: "Midjourney v6",
  },
  {
    created: Math.floor(Date.now() / 1000) - 86_400 * 10,
    description:
      "Génération vectorielle et matricielle spécialisée dans les logos, illustrations et design graphique.",
    features: ["text-to-image"],
    id: "recraft-ai/recraft-v3",
    model_type: "image",
    name: "Recraft V3",
  },
];
