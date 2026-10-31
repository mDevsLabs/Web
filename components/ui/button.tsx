"use client";

import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { MdevsIsland } from "@/components/ui/mdevs-island";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "md-button-solid",
  destructive: "md-button-solid",
  ghost: "md-button-ghost",
  link: "md-link",
  outline: "md-button-outline",
  secondary: "md-button-soft",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  default: "md-button-md min-h-11 md:min-h-0",
  icon: "md-icon-button",
  "icon-lg": "md-icon-button md-button-lg",
  "icon-sm": "md-icon-button md-button-sm",
  "icon-xs": "md-icon-button md-button-sm",
  lg: "md-button-lg min-h-11 md:min-h-0",
  sm: "md-button-sm min-h-11 md:min-h-0",
  xs: "md-button-sm",
};

function buttonVariants({
  className,
  size = "default",
  variant = "default",
}: {
  className?: string;
  size?: ButtonSize | null;
  variant?: ButtonVariant | null;
}) {
  const resolvedVariant = variant ?? "default";
  const resolvedSize = size ?? "default";
  return cn(
    resolvedVariant === "link" ? "md-link" : "md-button",
    VARIANT_CLASS[resolvedVariant],
    resolvedVariant === "link" ? undefined : SIZE_CLASS[resolvedSize],
    className
  );
}

function Button({
  asChild = false,
  className,
  size = "default",
  style,
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  const Comp = asChild ? Slot.Root : "button";
  const destructive = variant === "destructive";

  return (
    <MdevsIsland>
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        data-size={size}
        data-slot="button"
        data-variant={variant}
        style={
          destructive
            ? {
                background: "var(--destructive)",
                color: "var(--destructive-foreground, #fff)",
                ...style,
              }
            : style
        }
        {...props}
      />
    </MdevsIsland>
  );
}

export { Button, buttonVariants };
