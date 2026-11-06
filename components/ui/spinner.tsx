"use client";

import { Spinner as MdevsSpinner } from "@mdevs/ui/primitives/spinner";
import { MdevsIsland } from "@/components/ui/mdevs-island";

function Spinner({
  className,
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <MdevsIsland>
      <MdevsSpinner className={className} data-slot="spinner" {...props} />
    </MdevsIsland>
  );
}

export { Spinner };
