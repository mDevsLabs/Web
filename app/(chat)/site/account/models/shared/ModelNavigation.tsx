"use client";

import { Cpu, Image as ImageIcon, Volume2 } from "lucide-react";
import Link from "@/components/site/router";

export type ModelCatalogSection = "text" | "images" | "audio" | "mai";

const ITEMS = [
  { href: "/account/models", id: "text", label: "Modèles Texte" },
  {
    href: "/account/models/images",
    icon: ImageIcon,
    id: "images",
    label: "Modèles Images",
  },
  {
    href: "/account/models/audio",
    icon: Volume2,
    id: "audio",
    label: "Modèles Audio",
  },
  { href: "/account/models/mai", icon: Cpu, id: "mai", label: "Modèles mAI" },
] as const;

export function ModelNavigation({ active }: { active: ModelCatalogSection }) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/60 w-fit overflow-x-auto">
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        const Icon = "icon" in item ? item.icon : null;
        return (
          <Link
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              isActive
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            href={item.href}
            key={item.id}
          >
            {Icon && <Icon className="w-3.5 h-3.5 text-purple-600" />}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
