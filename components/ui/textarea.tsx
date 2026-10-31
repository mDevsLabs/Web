"use client";

import { Textarea as MdevsTextarea } from "@mdevs/ui/primitives/textarea";
import type * as React from "react";
import { MdevsIsland } from "@/components/ui/mdevs-island";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <MdevsIsland>
      <MdevsTextarea
        className={className}
        data-slot="textarea"
        {...props}
      />
    </MdevsIsland>
  );
}

export { Textarea };
