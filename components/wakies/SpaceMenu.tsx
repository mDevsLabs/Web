"use client";

/**
 * Menu « … » d'un Espace du rail.
 *
 * Ce n'est PAS le `DropdownMenu` de `@mdevs/ui` ni un `Popover` de l'hôte :
 * ces deux-là rendent dans un portail posé sur `document.body`, donc hors de
 * `.wakies-root`. Un menu d'espace doit rester dans l'atelier, partager ses
 * styles, et obéir au test d'isolation CSS (`tests/unit/wakies-style-isolation.test.ts`)
 * qui ancre chaque règle sous `.wakies-root`. D'où ce composant, même forme
 * que `components/wakies/editor/DocumentMenu.tsx` : bouton, liste, focus,
 * `Escape`.
 */

import { MoreHorizontalIcon as MoreHorizontal } from "@mdevs/icons";
import { useEffect, useRef, useState } from "react";

export type EspaceMenuAction =
  | {
      /** Action destructrice : le libellé porte l'accent, la confirmation vient après. */
      danger?: boolean;
      id: string;
      kind: "action";
      label: string;
      onSelect: () => void;
    }
  | {
      id: string;
      kind: "groupe";
      label: string;
      /** Options alignées à gauche sous l'étiquette : un seul clic chacune. */
      options: { id: string; label: string; onSelect: () => void }[];
    };

export function SpaceMenu({
  actions,
  libelle,
}: {
  actions: EspaceMenuAction[];
  libelle: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const fermer = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div
      aria-expanded={open}
      className="space-nav-menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          fermer();
          return;
        }
        if (
          open &&
          ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
        ) {
          event.preventDefault();
          const boutons = Array.from(
            root.current?.querySelectorAll<HTMLButtonElement>(
              '[role="menuitem"]'
            ) ?? []
          );
          const actif = boutons.indexOf(
            document.activeElement as HTMLButtonElement
          );
          const index =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? boutons.length - 1
                : (actif +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    boutons.length) %
                  boutons.length;
          boutons[index]?.focus();
        }
      }}
      ref={root}
    >
      <button
        aria-haspopup="menu"
        aria-label={`${libelle} — actions`}
        className="icon-button"
        onClick={() => setOpen((etat) => !etat)}
        ref={trigger}
        type="button"
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div
          aria-label={`${libelle} — actions`}
          className="space-dropdown"
          role="menu"
        >
          {actions.map((action) =>
            action.kind === "groupe" ? (
              <div className="space-dropdown-groupe" key={action.id}>
                <span className="space-dropdown-label">{action.label}</span>
                {action.options.map((option) => (
                  <button
                    className="space-dropdown-item"
                    key={option.id}
                    onClick={() => {
                      fermer();
                      option.onSelect();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                className={`space-dropdown-item${action.danger ? " is-danger" : ""}`}
                key={action.id}
                onClick={() => {
                  fermer();
                  action.onSelect();
                }}
                role="menuitem"
                type="button"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
