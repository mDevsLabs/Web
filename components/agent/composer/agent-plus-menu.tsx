"use client";

import { PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AGENT_COMPOSER_ACTIONS,
  type AgentComposerActionId,
  type AgentComposerAvailability,
  resolveComposerActionAvailability,
} from "@/lib/agent/ui/composer-actions";
import { cn } from "@/lib/utils";

// Menu « + » : rendu à partir du registre AGENT_COMPOSER_ACTIONS. Ajouter une
// capacité se limite à une entrée dans le registre ; ce composant n'a pas à
// connaître les options une par une.
export function AgentPlusMenu({
  availability,
  className,
  disabled,
  onSelect,
}: {
  availability: AgentComposerAvailability;
  className?: string;
  disabled?: boolean;
  onSelect: (id: AgentComposerActionId) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Ajouter un contexte ou une capacité"
          className={cn(
            "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
            className
          )}
          data-testid="agent-plus-menu"
          disabled={disabled}
          type="button"
        >
          <PlusIcon className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72" side="top">
        <DropdownMenuLabel>Ajouter à la tâche</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AGENT_COMPOSER_ACTIONS.map((action) => {
          const { available, reason } = resolveComposerActionAvailability(
            action,
            availability
          );
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              className="flex items-start gap-3"
              disabled={!available}
              key={action.id}
              onSelect={() => onSelect(action.id)}
            >
              <Icon className="mt-0.5 size-4 text-muted-foreground" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-[11.5px] leading-snug text-muted-foreground">
                  {available ? action.description : reason}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
