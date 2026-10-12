"use client";

/**
 * Menu « … » d'un Espace du rail.
 *
 * Le portail reste sous `.wakies-root`, dans le rail ou la coquille de l'atelier :
 * il garde son thème et échappe aux listes défilantes qui coupaient ses options.
 * Le focus, les flèches et Escape restent pilotés depuis le bouton d'origine.
 */

import { MoreHorizontalIcon as MoreHorizontal } from "@mdevs/icons";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const portal =
    root.current?.closest(".sidebar") ??
    root.current?.closest(".muse-app") ??
    root.current?.closest(".wakies-root");

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const place = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const menu = panel.current.getBoundingClientRect();
      const top =
        anchor.bottom + menu.height + 8 <= window.innerHeight
          ? anchor.bottom + 4
          : Math.max(8, anchor.top - menu.height - 4);
      setPosition({
        left: Math.max(
          8,
          Math.min(
            anchor.right - menu.width,
            window.innerWidth - menu.width - 8
          )
        ),
        top: Math.max(8, Math.min(top, window.innerHeight - menu.height - 8)),
      });
    };
    place();
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const positioned = position !== null;
  useEffect(() => {
    if (!open || !positioned) return;
    panel.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
  }, [open, positioned]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
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
      className="space-nav-menu"
      data-open={open}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node | null) &&
          !panel.current?.contains(event.relatedTarget as Node | null)
        ) {
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
            panel.current?.querySelectorAll<HTMLButtonElement>(
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
        } else if (
          !open &&
          (event.key === "ArrowDown" || event.key === "ArrowUp")
        ) {
          event.preventDefault();
          setOpen(true);
        }
      }}
      ref={root}
    >
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${libelle} — actions`}
        className="icon-button"
        onClick={() => setOpen((etat) => !etat)}
        ref={trigger}
        type="button"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && portal
        ? createPortal(
            <div
              aria-label={`${libelle} — actions`}
              className="space-dropdown"
              id={menuId}
              ref={panel}
              role="menu"
              style={{
                ...position,
                visibility: position ? "visible" : "hidden",
              }}
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
            </div>,
            portal
          )
        : null}
    </div>
  );
}
