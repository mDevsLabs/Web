"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export function UpgradeCelebration({
  show,
  width,
  height,
}: {
  show: boolean;
  width: number;
  height: number;
}) {
  if (
    !show ||
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }

  return (
    <>
      <Confetti
        colors={["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"]}
        gravity={0.15}
        height={height}
        numberOfPieces={220}
        recycle={false}
        style={
          {
            inset: 0,
            pointerEvents: "none",
            position: "fixed",
            zIndex: 1100,
          } as CSSProperties
        }
        tweenDuration={5000}
        width={width}
      />
      <motion.div
        animate={{
          opacity: [0, 1, 1, 0],
          rotate: 18,
          scale: [0.6, 1.05, 1, 0.9],
          x: width + 80,
          y: height * 0.42,
        }}
        aria-hidden="true"
        className="fixed z-[1101] pointer-events-none"
        initial={{
          opacity: 0,
          rotate: 18,
          scale: 0.5,
          x: -80,
          y: height * 0.55,
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
      >
        <div className="relative">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            className="w-16 h-24 bg-gradient-to-b from-orange-400 to-red-500 rounded-t-full shadow-lg"
            transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scaleY: [0.8, 1.2, 0.8] }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-8 h-12"
            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="w-full h-full bg-gradient-to-t from-orange-500 to-transparent rounded-full" />
          </motion.div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-300 rounded-full border-2 border-white shadow-sm" />
        </div>
      </motion.div>
    </>
  );
}
