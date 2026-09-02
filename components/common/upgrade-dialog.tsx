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
import { MAI_UPGRADE_URL } from "@/lib/constants";

export type UpgradeDialogProps = {
  feature?: "skills" | "mcp" | "agents" | "generic";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FEATURE_COPY: Record<
  NonNullable<UpgradeDialogProps["feature"]>,
  { description: string; title: string }
> = {
  agents: {
    description:
      "Créez des agents IA personnalisés avec instructions, modèles, skills et connexions MCP. Réservé aux forfaits Plus, Pro et Max.",
    title: "Agents IA — Plan requis",
  },
  generic: {
    description:
      "Cette fonctionnalité avancée est réservée aux forfaits payants. Passez à un forfait supérieur pour continuer.",
    title: "Fonctionnalité Premium",
  },
  mcp: {
    description:
      "Connectez vos bases de données, API et outils locaux directement à l'IA grâce au protocole MCP. Réservé aux forfaits Plus, Pro et Max.",
    title: "Model Context Protocol — Plan requis",
  },
  skills: {
    description:
      "Créez des compétences IA personnalisées avec paramètres dynamiques, marketplace de templates et statistiques d'usage. Réservé aux forfaits Plus, Pro et Max.",
    title: "Skills & Outils IA — Plan requis",
  },
};

export function UpgradeDialog({
  feature = "generic",
  open,
  onOpenChange,
}: UpgradeDialogProps) {
  const copy = FEATURE_COPY[feature];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <CrownIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base">{copy.title}</DialogTitle>
              <DialogDescription className="text-xs">
                Forfaits requis : Plus, Pro ou Max
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-muted-foreground leading-relaxed">
          {copy.description}
        </div>

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
            <Link href={MAI_UPGRADE_URL} target="_blank">
              <SparklesIcon className="size-4" />
              Mettre à niveau mon forfait
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
