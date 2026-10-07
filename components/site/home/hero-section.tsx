"use client";

import {
  ArrowRight,
  Cpu,
  Database,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "@/components/site/router";

export function HeroSection() {
  return (
    <div className="flex flex-col items-center justify-center text-center relative z-10 pt-2 pb-6">
      {/* Titre Principal */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center max-w-4xl"
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter mb-4 leading-[0.9] md:leading-[0.85] uppercase text-slate-900 select-none"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Just{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500">
            build.
          </span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="text-base sm:text-xl md:text-2xl font-semibold text-slate-800 tracking-tight max-w-2xl mb-4"
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.15, duration: 0.8, ease: "easeOut" }}
        >
          L&apos;écosystème IA et outils développeur conçu par{" "}
          <span className="text-purple-600 font-bold">mDevsLabs</span>.
        </motion.p>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mb-8 font-normal leading-relaxed px-4"
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.25, duration: 0.8, ease: "easeOut" }}
        >
          Découvrez la suite mAI (Web, Pulse, CLI, Coder), nos modèles d&apos;IA
          de pointe et notre API unifiée haute performance.
        </motion.p>

        {/* Boutons d'Action */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4 sm:px-0 mb-10"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" }}
        >
          <Link className="w-full sm:w-auto" href="/projects">
            <motion.button
              className="w-full sm:w-auto px-8 py-4 rounded-2xl md:rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-slate-900 text-white font-bold flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_35px_rgba(147,51,234,0.4)] transition-all"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              Explorer les Projets
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>

          <Link className="w-full sm:w-auto" href="/models">
            <motion.button
              className="w-full sm:w-auto px-8 py-4 rounded-2xl md:rounded-full bg-white/60 backdrop-blur-md border border-slate-200 text-slate-900 font-bold flex items-center justify-center gap-2.5 hover:bg-white/90 hover:border-purple-300 transition-all shadow-sm"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              Découvrir les Modèles
            </motion.button>
          </Link>

          <Link className="w-full sm:w-auto" href="/docs">
            <motion.button
              className="w-full sm:w-auto px-6 py-4 rounded-2xl md:rounded-full bg-white/30 backdrop-blur-md border border-white/60 text-slate-700 font-medium flex items-center justify-center gap-2 hover:bg-white/60 transition-all"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <Terminal className="w-4 h-4" />
              Documentation
            </motion.button>
          </Link>
        </motion.div>

        {/* Grille de Statistiques / KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full max-w-4xl">
          {[
            {
              color: "text-purple-600",
              icon: Cpu,
              label: "Modèles IA Disponibles",
              value: "8+",
            },
            {
              color: "text-blue-600",
              icon: Layers,
              label: "Projets",
              value: "5",
            },
            {
              color: "text-emerald-600",
              icon: Database,
              label: "Tokens de Contexte Max",
              value: "1M",
            },
            {
              color: "text-amber-600",
              icon: ShieldCheck,
              label: "Respect de la Vie Privée",
              value: "100%",
            },
          ].map((stat, i) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-purple-200 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              key={stat.label}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.5 }}
              whileHover={{ transition: { duration: 0.2 }, y: -4 }}
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-1.5`} />
              <span className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-slate-500 mt-0.5">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
