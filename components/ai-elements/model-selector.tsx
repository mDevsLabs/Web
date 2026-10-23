import type { ComponentProps, ReactNode } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Popover as PopoverPrimitive } from "radix-ui";
import { ModelDescription } from "@/lib/ai/model-selector/description";
import { cn } from "@/lib/utils";

export type ModelSelectorProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

export const ModelSelector = (props: ModelSelectorProps) => (
  <Popover {...props} />
);

export type ModelSelectorTriggerProps = ComponentProps<typeof PopoverTrigger>;

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
  <PopoverTrigger {...props} />
);

export type ModelSelectorContentProps = ComponentProps<typeof PopoverContent> & {
  commandDefaultValue?: ComponentProps<typeof Command>["defaultValue"];
  title?: ReactNode;
  shouldFilter?: boolean;
  filter?: ComponentProps<typeof Command>["filter"];
};

export const ModelSelectorContent = ({
  className,
  commandDefaultValue,
  children,
  title: _title,
  shouldFilter,
  filter,
  ...props
}: ModelSelectorContentProps) => (
  <PopoverContent
    align="start"
    className={cn(
      "w-[min(280px,calc(100vw-1rem))] p-0 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-float)]",
      className
    )}
    side="top"
    sideOffset={8}
    {...props}
  >
    <Command
      className="**:data-[slot=command-input-wrapper]:h-auto"
      defaultValue={commandDefaultValue}
      filter={filter}
      shouldFilter={shouldFilter}
    >
      {children}
    </Command>
  </PopoverContent>
);

export type ModelSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ModelSelectorInput = ({
  className,
  ...props
}: ModelSelectorInputProps) => (
  <CommandInput className={cn("h-auto py-2.5 text-[13px]", className)} {...props} />
);

export type ModelSelectorListProps = ComponentProps<typeof CommandList>;

export const ModelSelectorList = ({ className, ...props }: ModelSelectorListProps) => (
  <CommandList className={cn("max-h-[280px]", className)} {...props} />
);

export type ModelSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ModelSelectorEmpty = (props: ModelSelectorEmptyProps) => (
  <CommandEmpty {...props} />
);

export type ModelSelectorGroupProps = ComponentProps<typeof CommandGroup>;

export const ModelSelectorGroup = (props: ModelSelectorGroupProps) => (
  <CommandGroup {...props} />
);

export type ModelSelectorItemProps = ComponentProps<typeof CommandItem>;

export const ModelSelectorItem = ({ className, ...props }: ModelSelectorItemProps) => (
  <CommandItem className={cn("w-full text-[13px] rounded-lg", className)} {...props} />
);

export type ModelSelectorShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ModelSelectorShortcut = (props: ModelSelectorShortcutProps) => (
  <CommandShortcut {...props} />
);

export type ModelSelectorSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const ModelSelectorSeparator = (props: ModelSelectorSeparatorProps) => (
  <CommandSeparator {...props} />
);

// Le logo est partagé avec le sélecteur du Site officiel : une seule
// implémentation, donc un seul repli (étoile dorée) et une seule table
// d'alias de fournisseurs.
export {
  ModelSelectorLogo,
  type ModelSelectorLogoProps,
} from "@/lib/ai/model-selector/logo";

export type ModelSelectorLogoGroupProps = ComponentProps<"div">;

export const ModelSelectorLogoGroup = ({
  className,
  ...props
}: ModelSelectorLogoGroupProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center -space-x-1 [&>img]:rounded-full [&>img]:p-px [&>img]:ring-1 [&>img]:ring-border/30",
      className
    )}
    {...props}
  />
);

export type ModelSelectorNameProps = ComponentProps<"span">;

export const ModelSelectorName = ({
  className,
  ...props
}: ModelSelectorNameProps) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);

export type ModelSelectorDescriptionProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  /** Texte Markdown de la description. */
  children: string;
  /** Rendu sur une seule ligne, dans la liste du sélecteur. */
  compact?: boolean;
};

/**
 * Description d'un modèle, en Markdown.
 *
 * Les descriptions du catalogue sont écrites en Markdown : sans moteur, le
 * texte affichait sa syntaxe brute — `[Poolside](<https://poolside.ai/>)`.
 * Le rendu est mutualisé avec le Site officiel (cf. `lib/ai/model-selector/`
 * ) : un seul moteur Markdown dans l'application.
 */
export const ModelSelectorDescription = ({
  className,
  compact = false,
  ...props
}: ModelSelectorDescriptionProps) => (
  <ModelDescription
    className={cn("[&_a]:text-info", className)}
    compact={compact}
    {...props}
  />
);
