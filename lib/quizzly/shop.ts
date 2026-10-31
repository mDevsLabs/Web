/**
 * Catalogue de la boutique Quizzly.
 *
 * Les prix sont fixes : le client les affiche, le serveur les relit ici
 * avant de débiter. Un prix envoyé par le navigateur n'est jamais utilisé.
 */

export type ShopKind = "frame" | "freeze" | "hearts";

export type ShopItem = {
  description: string;
  id: string;
  kind: ShopKind;
  label: string;
  price: number;
};

export const SHOP_ITEMS: readonly ShopItem[] = [
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
    return "ring-2 ring-success";
  }
  if (id === "cadre-or") {
    return "ring-2 ring-warning";
  }
  if (id === "cadre-ardoise") {
    return "ring-2 ring-foreground/40";
  }
  return "ring-1 ring-border";
}
