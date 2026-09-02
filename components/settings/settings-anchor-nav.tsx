"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type AnchorItem = {
  id: string;
  label: string;
};

/**
 * Barre latérale fixée à l'écran (sticky dans le conteneur scrollable)
 * listant les ancres de l'onglet actif des paramètres. La section visible
 * est détectée via le scroll du conteneur [data-scroll-root] et surlignée.
 * Masquée sous xl pour laisser toute la largeur au contenu.
 */
export function SettingsAnchorNav({ items }: { items: AnchorItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  // Réinitialise la sélection quand la liste d'ancres change (changement d'onglet)
  useEffect(() => {
    setActiveId(items[0]?.id ?? "");
  }, [items]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-scroll-root]");
    if (!root || items.length === 0) {
      return;
    }

    let raf = 0;
    const update = () => {
      const rootTop = root.getBoundingClientRect().top;
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) {
          continue;
        }
        const top = el.getBoundingClientRect().top - rootTop;
        if (top <= 140) {
          current = item.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      root.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <aside
      className="hidden w-60 shrink-0 xl:block"
      data-testid="settings-anchor-nav"
    >
      <nav className="sticky top-6 flex flex-col gap-1 rounded-2xl border border-border/50 bg-card/60 p-3 backdrop-blur-md">
        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Sur cette page
        </p>
        {items.map((item) => (
          <button
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer",
              activeId === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            key={item.id}
            onClick={() => handleClick(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
