import { BotIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Un robot vectoriel garde ses yeux lisibles aux petites tailles et hérite
// de la couleur du texte : aucun masque bitmap ni chargement d'image requis.
export type BotGlyphProps = {
  className?: string;
  color?: string;
  size?: number | string;
  style?: CSSProperties;
};

export function BotGlyph({ className, color, size, style }: BotGlyphProps) {
  return (
    <BotIcon
      aria-hidden
      className={cn("shrink-0", className)}
      color={color}
      size={size}
      strokeWidth={1.75}
      style={style}
    />
  );
}

export function BotAvatar({
  className,
  size = 40,
}: {
  className?: string;
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
      <BotGlyph size={size * 0.65} />
    </span>
  );
}
