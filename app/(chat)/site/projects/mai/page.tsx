"use client";

import {
  BookOpen,
  BrainCircuit,
  Code,
  ExternalLink,
  Github,
  Globe,
  Layout,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { GithubRelease } from "@/components/site/github-release";
import Link from "@/components/site/router";

export default function MaiProjectPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-16">
      {/* Header */}
      <div className="text-left space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link
            className="hover:text-purple-600 transition-colors"
            href="/projects"
          >
            Projets
          </Link>
          <span>/</span>
          <span className="text-purple-600 font-medium">mAI Web</span>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: -20 }}
        >
          <div className="flex items-center gap-6">
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 0px rgba(168, 85, 247, 0))",
                  "drop-shadow(0 0 15px rgba(168, 85, 247, 0.3))",
                  "drop-shadow(0 0 0px rgba(168, 85, 247, 0))",
                ],
              }}
              className="w-20 h-20 md:w-28 md:h-28 rounded-3xl md:rounded-full bg-white/30 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex items-center justify-center p-4"
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            >
              <Image
                alt="mAI Web logo"
                className="w-full h-full object-contain drop-shadow-md"
                height={112}
                priority
                src="/site/mai.png"
                width={112}
              />
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] md:leading-[0.85] uppercase text-slate-900 drop-shadow-sm">
                  mAI Web
                </h1>
                <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 font-bold uppercase tracking-widest">
                  Archivé
                </span>
              </div>
              <p className="text-purple-600 font-medium text-lg italic mt-1">
                Passez à la vitesse supérieure !
              </p>
            </div>
          </div>
          <GithubRelease repo="mDevsLabs/mAI" showPreRelease={true} />
        </motion.div>
      </div>

      {/* Hero Glass Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/30 rounded-full blur-[80px] -z-10" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/30 rounded-full blur-[80px] -z-10" />

        <div className="relative z-10 max-w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            L&apos;intelligence artificielle réinventée pour vous.
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-3xl">
            mAI Web est votre assistant personnel de nouvelle génération. Il
            intègre les modèles de langage les plus avancés dans une interface
            fluide, intuitive et hautement personnalisable.
          </p>

          <div className="flex flex-row items-center gap-2 sm:gap-3 overflow-x-auto p-4 -m-4 max-w-full whitespace-nowrap scrollbar-none">
            <a
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-slate-900 font-semibold text-xs sm:text-sm hover:bg-white/60 transition-colors shrink-0"
              href="https://mai-devs.vercel.app"
              rel="noreferrer"
              target="_blank"
            >
              Découvrir mAI Web
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-slate-900 font-semibold text-xs sm:text-sm hover:bg-white/60 transition-colors shrink-0"
              href="https://github.com/mDevsLabs/mAI"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
              <Github className="w-4 h-4" />
            </a>
            <Link
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-slate-900 font-semibold text-xs sm:text-sm hover:bg-white/60 transition-colors shrink-0"
              href="/changelog/mai"
            >
              Changelog
              <BookOpen className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Fonctionnalités Principales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            delay={0.2}
            description="Accès aux derniers modèles de langage avec une compréhension contextuelle profonde."
            icon={<BrainCircuit className="w-6 h-6 text-purple-600" />}
            title="Modèles Avancés"
          />
          <FeatureCard
            delay={0.3}
            description="Une expérience visuelle époustouflante avec des effets de transparence et de flou."
            icon={<Layout className="w-6 h-6 text-purple-600" />}
            title="Interface Liquid Glass"
          />
          <FeatureCard
            delay={0.4}
            description="Historique persistant, recherche intelligente et organisation par dossiers."
            icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
            title="Discussions Fluides"
          />
          <FeatureCard
            delay={0.5}
            description="Temps de réponse optimisés pour une productivité sans interruption."
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            title="Performances Rapides"
          />
          <FeatureCard
            delay={0.6}
            description="Coloration syntaxique, rendu markdown et exécution de code simplifiée."
            icon={<Code className="w-6 h-6 text-purple-600" />}
            title="Outils Intégrés"
          />
          <FeatureCard
            delay={0.7}
            description="Une expérience réactive et puissante accessible directement dans votre navigateur."
            icon={<Globe className="w-6 h-6 text-purple-600" />}
            title="Application Web"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-2xl shadow-[0_4px_16px_0_rgba(31,38,135,0.05)] hover:shadow-[0_8px_24px_0_rgba(31,38,135,0.1)] transition-all group"
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay }}
    >
      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-xl font-bold text-slate-900 mb-2">{title}</h4>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
