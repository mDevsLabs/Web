"use client";

import { Popover } from "radix-ui";
import { mdevsScopeProps, useMdevsTheme } from "@/components/ui/mdevs-island";
import { cn } from "@/lib/utils";

function PopoverRoot({ ...props }: React.ComponentProps<typeof Popover.Root>) {
  return <Popover.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof Popover.Trigger>) {
  return <Popover.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof Popover.Anchor>) {
  return <Popover.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Popover.Content>) {
  const theme = useMdevsTheme();
  return (
    <Popover.Portal>
      <Popover.Content
        align={align}
        className={cn("md-root md-popover z-50 outline-hidden", className)}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...mdevsScopeProps(theme)}
        {...props}
      />
    </Popover.Portal>
  );
}

export { PopoverRoot as Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
