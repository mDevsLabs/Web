"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Rect = { x: number; y: number; w: number; h: number };

export function Spotlight({ selector }: { selector?: string }) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ h: r.height, w: r.width, x: r.left, y: r.top });
    };

    update();
    const ro = new ResizeObserver(update);
    const el = document.querySelector(selector!);
    if (el) ro.observe(el);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 1000);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      clearInterval(id);
    };
  }, [selector]);

  if (!selector || !rect) return null;

  const pad = 8;
  const x = Math.max(0, rect.x - pad);
  const y = Math.max(0, rect.y - pad);
  const w = rect.w + pad * 2;
  const h = rect.h + pad * 2;

  return (
    <>
      {/* dim overlay via SVG mask technique: 4 rects */}
      <motion.div
        animate={{ opacity: 1 }}
        aria-hidden
        className="fixed inset-0 z-[99] pointer-events-none"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
      >
        {/* top */}
        <div
          className="absolute bg-slate-950/55 backdrop-blur-[1px]"
          style={{ height: y, left: 0, right: 0, top: 0 }}
        />
        {/* bottom */}
        <div
          className="absolute bg-slate-950/55 backdrop-blur-[1px]"
          style={{ bottom: 0, left: 0, right: 0, top: y + h }}
        />
        {/* left */}
        <div
          className="absolute bg-slate-950/55 backdrop-blur-[1px]"
          style={{ height: h, left: 0, top: y, width: x }}
        />
        {/* right */}
        <div
          className="absolute bg-slate-950/55 backdrop-blur-[1px]"
          style={{ height: h, left: x + w, right: 0, top: y }}
        />
      </motion.div>

      {/* highlight ring */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[100] pointer-events-none rounded-2xl border-2 border-purple-500 shadow-[0_0_0_6px_rgba(168,85,247,0.18),0_8px_30px_rgba(0,0,0,0.2)]"
        initial={{ opacity: 0, scale: 0.98 }}
        style={{ height: h, left: x, top: y, width: w }}
        transition={{ damping: 30, stiffness: 400, type: "spring" }}
      />
      {/* pulsating outer glow */}
      <motion.div
        animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.02, 1] }}
        className="fixed z-[99] pointer-events-none rounded-2xl bg-purple-500/20 blur-[1px]"
        style={{ height: h + 4, left: x - 2, top: y - 2, width: w + 4 }}
        transition={{
          duration: 1.6,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
      />
    </>
  );
}
