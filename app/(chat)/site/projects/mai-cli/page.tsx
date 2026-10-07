"use client";

import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileCode,
  Github,
  GitPullRequest,
  Key,
  MessageSquare,
  Sparkles,
  Terminal,
  Ticket,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { GithubRelease } from "@/components/site/github-release";
import { GithubRepoStats } from "@/components/site/github-repo-stats";
import Link from "@/components/site/router";

type InstallTab = "macOS" | "Linux" | "Windows" | "Source";

export default function MaiCliProjectPage() {
  const [activeTab, setActiveTab] = useState<InstallTab>("macOS");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const installCommands: Record<
    InstallTab,
    { title: string; cmd: string; desc: string }
  > = {
    Linux: {
      cmd: "curl -fsSL https://raw.githubusercontent.com/mDevsLabs/mAI-CLI/main/scripts/install-remote.sh | bash",
      desc: "Télécharge et installe automatiquement la version stable de mai sous Linux et WSL.",
      title: "Script cURL (Linux / WSL)",
    },
    macOS: {
      cmd: "brew install mDevsLabs/mAI-CLI/mai",
      desc: "Installe mAI CLI via le tap officiel Homebrew mDevsLabs.",
      title: "Homebrew (macOS)",
    },
    Source: {
      cmd: "git clone https://github.com/mDevsLabs/mAI-CLI.git && cd mAI-CLI && bash scripts/install-user.sh",
      desc: "Clonez le dépôt officiel et compilez mAI CLI pour votre environnement.",
      title: "Compilation depuis les sources",
    },
    Windows: {
      cmd: 'powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/mDevsLabs/mAI-CLI/main/scripts/install-remote.ps1 | iex"',
      desc: "Installe mAI CLI directement via PowerShell sur Windows.",
      title: "PowerShell (Windows 10/11)",
    },
  };

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    toast.success("Commande copiée dans le presse-papier !");
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  return (
    <div className="flex flex-col gap-10 md:gap-16">
      {/* Fil d'Ariane & En-tête */}
      <div className="text-left space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link
            className="hover:text-purple-600 transition-colors"
            href="/projects"
          >
            Projets
          </Link>
          <span>/</span>
          <span className="text-purple-600 font-medium">mAI CLI</span>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: -20 }}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 0px rgba(168, 85, 247, 0))",
                  "drop-shadow(0 0 15px rgba(168, 85, 247, 0.35))",
                  "drop-shadow(0 0 0px rgba(168, 85, 247, 0))",
                ],
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-3xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center p-3 sm:p-4 text-purple-400 shrink-0"
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            >
              <Terminal className="w-full h-full" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] uppercase text-slate-900 drop-shadow-sm">
                  mAI CLI
                </h1>
                <span className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 font-bold uppercase tracking-widest">
                  Archivé
                </span>
              </div>
              <p className="text-purple-600 font-medium text-base sm:text-lg italic mt-1">
                L&apos;assistant de développement qui vit dans votre terminal !
              </p>
            </div>
          </div>
          <div className="pt-2">
            <GithubRelease repo="mDevsLabs/mAI-CLI" showPreRelease={true} />
          </div>
        </motion.div>
      </div>

      {/* Hero Glass Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 md:p-12 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-[80px] -z-10" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px] -z-10" />

        <div className="relative z-10 max-w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            L&apos;assistant IA conçu pour là où le code prend vie.
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6 max-w-3xl font-light">
            <strong>mAI CLI</strong> s&apos;installe directement dans votre
            session de terminal. Sans changer de fenêtre ni recopier de
            contexte, lancez la commande{" "}
            <code className="px-2 py-0.5 rounded bg-slate-900 text-purple-300 font-mono text-sm">
              mai
            </code>{" "}
            pour analyser vos pull requests, résoudre des tickets, éditer des
            fichiers et exécuter vos scripts.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-md shrink-0"
              href="https://github.com/mDevsLabs/mAI-CLI"
              rel="noreferrer"
              target="_blank"
            >
              Voir sur GitHub
              <Github className="w-4 h-4" />
            </a>
            <Link
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-slate-900 font-semibold text-sm hover:bg-white transition-colors shrink-0"
              href="/docs?doc=app-mai-cli"
            >
              Documentation complète
              <BookOpen className="w-4 h-4 text-purple-600" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-sm hover:bg-purple-100 transition-colors shrink-0"
              href="/site/news/introducing-mai-cli"
            >
              Lire l&apos;annonce
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Installation Rapide (Terminal Widget) */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-6 h-6 text-purple-600" />
          Installation Rapide
        </h3>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 mb-4">
            {(["macOS", "Linux", "Windows", "Source"] as InstallTab[]).map(
              (tab) => (
                <button
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          {/* Terminal Box */}
          <div className="space-y-3">
            <p className="text-xs text-slate-400 italic">
              {installCommands[activeTab].desc}
            </p>

            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 font-mono text-xs sm:text-sm overflow-x-auto">
              <span className="text-purple-300 select-all whitespace-nowrap">
                {installCommands[activeTab].cmd}
              </span>
              <button
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-sans font-medium"
                onClick={() => copyToClipboard(installCommands[activeTab].cmd)}
                title="Copier la commande"
              >
                {copiedCommand === installCommands[activeTab].cmd ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fonctionnalités Principales */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Fonctionnalités Principales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            delay={0.2}
            description="Analyse instantanée des modifications git, résumés d'intentions et repérage des zones sensibles avant la relecture humaine."
            icon={<GitPullRequest className="w-6 h-6 text-purple-600" />}
            title="Relecture de Pull Request"
          />
          <FeatureCard
            delay={0.3}
            description="Consultez et résumez les tickets ouverts, reliez-les aux modules de votre code et obtenez des propositions de correctifs."
            icon={<Ticket className="w-6 h-6 text-purple-600" />}
            title="Gestion des tickets & bugs"
          />
          <FeatureCard
            delay={0.4}
            description="Accès natif au système de fichiers : lit, comprend et applique les modifications de code sur vos fichiers."
            icon={<FileCode className="w-6 h-6 text-purple-600" />}
            title="Édition directe de fichiers"
          />
          <FeatureCard
            delay={0.5}
            description="Lance vos builds, exécute la suite de tests et interprète en direct les erreurs de compilation pour les corriger."
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            title="Exécution de commandes Shell"
          />
          <FeatureCard
            delay={0.6}
            description="Communiquez sur WhatsApp, Discord, X (Twitter) et Reddit directement depuis votre session terminal sans altérer votre concentration."
            icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
            title="Messagerie Intégrée (Exclusif)"
          />
          <FeatureCard
            delay={0.7}
            description="Bring Your Own Key : utilisez vos propres clés chez le fournisseur IA de votre choix (Ollama, Hugging Face, OpenAI, etc.)."
            icon={<Key className="w-6 h-6 text-purple-600" />}
            title="BYOK & Indépendance"
          />
        </div>
      </div>

      {/* GitHub Repo Live Stats */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900">
            Dépôt GitHub mDevsLabs/mAI-CLI
          </h4>
          <p className="text-slate-600 text-sm font-light">
            Un projet open source en accès anticipé auquel vous pouvez
            participer.
          </p>
        </div>
        <div>
          <GithubRepoStats repo="mDevsLabs/mAI-CLI" />
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
