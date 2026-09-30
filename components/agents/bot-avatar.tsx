import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Identité « bot » : le disque et ses deux pastilles de `public/icons/bot.png`.
//
// L'image d'origine est un disque NOIR sur fond transparent. Posée telle quelle
// sur l'interface, elle disparaîtrait en thème sombre — le disque se confondrait
// avec le fond et il ne resterait que deux points blancs flottants.
//
// On l'utilise donc comme MASQUE CSS, pas comme image : seul le canal alpha
// compte, et la forme prend `currentColor`. Le même fichier rend alors un disque
// sombre en thème clair et un disque clair en thème sombre, sans second asset et
// sans branche par thème. C'est aussi ce qui permet de l'injecter partout où un
// glyphe Lucide était utilisé.
//
// Le PNG source (1254×1254, 773 Ko) est réduit en WebP 256×256 (4 Ko) ; le
// masque n'a besoin d'aucune netteté supplémentaire parce qu'il n'est jamais
// agrandi au-delà de 48px.

const BOT_MASK_URL = "/icons/bot.webp";

export type BotGlyphProps = {
  className?: string;
  /**
   * Couleur du glyphe, à la Lucide. Sans elle, le glyphe prend `currentColor`,
   * comme n'importe quel texte de l'interface.
   */
  color?: string;
  /**
   * Côté en pixels, à la Lucide. Sans lui, la taille vient de `className`
   * (`size-3.5`…). Les deux ne sont jamais mélangés : la présence de `size`
   * produit une largeur et une hauteur en ligne, qui l'emportent sur la classe.
   */
  size?: number | string;
  style?: CSSProperties;
};

/**
 * Le glyphe seul, à la couleur du texte parent.
 *
 * À utiliser quand le disque doit se fondre dans la surface : titre d'onglet,
 * entrée de menu, ligne de sélection.
 *
 * `color` et `size` existent pour que le glyphe puisse remplacer un composant
 * Lucide SANS changer les appelants : les registres d'icônes
 * (`components/agents/agent-registry.ts`, `components/agents/agent-icon.tsx`)
 * appellent leurs entrées avec `<Icon color="#fff" size={14} />`, et un glyphe
 * qui n'accepterait que `className` les aurait contraints de réécrire chaque
 * usage — donc de laisser une partie de l'interface sur l'ancienne icône.
 */
export function BotGlyph({ className, color, size, style }: BotGlyphProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        color,
        height: size,
        maskImage: `url(${BOT_MASK_URL})`,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: `url(${BOT_MASK_URL})`,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        width: size,
        ...style,
      }}
    />
  );
}

/**
 * Le glyphe sur une pastille — la forme qui a une présence dans une liste ou un
 * en-tête. La pastille est toujours l'inverse du texte qui la porte, donc le
 * contraste ne dépend pas du thème.
 */
export function BotAvatar({
  className,
  size = 40,
}: {
  className?: string;
  /** Côté de la pastille en pixels. Le glyphe occupe 72 % de ce côté. */
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-foreground text-background",
        className
      )}
      style={{ height: size, width: size }}
    >
      <BotGlyph style={{ height: size * 0.72, width: size * 0.72 }} />
    </span>
  );
}
