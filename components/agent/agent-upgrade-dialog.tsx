"use client";

import { CrownIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AGENT_UPGRADE_CTA,
  AGENT_UPGRADE_DESCRIPTION,
  AGENT_UPGRADE_TITLE,
} from "@/lib/agent/channel";
import { MAI_UPGRADE_URL } from "@/lib/constants";

// Un utilisateur Free voit Agent mais ne peut pas l'utiliser : ce dialogue
// explique pourquoi et renvoie vers la page de forfaits. La garde réelle reste
// côté serveur (plan_required), ce dialogue n'est qu'une explication.
export function AgentUpgradeDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md" data-testid="agent-upgrade-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <CrownIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {AGENT_UPGRADE_TITLE}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Forfaits Plus, Pro ou Max
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="py-2 text-xs leading-relaxed text-muted-foreground">
          {AGENT_UPGRADE_DESCRIPTION}
        </p>

        <div className="grid grid-cols-3 gap-2 py-1">
          <PlanBadge
            color="from-sky-400 to-blue-500"
            icon={ZapIcon}
            label="Plus"
          />
          <PlanBadge
            color="from-violet-500 to-purple-600"
            highlight
            icon={SparklesIcon}
            label="Pro"
          />
          <PlanBadge
            color="from-amber-400 to-orange-500"
            icon={CrownIcon}
            label="Max"
          />
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Plus tard
          </Button>
          <Button asChild className="gap-2" type="button">
            <Link href={MAI_UPGRADE_URL} rel="noreferrer" target="_blank">
              <SparklesIcon className="size-4" />
              {AGENT_UPGRADE_CTA}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanBadge({
  color,
  highlight,
  icon: Icon,
  label,
}: {
  color: string;
  highlight?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border bg-gradient-to-br ${color} p-3 text-white shadow-sm ${
        highlight
          ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
          : "opacity-90"
      }`}
    >
      <Icon className="size-4" />
      <span className="text-[11px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
