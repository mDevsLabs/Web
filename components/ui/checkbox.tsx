"use client";

import { CheckIcon } from "@mdevs/icons/controls/check";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type * as React from "react";
import { MdevsIsland } from "@/components/ui/mdevs-island";
import { cn } from "@/lib/utils";

// Le `Checkbox` du paquet exige un libellé et enveloppe le contrôle dans une
// rangée. Ici le libellé est déjà un `Label` voisin : on ne garde que la
// classe `md-checkbox`.
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <MdevsIsland>
      <CheckboxPrimitive.Root
        className={cn("md-checkbox", className)}
        data-slot="checkbox"
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className="flex items-center justify-center text-current"
          data-slot="checkbox-indicator"
        >
          <CheckIcon className="size-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </MdevsIsland>
  );
}

export { Checkbox };
