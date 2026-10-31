/**
 * Catalogue de la boutique Quizzly.
 *
 * Les prix sont fixes : le client les affiche, le serveur les relit ici
 * avant de débiter. Un prix envoyé par le navigateur n'est jamais utilisé.
 */

export type ShopKind =
  | "boost"
  | "daily"
  | "frame"
  | "freeze"
  | "hearts"
  | "shield";

export type ShopItem = {
  description: string;
  id: string;
  kind: ShopKind;
  label: string;
  price: number;
};

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    description: "Cinq gemmes, une fois par jour. Minuit, heure de Paris.",
    id: "offre-jour",
    kind: "daily",
    label: "Offre du jour",
    price: 0,
  },
  {
    description:
      "Double l'XP des quiz pendant 10 minutes. L'achat active le booster, jusqu'à 30 minutes.",
    id: "booster-xp",
    kind: "boost",
    label: "Booster d'XP",
    price: 80,
  },
  {
    description:
      "Évite une descente de ligue pour la semaine en cours. Un bouclier à la fois.",
    id: "bouclier-ligue",
    kind: "shield",
    label: "Bouclier de ligue",
    price: 350,
  },
  {
    description: "Protège la série si un jour est manqué. Deux gels au plus.",
    id: "gel-serie",
    kind: "freeze",
    label: "Gel de série",
    price: 200,
  },
  {
    description: "Rend les cinq cœurs immédiatement.",
    id: "recharge-coeurs",
    kind: "hearts",
    label: "Recharge de cœurs",
    price: 100,
  },
  {
    description: "Un anneau discret autour de l'avatar.",
    id: "cadre-ardoise",
    kind: "frame",
    label: "Cadre ardoise",
    price: 80,
  },
  {
    description: "Un anneau vert autour de l'avatar.",
    id: "cadre-laurier",
    kind: "frame",
    label: "Cadre laurier",
    price: 180,
  },
  {
    description: "Un anneau doré autour de l'avatar.",
    id: "cadre-or",
    kind: "frame",
    label: "Cadre or",
    price: 420,
  },
];

export function articleBoutique(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((article) => article.id === id);
}

export function classeCadre(id: string | null): string {
  if (id === "cadre-laurier") {
    return "ring-2 ring-q-xp";
  }
  if (id === "cadre-or") {
    return "ring-2 ring-q-streak";
  }
  if (id === "cadre-ardoise") {
    return "ring-2 ring-q-level";
  }
  return "ring-1 ring-border";
}
