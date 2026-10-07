"use client";

import {
  ArrowRight,
  Calendar,
  Cloud,
  Cpu,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "@/components/site/router";
import { PageSearch } from "@/components/site/ui/search-bar";

type ModelCardData = {
  id: string;
  name: string;
  num: string;
  badge: string;
  description: string;
  tagline: string;
  parameters?: string;
  cloud?: boolean;
  vision: boolean;
  context: string;
  releaseDate: string;
  bannerImage: string;
  squareImage: string;
  color: string;
  shadowHover: string;
  borderHover: string;
  tags: string[];
  serieColor: string;
  serieBg: string;
};

const models2: ModelCardData[] = [
  {
    badge: "Cloud • Texte + images • 1M",
    bannerImage: "/site/mai-2/mai-2-169.png",
    borderHover: "hover:border-sky-500/40",
    cloud: true,
    color: "from-sky-500 to-indigo-600",
    context: "1M tokens",
    description:
      "Le modèle principal de la génération mAI-2. Raisonnement, codage, vitesse et création, avec un contexte pouvant atteindre 1 million de tokens. S'exécute dans le cloud via l'API mAI — aucune installation locale.",
    id: "mai-2",
    name: "mAI-2",
    num: "01",
    releaseDate: "25/10/2026",
    serieBg: "bg-sky-500/10 border-sky-500/20",
    serieColor: "text-sky-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(14,165,233,0.25)]",
    squareImage: "/site/mai-2/icon.png",
    tagline: "Our flagship model, for the best price.",
    tags: ["Cloud (API mAI)", "Contexte 1M", "Texte + images", "Flagship"],
    vision: true,
  },
  {
    badge: "Cloud • Texte + images • 1M",
    bannerImage: "/site/mai-2/mai-2-169.png",
    borderHover: "hover:border-teal-400/40",
    cloud: true,
    color: "from-teal-400 to-sky-600",
    context: "1M tokens",
    description:
      "Le modèle équilibré de la génération mAI-2 : une expérience plus légère et accessible, qui conserve les fondations essentielles — raisonnement, codage et multimodalité texte + images.",
    id: "mai-2-mini",
    name: "mAI-2-Mini",
    num: "02",
    releaseDate: "25/10/2026",
    serieBg: "bg-teal-500/10 border-teal-500/20",
    serieColor: "text-teal-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(45,212,191,0.25)]",
    squareImage: "/site/mai-2/mai-galaxy.png",
    tagline: "Our balanced model, for increased price.",
    tags: ["Cloud (API mAI)", "Contexte 1M", "Texte + images", "Équilibré"],
    vision: true,
  },
];

const models15: ModelCardData[] = [
  {
    badge: "4B • Vision • Tools • 256K",
    bannerImage: "/site/mai-1.5-light/mAI-1.5-Light.png",
    borderHover: "hover:border-cyan-400/40",
    color: "from-cyan-400 to-blue-500",
    context: "256K tokens",
    description:
      "Assistant IA local ultra-rapide et multimodal de nouvelle génération 1.5. Léger (4B), équipé de la vision, du raisonnement approfondi (thinking) et des appels d'outils (tools) 100% en local.",
    id: "mai-1.5-light",
    name: "mAI-1.5-Light",
    num: "01",
    parameters: "4B",
    releaseDate: "28/08/2026",
    serieBg: "bg-cyan-500/10 border-cyan-500/20",
    serieColor: "text-cyan-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(6,182,212,0.25)]",
    squareImage: "/site/mai-1.5-light/mAI-1.5-Light.png",
    tagline: "Ultra-rapide, vision, thinking & tools (4B).",
    tags: [
      "4B Paramètres",
      "Vision Multimodale",
      "Thinking",
      "Tools",
      "Contexte 256K",
    ],
    vision: true,
  },
  {
    badge: "9B • Vision • Tools • 256K",
    bannerImage: "/site/mai-1.5-apex/mAI-1.5-Apex.png",
    borderHover: "hover:border-amber-500/40",
    color: "from-amber-500 to-rose-600",
    context: "256K tokens",
    description:
      "Le modèle Flagship d'élite de la série 1.5. Avec 9 milliards de paramètres, il combine une puissance de calcul maximale, la vision haute précision, le raisonnement (thinking) et l'exécution d'outils.",
    id: "mai-1.5-apex",
    name: "mAI-1.5-Apex",
    num: "02",
    parameters: "9B",
    releaseDate: "28/08/2026",
    serieBg: "bg-amber-500/10 border-amber-500/20",
    serieColor: "text-amber-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(245,158,11,0.25)]",
    squareImage: "/site/mai-1.5-apex/mAI-1.5-Apex.png",
    tagline: "Le sommet de la gamme. Flagship, vision, thinking & tools.",
    tags: ["9B Paramètres", "Flagship", "Vision", "Thinking", "Tools"],
    vision: true,
  },
  {
    badge: "27B • Vision • Tools • 256K",
    bannerImage: "/site/mai-1.5-opal/mAI-1.5-Opal.png",
    borderHover: "hover:border-indigo-500/40",
    color: "from-indigo-500 to-purple-600",
    context: "256K tokens",
    description:
      "L'équilibre parfait entre vélocité et haute intelligence. Modèle 27B surpuissant avec vision multimodale, raisonnement pas-à-pas (thinking) et function calling (tools) pour les projets exigeants.",
    id: "mai-1.5-opal",
    name: "mAI-1.5-Opal",
    num: "03",
    parameters: "27B",
    releaseDate: "28/08/2026",
    serieBg: "bg-indigo-500/10 border-indigo-500/20",
    serieColor: "text-indigo-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(99,102,241,0.25)]",
    squareImage: "/site/mai-1.5-opal/mAI-1.5-Opal.png",
    tagline: "Haute intelligence (27B), vision, thinking & tools.",
    tags: [
      "27B Paramètres",
      "Haute Intelligence",
      "Vision",
      "Thinking",
      "Tools",
    ],
    vision: true,
  },
];

const models12: ModelCardData[] = [
  {
    badge: "3B • Vision • 256K",
    bannerImage: "/site/mai-1.2-light/mai-1.2-light.png",
    borderHover: "hover:border-emerald-400/40",
    color: "from-emerald-400 to-teal-500",
    context: "256K tokens",
    description:
      "Assistant IA local ultra-rapide et multimodal. Léger, capable de voir tes visuels et de gérer tes requêtes au quotidien — productivité, code, résumé et analyse d'images sans envoyer tes données dans le cloud.",
    id: "mai-1.2-light",
    name: "mAI-1.2-Light",
    num: "01",
    parameters: "3B",
    releaseDate: "22/07/2026",
    serieBg: "bg-emerald-500/10 border-emerald-500/20",
    serieColor: "text-emerald-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(52,211,153,0.25)]",
    squareImage: "/site/mai-1.2-light/mai-1.2-light.png",
    tagline: "Légèreté maximale, vision intégrée, productivité au quotidien.",
    tags: [
      "3B Paramètres",
      "Vision Multimodale",
      "Contexte 256K",
      "Local-first",
    ],
    vision: true,
  },
  {
    badge: "9B • Vision • 256K",
    bannerImage: "/site/mai-1.2-apex/mai-1.2-apex.png",
    borderHover: "hover:border-rose-500/40",
    color: "from-rose-500 to-orange-500",
    context: "256K tokens",
    description:
      "Le top tier de la famille mAI. Conçu pour les performances maximales avec vision multimodale, raisonnement avancé, code complexe et RAG lourd — tout en gardant 100% de tes données en local.",
    id: "mai-1.2-apex",
    name: "mAI-1.2-Apex",
    num: "02",
    parameters: "9B",
    releaseDate: "22/07/2026",
    serieBg: "bg-rose-500/10 border-rose-500/20",
    serieColor: "text-rose-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(244,63,94,0.25)]",
    squareImage: "/site/mai-1.2-apex/mai-1.2-apex.png",
    tagline: "Puissance brute, zéro cloud, performances Apex.",
    tags: [
      "9B Paramètres",
      "Vision Multimodale",
      "Contexte 256K",
      "Haut de gamme",
    ],
    vision: true,
  },
  {
    badge: "33B • 256K",
    bannerImage: "/site/mai-1.2-opal/mai-1.2-opal.png",
    borderHover: "hover:border-violet-500/40",
    color: "from-violet-500 to-purple-600",
    context: "256K tokens",
    description:
      "Le sweet spot parfait entre rapidité et intelligence. Équilibré et ultra-fluide, pour la productivité, le code, les résumés et le RAG sans envoyer vos données dans le cloud.",
    id: "mai-1.2-opal",
    name: "mAI-1.2-Opal",
    num: "03",
    parameters: "33B",
    releaseDate: "22/07/2026",
    serieBg: "bg-violet-500/10 border-violet-500/20",
    serieColor: "text-violet-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(139,92,246,0.25)]",
    squareImage: "/site/mai-1.2-opal/mai-1.2-opal.png",
    tagline: "L'équilibre parfait : puissance et fluidité.",
    tags: [
      "33B Paramètres",
      "Vision Multimodale",
      "Contexte 256K",
      "Équilibré",
    ],
    vision: false,
  },
];

const models1: ModelCardData[] = [
  {
    badge: "12B • Vision • 256K",
    bannerImage: "/site/mai-1/mai-1.png",
    borderHover: "hover:border-purple-500/40",
    color: "from-purple-500 to-indigo-600",
    context: "256K tokens",
    description:
      "Assistant IA local puissant, multimodal et orienté productivité. Propulsé par Gemma 4 12B, conçu pour le raisonnement, le code et l'analyse d'images.",
    id: "mai-1",
    name: "mAI-1",
    num: "01",
    parameters: "12B",
    releaseDate: "11/07/2026",
    serieBg: "bg-purple-500/10 border-purple-500/20",
    serieColor: "text-purple-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(168,85,247,0.25)]",
    squareImage: "/site/mai-1/mai-1-carre.png",
    tagline: "La version complète et surpuissante de la famille mAI.",
    tags: [
      "12B Paramètres",
      "Vision Multimodale",
      "Contexte 256K",
      "Local-first",
    ],
    vision: true,
  },
  {
    badge: "3B • Ultra Rapide • 128K",
    bannerImage: "/site/mai-1-light/mai-1-light.png",
    borderHover: "hover:border-blue-500/40",
    color: "from-blue-500 to-cyan-500",
    context: "128K tokens",
    description:
      "Assistant IA local ultra-léger et rapide. Propulsé par IBM Granite 4.1 3B, adapté aux machines modestes pour les réponses instantanées et le travail quotidien.",
    id: "mai-1-light",
    name: "mAI-1-Light",
    num: "02",
    parameters: "3B",
    releaseDate: "11/07/2026",
    serieBg: "bg-blue-500/10 border-blue-500/20",
    serieColor: "text-blue-600",
    shadowHover: "hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.25)]",
    squareImage: "/site/mai-1-light/mai-1-light-carre.png",
    tagline: "Vitesse, efficacité et légèreté sur n'importe quel ordinateur.",
    tags: [
      "3B Paramètres",
      "Texte Uniquement",
      "Contexte 128K",
      "Léger & Rapide",
    ],
    vision: false,
  },
];

function ModelCard({ model, index }: { model: ModelCardData; index: number }) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 ${model.borderHover} transition-all duration-300 overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ${model.shadowHover} flex flex-col justify-between`}
      initial={{ opacity: 0, scale: 0.95 }}
      key={model.id}
      transition={{ delay: 0.2 + index * 0.1 }}
    >
      {/* Numéro décoratif */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <div className="text-7xl font-black italic tracking-tighter select-none text-slate-900">
          {model.num}
        </div>
      </div>

      <div className="relative z-10">
        {/* En-tête avec image et titre */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Image
              alt={`${model.name} logo`}
              className="w-full h-full object-cover"
              height={80}
              sizes="80px"
              src={model.squareImage}
              width={80}
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {model.name}
            </h2>
          </div>
        </div>

        {/* Image Bannière */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-6 border border-white/60 shadow-sm group-hover:shadow-md transition-all">
          <Image
            alt={`${model.name} banner`}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            src={model.bannerImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className="text-[11px] px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-medium shadow">
              {model.badge}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {model.description}
        </p>

        {/* Spécifications techniques */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            {model.cloud ? (
              <Cloud className="w-4 h-4 text-sky-500 shrink-0" />
            ) : (
              <Cpu className="w-4 h-4 text-purple-500 shrink-0" />
            )}
            <span>
              {model.cloud ? "Exécution" : "Paramètres"} :{" "}
              <strong>
                {model.cloud ? "Cloud (API mAI)" : model.parameters}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            {model.vision ? (
              <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>
              Vision :{" "}
              <strong>
                {model.vision ? "Oui (Multimodal)" : "Non (Texte)"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Contexte : <strong>{model.context}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Sortie : <strong>{model.releaseDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Actions / Liens */}
      <div className="relative z-10 pt-4 border-t border-black/5 flex items-center justify-between">
        <Link
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-md group-hover:shadow-lg text-sm"
          href={`/models/${model.id}`}
        >
          Découvrir {model.name}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function ModelsPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-16">
      {/* Hero Section */}
      <div className="text-left space-y-2">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] md:leading-[0.85] uppercase text-slate-900"
          initial={{ opacity: 0, y: -20 }}
        >
          Modèles <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500">
            mDevsLabs
          </span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1 }}
          className="text-slate-500 text-base md:text-lg font-light mt-2 md:mt-4 max-w-2xl"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
        >
          Explorez la gamme de modèles mAI : la génération cloud mAI-2 via
          l&apos;API mAI, et les modèles open-weights exécutables localement via
          Ollama.
        </motion.p>

        <motion.div
          animate={{ opacity: 1 }}
          className="pt-3"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PageSearch placeholder="Rechercher un modèle…" type="model" />
        </motion.div>
      </div>

      {/* ─── Section mAI-2 (Génération cloud) ───────────────────────── */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="scroll-mt-24"
        id="mai-2"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.15 }}
      >
        <div className="mb-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Série{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-teal-500">
              mAI-2
            </span>
          </h2>
          <p className="text-slate-500 text-sm font-light mt-1 max-w-2xl">
            La nouvelle génération de mAI, exécutée dans le cloud via l&apos;API
            mAI : contexte jusqu&apos;à 1 million de tokens, texte + images,
            disponible pour tous les forfaits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {models2.map((model, index) => (
            <ModelCard index={index} key={model.id} model={model} />
          ))}
        </div>
      </motion.section>

      {/* ─── Section mAI-1.5 (Nouvelle Génération 1.5) ───────────────────────── */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="scroll-mt-24"
        id="mai-1.5"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.15 }}
      >
        <div className="mb-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Série{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-amber-500 to-indigo-600">
              mAI-1.5
            </span>
          </h2>
          <p className="text-slate-500 text-sm font-light mt-1 max-w-2xl">
            La toute dernière génération mAI : vision multimodale intégrée, mode
            thinking (raisonnement étape par étape) et support natif des appels
            d'outils (tools) 100% en local.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          {models15.map((model, index) => (
            <ModelCard index={index} key={model.id} model={model} />
          ))}
        </div>
      </motion.section>

      {/* ─── Section mAI-1.2 (Génération 1.2) ─────────────────────────── */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="scroll-mt-24"
        id="mai-1.2"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Série{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-violet-500 to-rose-500">
              mAI-1.2
            </span>
          </h2>
          <p className="text-slate-500 text-sm font-light mt-1 max-w-2xl">
            Rapides et intelligents, 100% en local via Ollama. Tous les modèles
            mAI-1.2 sont multimodaux, à l'exception de mAI-1.2-Opal, qui reste
            orienté texte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          {models12.map((model, index) => (
            <ModelCard index={index} key={model.id} model={model} />
          ))}
        </div>
      </motion.section>

      {/* ─── Section mAI-1 (Première Génération) ───────────────────────────── */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="scroll-mt-24"
        id="mai-1"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Série{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
              mAI-1
            </span>
          </h2>
          <p className="text-slate-500 text-sm font-light mt-1 max-w-2xl">
            La première génération de modèles locaux mDevsLabs. Robustes,
            éprouvés et toujours disponibles via Ollama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {models1.map((model, index) => (
            <ModelCard index={index} key={model.id} model={model} />
          ))}
        </div>
      </motion.section>
    </div>
  );
}
