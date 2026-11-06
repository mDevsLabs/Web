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
  {
    description: "Un anneau cyan scintillant pour les passionnés.",
    id: "cadre-diamant",
    kind: "frame",
    label: "Cadre diamant",
    price: 600,
  },
  {
    description: "Un anneau violet pourpre éclatant.",
    id: "cadre-amethyste",
    kind: "frame",
    label: "Cadre améthyste",
    price: 500,
  },
];

export type QuizzlyGift = {
  claimed: boolean;
  claimedAt?: string;
  gems?: number;
  hearts?: number;
  id: string;
  itemId?: string;
  itemLabel?: string;
  message?: string;
  recipientId: string;
  senderDisplayName: string;
  senderId: string;
  senderUsername: string;
  sentAt: string;
  xp?: number;
};

export const SHOP_KINDS: readonly ShopKind[] = [
  "boost",
  "daily",
  "frame",
  "freeze",
  "hearts",
  "shield",
];

export function estKindBoutique(valeur: string): valeur is ShopKind {
  return (SHOP_KINDS as readonly string[]).includes(valeur);
}

/**
 * Fusionne le catalogue statique et les articles persistés par l'administration.
 * Le client peut passer une liste déjà lue ; le serveur y ajoute la table.
 */
export function listerArticlesBoutique(
  customs: readonly ShopItem[] = []
): readonly ShopItem[] {
  const uniques = new Map<string, ShopItem>();
  for (const art of SHOP_ITEMS) {
    uniques.set(art.id, art);
  }
  for (const art of customs) {
    uniques.set(art.id, art);
  }
  return Array.from(uniques.values());
}

export function articleBoutique(
  id: string,
  extraItems: readonly ShopItem[] = []
): ShopItem | undefined {
  return (
    SHOP_ITEMS.find((article) => article.id === id) ||
    extraItems.find((article) => article.id === id)
  );
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
  if (id === "cadre-diamant") {
    return "ring-2 ring-cyan-400";
  }
  if (id === "cadre-amethyste") {
    return "ring-2 ring-purple-500";
  }
  return "ring-1 ring-border";
}
