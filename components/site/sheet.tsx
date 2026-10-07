"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect } from "react";

interface SheetProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  className = "",
  label = "Panneau",
}: SheetProps) {
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:hidden">
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
          <motion.div
            animate={{ y: 0 }}
            aria-label={label}
            aria-modal="true"
            className={`relative flex w-full max-h-[85dvh] flex-col overflow-hidden rounded-t-sheet glass-strong ${className}`}
            drag="y"
            dragConstraints={{ bottom: 0, top: 0 }}
            dragControls={dragControls}
            dragElastic={{ bottom: 0.55, top: 0 }}
            dragListener={false}
            dragMomentum={false}
            exit={{ y: "100%" }}
            initial={{ y: "100%" }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600)
                onOpenChange(false);
            }}
            role="dialog"
            transition={{
              damping: 35,
              mass: 0.9,
              stiffness: 400,
              type: "spring",
            }}
          >
            {/* Poignée iOS : seule zone qui démarre le drag-to-dismiss */}
            <div
              className="flex shrink-0 cursor-grab touch-none select-none justify-center pb-1 pt-3 active:cursor-grabbing"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div className="h-1.5 w-10 rounded-full bg-slate-900/15" />
            </div>
            <button
              aria-label="Fermer"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-900/5"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe-sheet">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
