"use client";

import { Suspense, useEffect, useState } from "react";
import { SuiteCommandBar } from "@/components/common/suite-command-bar";

/**
 * Hôte universel de la barre de commande pour toute la suite mAI.
 *
 * Placé à la racine (`app/layout.tsx`), il garantit que le raccourci clavier
 * universel `⌘K` / `Ctrl+K` fonctionne sur TOUTES les pages (mAI Chat,
 * Quizzly, Blackline, Coder, Vibe, Wakies, Pages, Bibliothèque, Paramètres).
 */
export function SuiteCommandBarHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Raccourci universel Cmd+K ou Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((current) => !current);
      }
    };

    const handleOpen = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-suite-command-bar", handleOpen);
    window.addEventListener("open-search-dialog", handleOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-suite-command-bar", handleOpen);
      window.removeEventListener("open-search-dialog", handleOpen);
    };
  }, []);

  return (
    <Suspense fallback={null}>
      {open ? <SuiteCommandBar onOpenChange={setOpen} open={open} /> : null}
    </Suspense>
  );
}
