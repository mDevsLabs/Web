"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function ConfettiRocket({
  active,
  durationMs = 4200,
}: {
  active: boolean;
  durationMs?: number;
}) {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(active);

  useEffect(() => {
    setShow(active);
    if (!active) return;
    const t = window.setTimeout(() => setShow(false), durationMs);
    return () => clearTimeout(t);
  }, [active, durationMs]);

  if (!show) return null;
  if (width === 0 || height === 0) return null;

  return (
    <>
      <Confetti
        colors={["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"]}
        gravity={0.14}
        height={height}
        numberOfPieces={180}
        recycle={false}
        style={
          {
            inset: 0,
            pointerEvents: "none",
            position: "fixed",
            zIndex: 110,
          } as React.CSSProperties
        }
        tweenDuration={5000}
        width={width}
      />
      <motion.div
        animate={{
          opacity: 1,
          rotate: 18,
          scale: 1,
          x: width + 80,
          y: height * 0.42,
        }}
        aria-hidden
        className="fixed z-[111] pointer-events-none"
        initial={{
          opacity: 0,
          rotate: 18,
          scale: 0.7,
          x: -80,
          y: height * 0.55,
        }}
        transition={{ duration: 2.8, ease: "easeInOut" }}
      >
        <div className="relative">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            className="w-14 h-20 bg-gradient-to-b from-orange-400 to-red-500 rounded-t-full shadow-lg"
            transition={{ duration: 0.28, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            animate={{ opacity: [0.35, 1, 0.35], scaleY: [0.85, 1.15, 0.85] }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-7 h-10"
            transition={{ duration: 0.45, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="w-full h-full bg-gradient-to-t from-orange-500 to-transparent rounded-full blur-[0.5px]" />
          </motion.div>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-cyan-300 rounded-full border-2 border-white shadow-sm" />
        </div>
      </motion.div>
    </>
  );
}
