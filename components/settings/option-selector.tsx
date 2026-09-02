"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { cn } from "@/lib/utils";

/**
 * Sélecteur générique d'options déroulant (menu stylé Command, cohérent avec
 * le sélecteur de modèles du chat) : chaque option porte un identifiant, un
 * libellé et un icon ou emoji optionnel. Utilisé pour les voix IA, la taille
 * d'images générées, la visibilité par défaut, l'agent par défaut, etc.
 */
export type OptionSelectorItem = {
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
  id: string;
  label: string;
  meta?: string;
};

type OptionSelectorProps = {
  allowEmpty?: boolean;
  disabled?: boolean;
  /** Regroupe les options par ce champ (les groupes sont titrés). */
  groupBy?: (item: OptionSelectorItem) => string;
  items: OptionSelectorItem[];
  onChange: (id: string) => void;
  /** Libellé affiché quand aucune option n'est sélectionnable. */
  placeholder?: string;
  searchPlaceholder?: string;
  /** Identifiant de l'option sélectionnée ("" = aucune). */
  value: string;
};

const EMPTY_LABEL = "Aucun";

function PureOptionSelector({
  items,
  value,
  onChange,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  allowEmpty,
  disabled,
  groupBy,
}: OptionSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = items.find((i) => i.id === value);

  const grouped = useMemo(() => {
    const map = new Map<string, OptionSelectorItem[]>();
    for (const item of items) {
      const key = groupBy ? groupBy(item) : "";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [groupBy, items]);

  const groupLabel = (key: string) =>
    key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <ModelSelector modal onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <button
          className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm font-normal text-foreground transition hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="option-selector"
          disabled={disabled}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected?.icon ? (
              <span className="flex size-5 shrink-0 items-center justify-center text-base leading-none">
                {selected.icon}
              </span>
            ) : null}
            <span
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </ModelSelectorTrigger>
      <ModelSelectorContent side="bottom">
        <ModelSelectorInput placeholder={searchPlaceholder} />
        <ModelSelectorList>
          {items.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Aucune option disponible
            </div>
          ) : (
            <>
              {allowEmpty ? (
                <ModelSelectorItem
                  className="flex w-full cursor-pointer transition-colors text-[13px] py-2 px-2.5 rounded-lg text-muted-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  value={EMPTY_LABEL}
                >
                  <span className="flex-1">{EMPTY_LABEL}</span>
                  {value === "" ? (
                    <CheckIcon className="size-3.5 text-primary" />
                  ) : null}
                </ModelSelectorItem>
              ) : null}
              {grouped.map(([groupKey, groupItems]) => (
                <ModelSelectorGroup
                  heading={groupKey ? groupLabel(groupKey) : undefined}
                  key={groupKey || "__all"}
                >
                  {groupItems.map((item) => (
                    <ModelSelectorItem
                      className={cn(
                        "flex w-full cursor-pointer transition-colors text-[13px] py-2 px-2.5 rounded-lg",
                        item.id === value &&
                          "bg-muted/80 font-medium text-foreground",
                        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
                      )}
                      disabled={item.disabled}
                      key={item.id}
                      onSelect={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                      value={`${item.label} ${item.id} ${item.description ?? ""}`}
                    >
                      {item.icon ? (
                        <span className="flex size-4 shrink-0 items-center justify-center text-sm leading-none">
                          {item.icon}
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{item.label}</span>
                        {item.description ? (
                          <span className="text-[11px] font-normal text-muted-foreground line-clamp-1">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
                        {item.meta ? (
                          <span className="text-[10px] font-medium text-muted-foreground/80">
                            {item.meta}
                          </span>
                        ) : null}
                        {item.id === value ? (
                          <CheckIcon className="size-3.5 text-primary" />
                        ) : null}
                      </span>
                    </ModelSelectorItem>
                  ))}
                </ModelSelectorGroup>
              ))}
            </>
          )}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

export const OptionSelector = PureOptionSelector;
