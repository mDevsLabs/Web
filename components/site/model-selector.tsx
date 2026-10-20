/**
 * Sélecteur de modèle — variante Site officiel.
 *
 * Le composant est celui du Chat et de l'Agent (`ModelSelectorCompact`), mais
 * habillé de la charte du Site : le Site a sa propre palette (`slate-*`,
 * `purple-*`) et ses propres tokens, ceux de l'hôte (`bg-card`,
 * `text-muted-foreground`) n'y existent pas.
 *
 * Deux différences structurelles, pas seulement de style :
 *
 * 1. **Le Portal est accroché dans `.site-root`.** `components/ui/popover.tsx`
 *    monte son contenu dans `document.body`, hors de `.site-root` — ce qui
 *    viole la règle d'isolation du Site (docs/5-site/AGENTS.md, Règle n° 2) :
 *    le popover perdrait les variables de thème et sortirait du périmètre
 *    visuel du Site.
 * 2. **La logique de catalogue est partagée**, pas dupliquée : résolution du
 *    fournisseur, niveaux d'effort de réflexion et filtres vivent dans
 *    `lib/ai/model-selector/`.
 */

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
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
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ModelSelectorProps = React.ComponentProps<
  typeof PopoverPrimitive.Root
>;

export const ModelSelector = (props: ModelSelectorProps) => (
  <Popover {...props} />
);

export type ModelSelectorTriggerProps = ComponentProps<typeof PopoverTrigger>;

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
  <PopoverTrigger {...props} />
);

/**
 * Conteneur du popover, résolu après le montage.
 *
 * `document.body` n'est pas une cible acceptable : le popover doit vivre
 * dans `.site-root` pour hériter de ses variables et rester dans le
 * périmètre du Site. Avant le montage, le conteneur est inconnu — on rend
 * alors sans Portal, ce qui laisse le contenu à sa place dans l'arbre
 * (invisible tant que le popover est fermé, de toute façon).
 */
function useSitePortalContainer(): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>(".site-root"));
  }, []);

  return container;
}

export type ModelSelectorContentProps = ComponentProps<
  typeof PopoverPrimitive.Content
> & {
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
}: ModelSelectorContentProps) => {
  const container = useSitePortalContainer();

  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        align="start"
        className={cn(
          "w-[min(340px,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white/95 p-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] backdrop-blur-xl",
          className
        )}
        side="bottom"
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
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
};

export type ModelSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ModelSelectorInput = ({
  className,
  ...props
}: ModelSelectorInputProps) => (
  <CommandInput
    className={cn("h-auto py-2.5 text-[13px]", className)}
    {...props}
  />
);

export type ModelSelectorListProps = ComponentProps<typeof CommandList>;

export const ModelSelectorList = ({
  className,
  ...props
}: ModelSelectorListProps) => (
  <CommandList
    className={cn("max-h-[320px] overflow-y-auto p-1", className)}
    {...props}
  />
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

export const ModelSelectorItem = ({
  className,
  ...props
}: ModelSelectorItemProps) => (
  <CommandItem
    className={cn(
      "w-full rounded-lg text-[13px] text-slate-700 data-[selected=true]:bg-purple-50 data-[selected=true]:text-slate-900 hover:bg-slate-50",
      className
    )}
    {...props}
  />
);

export type ModelSelectorShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ModelSelectorShortcut = (props: ModelSelectorShortcutProps) => (
  <CommandShortcut {...props} />
);

export type ModelSelectorSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const ModelSelectorSeparator = (props: ModelSelectorSeparatorProps) => (
  <CommandSeparator className="bg-slate-200" {...props} />
);

export type ModelSelectorNameProps = ComponentProps<"span">;

export const ModelSelectorName = ({
  className,
  ...props
}: ModelSelectorNameProps) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);
