"use client";

import { Input as MdevsInput } from "@mdevs/ui/primitives/input";
import type * as React from "react";
import { MdevsIsland } from "@/components/ui/mdevs-island";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <MdevsIsland>
      <MdevsInput className={className} data-slot="input" {...props} />
    </MdevsIsland>
  );
}

export { Input };
