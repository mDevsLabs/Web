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
 * Affiche les sous-sections imbriquées sous la section active.
 */
export function SettingsAnchorNav({ items }: { items: AnchorItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  // Réinitialise la sélection quand la liste d'ancres change (changement d'onglet)
  useEffect(() => {
    setActiveId(items[0]?.id ?? "");
  }, [items]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-scroll-root]");
    if (items.length === 0) {
      return;
    }
    // Sur desktop, le panneau droit est borné et porte `data-scroll-root` :
    // c'est lui qui défile, et le rail reste visible. Sous `lg`, le panneau n'a
    // pas de hauteur propre (la page défile) : écouter l'élément ne produirait
    // aucun événement, donc on écoute `window`.
    const defilant =
      root && root.scrollHeight > root.clientHeight ? root : null;
    const cible: HTMLElement | Window = defilant ?? window;
    const baseTop = () => (defilant ? defilant.getBoundingClientRect().top : 0);

    let raf = 0;
    const update = () => {
      const rootTop = baseTop();
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

    cible.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      cible.removeEventListener("scroll", onScroll);
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
    <div
      className="mt-2 border-l border-border/60 pl-3"
      data-testid="settings-anchor-nav"
    >
      <nav aria-label="Sous-sections" className="flex flex-col gap-0.5">
        <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Sous-sections
        </p>
        {items.map((item) => (
          <button
            className={cn(
              "rounded-lg px-2 py-1 text-left text-[10px] font-medium transition-colors cursor-pointer",
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
    </div>
  );
}
