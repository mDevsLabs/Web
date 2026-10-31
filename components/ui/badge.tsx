"use client";

import { Slot } from "radix-ui";
import type * as React from "react";
import { MdevsIsland } from "@/components/ui/mdevs-island";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

const TONE: Record<BadgeVariant, string> = {
  default: "accent",
  destructive: "danger",
  ghost: "neutral",
  link: "neutral",
  outline: "neutral",
  secondary: "neutral",
};

function badgeVariants({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: BadgeVariant | null;
}) {
  return cn("md-badge", className);
}

function Badge({
  asChild = false,
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  asChild?: boolean;
  variant?: BadgeVariant;
}) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <MdevsIsland>
      <Comp
        className={cn(badgeVariants({ className, variant }))}
        data-slot="badge"
        data-tone={TONE[variant]}
        data-variant={variant}
        {...props}
      />
    </MdevsIsland>
  );
}

export { Badge, badgeVariants };
