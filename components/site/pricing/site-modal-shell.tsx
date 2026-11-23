"use client";

import { XIcon as X } from "@mdevs/icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect } from "react";

interface SiteModalShellProps {
  accentClassName?: string;
  children: ReactNode;
  disabled?: boolean;
  labelId: string;
  onClose: () => void;
  open: boolean;
}

/**
 * Conteneur modal scopé à l'intérieur de `.site-root` (pas de Portal hors racine)
 * avec empilement au-dessus de `.md-overlay` (`z-[1050]` / `z-[1051]`).
 */
export function SiteModalShell({
  open,
  onClose,
  disabled = false,
  labelId,
  accentClassName = "from-purple-600 via-blue-500 to-indigo-600",
  children,
}: SiteModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[1050] flex items-center justify-center p-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => {
              if (!disabled) onClose();
            }}
          />

          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-labelledby={labelId}
            aria-modal="true"
            className="relative z-[1051] w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden"
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            role="dialog"
            transition={{ damping: 28, stiffness: 380, type: "spring" }}
          >
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${accentClassName}`}
            />
            <button
              aria-label="Fermer la fenêtre"
              className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
              disabled={disabled}
              onClick={onClose}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
