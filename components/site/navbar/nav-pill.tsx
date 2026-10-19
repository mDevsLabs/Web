"use client";

import { motion } from "motion/react";

/* Indicateur de lien actif : pill en verre qui glisse d'un onglet à l'autre */
export function NavPill() {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-full glass-pill"
      layoutId="nav-active-pill"
      style={{ borderRadius: 999 }}
      transition={{ damping: 32, stiffness: 380, type: "spring" }}
    />
  );
}
