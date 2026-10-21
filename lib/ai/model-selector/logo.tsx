/**
 * Logo d'un fournisseur de modèle.
 *
 * L'icône vient d'abord de l'hôte (`public/models/*.svg`) : elle est servie
 * par notre propre CDN, sans requête tierce, et suit le thème. Le repli
 * distant (`models.dev`) ne sert que les laboratoires que l'hôte n'embarque
 * pas. Un logo absent ou cassé ne doit pas laisser une image vide : on
 * retombe alors sur une étoile dorée.
 *
 * L'inversion en mode sombre est portée par la classe `dark:invert` : elle
 * suit `<html>`, ce qui convient au Site comme à l'hôte (le Site recopie le
 * thème résolu de l'hôte sur sa racine, cf. `components/site/theme-sync.tsx`).
 * Les marques embarquées et celles de models.dev sont toutes deux en
 * `currentColor` : l'inversion est donc correcte pour les deux, et l'étoile
 * de repli — déjà dorée — en est exemptée.
 */

import { type ComponentProps, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveLogoSource } from "./logo-map";

export type ModelSelectorLogoProps = Omit<
  ComponentProps<"img">,
  "src" | "alt"
> & {
  provider: string;
  /**
   * Taille en pixels, utilisée pour les attributs `width`/`height`.
   *
   * Elle doit correspondre à la classe de taille appliquée (`size-4` → 16,
   * `size-5` → 20) : les attributs HTML réservent la place avant le
   * chargement, et un attribut faux provoquait un décalage de mise en page.
   */
  pixelSize?: number;
};

// Repli élégant : belle étoile moderne à 5 branches dorée/ambre (non-Gemini)
const STAR_LOGO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><defs><linearGradient id="starG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><path fill="url(#starG)" stroke="#b45309" stroke-width="0.75" stroke-linejoin="round" d="M12 2l2.9 6.26L21.8 9.27l-5.1 4.73 1.38 6.75L12 17.35 5.92 20.75l1.38-6.75-5.1-4.73 6.9-1.01L12 2z"/></svg>`
)}`;

export const ModelSelectorLogo = ({
  provider,
  className,
  pixelSize = 16,
  ...props
}: ModelSelectorLogoProps) => {
  const source = resolveLogoSource(provider);

  // L'échec est mémorisé PAR CLÉ, pas sur le nœud DOM : le drapeau
  // `dataset.logoFallbackApplied` d'avant survivait au changement de
  // fournisseur, et une icône cassée restait collée à sa place même quand
  // la ligne portait ensuite un autre laboratoire.
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const failed = failedKey === source.key;

  return (
    <img
      {...props}
      alt={`${source.label} logo`}
      className={cn(
        "size-4 shrink-0 object-contain",
        !failed && "dark:invert",
        className
      )}
      decoding="async"
      height={pixelSize}
      loading="lazy"
      onError={() => setFailedKey(source.key)}
      src={failed ? STAR_LOGO_DATA_URI : source.src}
      width={pixelSize}
    />
  );
};
