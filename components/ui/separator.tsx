"use client";

import { Separator as MdevsSeparator } from "@mdevs/ui/primitives/separator";
import { MdevsIsland } from "@/components/ui/mdevs-island";

function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & {
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <MdevsIsland>
      <MdevsSeparator
        className={className}
        data-slot="separator"
        decorative={decorative}
        orientation={orientation}
        {...props}
      />
    </MdevsIsland>
  );
}

export { Separator };
