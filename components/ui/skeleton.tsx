"use client";

import { MdevsIsland } from "@/components/ui/mdevs-island";
import { cn } from "@/lib/utils";

// Le squelette du paquet fixe largeur et hauteur en style inline, ce qui
// écrase les classes `h-*` / `w-*` des appelants. On garde la classe
// `md-skeleton` (animation et teinte) et la taille vient du parent.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <MdevsIsland>
      <div
        className={cn("md-skeleton", className)}
        data-slot="skeleton"
        {...props}
      />
    </MdevsIsland>
  );
}

export { Skeleton };
