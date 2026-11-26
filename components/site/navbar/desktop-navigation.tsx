"use client";

import { ChevronDownIcon as ChevronDown } from "@mdevs/icons";
import { useEffect, useState } from "react";
import { NavPill } from "@/components/site/navbar/nav-pill";
import {
  checkLinkActive,
  checkSubActive,
  navLinks,
} from "@/components/site/navbar/navigation-config";
import Link from "@/components/site/router";

/** Vérifie si la cible vient d'une navigation clavier (`:focus-visible`) et non d'un clic souris. */
function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  try {
    return target.matches(":focus-visible");
  } catch {
    return false;
  }
}

export function DesktopNavigation({ pathname }: { pathname: string }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openNested, setOpenNested] = useState<string | null>(null);

  useEffect(() => {
    setOpenMenu(null);
    setOpenNested(null);
  }, [pathname]);

  const closeAll = () => {
    setOpenMenu(null);
    setOpenNested(null);
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-slate-500"
    >
      {navLinks.map((link) => {
        const isActive = checkLinkActive(link, pathname);

        if (link.subitems) {
          const isOpen = openMenu === link.name;

          return (
            <div
              className="relative py-2"
              key={link.name}
              onBlurCapture={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null
                  )
                ) {
                  setOpenMenu((current) =>
                    current === link.name ? null : current
                  );
                  setOpenNested(null);
                }
              }}
              onFocusCapture={(event) => {
                if (isKeyboardFocus(event.target)) {
                  setOpenMenu(link.name);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeAll();
                }
              }}
              onMouseEnter={() => {
                setOpenMenu(link.name);
              }}
              onMouseLeave={() => {
                setOpenMenu((current) =>
                  current === link.name ? null : current
                );
                setOpenNested(null);
              }}
            >
              <Link
                aria-expanded={isOpen}
                className={`relative flex items-center gap-1 transition-opacity ${
                  isActive
                    ? "text-slate-900"
                    : "hover:text-slate-900 active:opacity-70"
                }`}
                href={link.href}
                onClick={closeAll}
              >
                {isActive && <NavPill />}
                <span className="relative z-10">{link.name}</span>
                <ChevronDown
                  className={`relative z-10 w-4 h-4 opacity-60 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {/* Premier niveau de Dropdown */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 origin-top transition-[opacity,transform] duration-200 z-50 ${
                  isOpen
                    ? "opacity-100 translate-y-0 scale-100 visible pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-[0.98] invisible pointer-events-none"
                }`}
              >
                <div className="glass-dropdown min-w-[170px] flex flex-col gap-1">
                  {link.subitems.map((subitem) => {
                    const isSubActive = checkSubActive(subitem, pathname);
                    const hasNested = !!subitem.subitems;
                    const isNestedOpen = isOpen && openNested === subitem.name;

                    if (hasNested) {
                      return (
                        <div
                          className="relative flex flex-col"
                          key={subitem.name}
                          onFocusCapture={(event) => {
                            if (isKeyboardFocus(event.target)) {
                              setOpenNested(subitem.name);
                            }
                          }}
                          onMouseEnter={() => setOpenNested(subitem.name)}
                          onMouseLeave={() =>
                            setOpenNested((current) =>
                              current === subitem.name ? null : current
                            )
                          }
                        >
                          <Link
                            aria-expanded={isNestedOpen}
                            className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
                              isSubActive
                                ? "bg-purple-50 text-purple-600 font-extrabold shadow-2xs"
                                : "text-slate-700 hover:bg-purple-50/70 hover:text-purple-700"
                            }`}
                            href={subitem.href}
                            onClick={closeAll}
                          >
                            <span>{subitem.name}</span>
                            <ChevronDown
                              className={`w-3 h-3 -rotate-90 text-slate-400 transition-transform ${
                                isNestedOpen ? "translate-x-0.5" : ""
                              }`}
                            />
                          </Link>

                          {/* Sous-menu flyout à droite */}
                          <div
                            className={`absolute left-full top-0 pl-2 origin-left transition-[opacity,transform] duration-200 z-50 ${
                              isNestedOpen
                                ? "opacity-100 translate-x-0 scale-100 visible pointer-events-auto"
                                : "opacity-0 translate-x-1 scale-[0.98] invisible pointer-events-none"
                            }`}
                          >
                            <div className="glass-dropdown min-w-[150px] flex flex-col gap-1">
                              {subitem.subitems?.map((nested) => (
                                <Link
                                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                    pathname === nested.href
                                      ? "bg-purple-50 text-purple-600 font-extrabold shadow-2xs"
                                      : "text-slate-700 hover:bg-purple-50/70 hover:text-purple-700"
                                  }`}
                                  href={nested.href}
                                  key={nested.name}
                                  onClick={closeAll}
                                >
                                  {nested.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                          isSubActive
                            ? "bg-purple-50 text-purple-600 font-extrabold shadow-2xs"
                            : "text-slate-700 hover:bg-purple-50/70 hover:text-purple-700"
                        }`}
                        href={subitem.href}
                        key={subitem.name}
                        onClick={closeAll}
                      >
                        {subitem.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            className={`relative transition-opacity ${
              isActive
                ? "text-slate-900"
                : "hover:text-slate-900 active:opacity-70"
            }`}
            href={link.href}
            key={link.name}
          >
            {isActive && <NavPill />}
            <span className="relative z-10">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
