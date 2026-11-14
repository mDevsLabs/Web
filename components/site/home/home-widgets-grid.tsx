"use client";

import {
  ActivityIcon as Activity,
  ArrowRightIcon as ArrowRight,
  CpuIcon as Cpu,
  ExternalLinkIcon as ExternalLink,
  LayersIcon as Layers,
  MicIcon as Mic,
  SearchIcon as Search,
  ServerIcon as Server,
  ShieldCheckIcon as ShieldCheck,
  SparklesIcon as Sparkles,
  TerminalIcon as Terminal,
  UsersIcon as Users,
  ZapIcon as Zap,
} from "@mdevs/icons";
import { motion } from "motion/react";
import { useState } from "react";
import Link from "@/components/site/router";

export function HomeWidgetsGrid() {
  // État du mini-playground interactif
  const [activePrompt, setActivePrompt] = useState(
    "Planifie l'architecture d'un service d'IA souverain"
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState(
    "Architecture recommandée : Découplage BFF Next.js 16 pour le streaming UI avec exécuteur asynchrone Hono. Persistance hybride PostgreSQL Neon (Drizzle ORM) pour les mémoires vectorielles et chiffrement AES-256 des secrets via le standard ouvert MCP."
  );

  // État du comparatif modèles
  const [selectedModel, setSelectedModel] = useState<
    "mai-2" | "apex" | "opal" | "light"
  >("mai-2");

  // Simulation interactive de génération de texte
  const runSimulation = (promptText: string) => {
    setActivePrompt(promptText);
    setIsSimulating(true);
    setStreamedResponse("");

    const fullText = promptText.includes("PostgreSQL")
      ? "Analyse de la base : 12 index partiels détectés. Recommandation : activation de pg_stat_statements pour mesurer les requêtes chaudes et isolation des transactions de migration avec SearchPath fixé pour éviter les blocages DDL."
      : promptText.includes("MCP")
        ? "Génération du serveur MCP : Protocole JSON-RPC standardisé. 3 outils exposés via @modelcontextprotocol/sdk. Déclaration des schémas d'entrées avec Zod et gestion sécurisée des jetons OAuth chiffrés."
        : "Architecture recommandée : Découplage BFF Next.js 16 pour le streaming UI avec exécuteur asynchrone Hono. Persistance hybride PostgreSQL Neon (Drizzle ORM) pour les mémoires vectorielles et chiffrement AES-256 des secrets via le standard ouvert MCP.";

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex += 6;
      if (currentIndex >= fullText.length) {
        setStreamedResponse(fullText);
        setIsSimulating(false);
        clearInterval(interval);
      } else {
        setStreamedResponse(fullText.slice(0, currentIndex));
      }
    }, 25);
  };

  const modelSpecs = {
    apex: {
      badge: "Ingénierie & Code",
      color: "from-blue-600 to-cyan-600",
      context: "256 000 tokens",
      latency: "32ms premier token",
      name: "mAI-1.5 Apex",
      tagline:
        "Modèle haute précision pour l'ingénierie logicielle et l'analyse de données",
      throughput: "115 tokens/s",
    },
    light: {
      badge: "Ultra-Léger & Edge",
      color: "from-amber-600 to-orange-600",
      context: "64 000 tokens",
      latency: "14ms premier token",
      name: "mAI-1.5 Light",
      tagline:
        "Ultra-rapide et optimisé pour le calcul edge et les réponses instantanées",
      throughput: "240 tokens/s",
    },
    "mai-2": {
      badge: "Nouvelle Génération",
      color: "from-purple-600 via-indigo-600 to-blue-600",
      context: "1 000 000 tokens",
      latency: "28ms premier token",
      name: "mAI-2 Flagship",
      tagline:
        "Raisonnement profond multimodal & architecture agentique avancée",
      throughput: "145 tokens/s",
    },
    opal: {
      badge: "Équilibré & Polyvalent",
      color: "from-emerald-600 to-teal-600",
      context: "128 000 tokens",
      latency: "22ms premier token",
      name: "mAI-1.5 Opal",
      tagline:
        "Équilibre optimal entre réactivité, performance sémantique et coût",
      throughput: "160 tokens/s",
    },
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      {/* En-tête de la section */}
      <div className="flex flex-col items-center text-center mb-10 md:mb-16">
        <motion.div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-semibold tracking-wide uppercase mb-3 shadow-xs"
          initial={{ opacity: 0, y: 15 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Écosystème Unifié mAI</span>
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900"
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Une Plateforme Unique.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500">
            Toute l&apos;Intelligence.
          </span>
        </motion.h2>

        <motion.p
          className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Explorez en direct les moteurs de calcul, les agents autonomes, les
          intégrations MCP et l&apos;infrastructure souveraine réunis dans mAI.
        </motion.p>
      </div>

      {/* Grille Bento de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* WIDGET 1 : Moteur d'Agents & Orchestration en direct (2 colonnes) */}
        <motion.div
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between group"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Lueur d'arrière-plan */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity opacity-70" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Moteur d&apos;Agents Autonomes
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Orchestration multi-étapes &amp; sous-agents
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>En Ligne · v2.4</span>
              </div>
            </div>

            {/* Visualisation de la boucle d'agent */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {
                  bg: "bg-blue-50 border-blue-200/80",
                  color: "text-blue-600",
                  desc: "UserMemory & Contexte",
                  icon: Search,
                  title: "1. Observation",
                },
                {
                  bg: "bg-purple-50 border-purple-200/80",
                  color: "text-purple-600",
                  desc: "Thinking & Planification",
                  icon: Sparkles,
                  title: "2. Réflexion",
                },
                {
                  bg: "bg-emerald-50 border-emerald-200/80",
                  color: "text-emerald-600",
                  desc: "Sandbox & Sandboxing",
                  icon: Terminal,
                  title: "3. Outils & MCP",
                },
                {
                  bg: "bg-indigo-50 border-indigo-200/80",
                  color: "text-indigo-600",
                  desc: "Synthèse & Validation",
                  icon: ShieldCheck,
                  title: "4. Vérification",
                },
              ].map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div
                    className={`rounded-2xl p-3.5 border ${step.bg} flex flex-col justify-between transition-transform duration-200 hover:scale-[1.02]`}
                    key={idx}
                  >
                    <IconComponent className={`w-5 h-5 ${step.color} mb-2`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {step.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Statistiques d'exécution */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-center">
              <div>
                <div className="text-xl font-extrabold text-slate-900">
                  24 ms
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Latence médiane
                </div>
              </div>
              <div className="border-x border-slate-200/80">
                <div className="text-xl font-extrabold text-purple-600">
                  99.8%
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Fiabilité d&apos;exécution
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-600">
                  4 actifs
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Sous-agents parallèles
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Standard ouvert Model Context Protocol compatible
            </span>
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
              href="/docs"
            >
              <span>Lire la documentation technique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 2 : Statut Système & Santé Infrastructure (1 colonne) */}
        <motion.div
          className="rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Santé Système
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Services opérationnels
                  </p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3">
              {[
                {
                  active: true,
                  latency: "18ms",
                  name: "API REST & Passerelle BFF",
                  status: "100%",
                },
                {
                  active: true,
                  latency: "28ms",
                  name: "Moteur Inférence mAI",
                  status: "99.98%",
                },
                {
                  active: true,
                  latency: "You+Wiki",
                  name: "Recherche mAI Search",
                  status: "Opérationnel",
                },
                {
                  active: true,
                  latency: "0ms local",
                  name: "Authentification SSO JWT",
                  status: "Opérationnel",
                },
                {
                  active: true,
                  latency: "Neon EU",
                  name: "Bases PostgreSQL & Drizzle",
                  status: "Synchro",
                },
              ].map((svc, i) => (
                <div
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                  key={i}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">
                      {svc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {svc.latency}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Surveillance continue 24/7
            </span>
            <Link
              className="text-xs font-bold text-slate-700 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
              href="/support"
            >
              Assistance &amp; Incidents <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 3 : Mini-Playground & Terminal Interactif (2 colonnes) */}
        <motion.div
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 bg-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Lueur tech de fond */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Terminal &amp; Test Interactif
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Simulation instantanée avec inférence locale
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-300 text-xs font-mono">
                  Modèle : mAI-2 (Raisonnement Actif)
                </span>
              </div>
            </div>

            {/* Boutons d'exemples de prompts rapides */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "Planifie l'architecture d'un service d'IA souverain",
                "Analyse et optimise les requêtes d'une base PostgreSQL",
                "Rédige un serveur MCP personnalisé pour un connecteur API",
              ].map((p, idx) => (
                <button
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activePrompt === p
                      ? "bg-purple-600/30 border-purple-500 text-purple-200 font-semibold"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                  key={idx}
                  onClick={() => runSimulation(p)}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Console de sortie interactive */}
            <div className="rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs leading-relaxed min-h-[120px] flex flex-col justify-between">
              <div>
                <div className="text-slate-400 mb-2 flex items-center gap-2">
                  <span className="text-purple-400 font-bold">$</span>
                  <span className="text-slate-200">{activePrompt}</span>
                </div>
                <div className="text-emerald-400 font-sans text-sm leading-normal">
                  {streamedResponse}
                  {isSimulating && (
                    <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 pt-2 border-t border-white/10">
                <span>Tokens générés : 148 · Latence : 22ms</span>
                <span className="text-emerald-400 font-semibold">
                  Exécution réussie
                </span>
              </div>
            </div>
          </div>

          {/* Action : Ouvrir dans le chat complet */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Découvrez la puissance complète de l&apos;agent autonome dans
              l&apos;application mAI.
            </span>
            <a
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30"
              href="/"
            >
              <span>Continuer dans le Chat mAI</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* WIDGET 4 : Modèles Phares & Comparatif (1 colonne) */}
        <motion.div
          className="rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Catalogue Modèles
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Famille mAI de pointe
                  </p>
                </div>
              </div>
              <Link
                className="text-xs font-bold text-purple-600 hover:underline"
                href="/models"
              >
                Tous les modèles
              </Link>
            </div>

            {/* Onglets des modèles */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100/80 mb-4 text-xs font-semibold">
              {(["mai-2", "apex", "opal", "light"] as const).map((mKey) => (
                <button
                  className={`py-1.5 rounded-lg transition-all capitalize cursor-pointer text-center ${
                    selectedModel === mKey
                      ? "bg-white text-purple-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  key={mKey}
                  onClick={() => setSelectedModel(mKey)}
                  type="button"
                >
                  {mKey === "mai-2" ? "mAI-2" : mKey}
                </button>
              ))}
            </div>

            {/* Fiche du modèle sélectionné */}
            <div className="p-4 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/90 to-purple-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-slate-900">
                  {modelSpecs[selectedModel].name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {modelSpecs[selectedModel].badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {modelSpecs[selectedModel].tagline}
              </p>

              <div className="space-y-1.5 text-[11px] font-medium text-slate-700 border-t border-slate-200/50 pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contexte :</span>
                  <span className="font-bold text-slate-900">
                    {modelSpecs[selectedModel].context}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vitesse :</span>
                  <span className="font-bold text-emerald-600">
                    {modelSpecs[selectedModel].throughput}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Latence :</span>
                  <span className="font-bold text-purple-600">
                    {modelSpecs[selectedModel].latency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Disponible API &amp; Ollama</span>
            <Link
              className="font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
              href={"/models"}
            >
              Explorer les benchmarks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 5 : Modules Unifiés Vibe & Wakies (2 colonnes) */}
        <motion.div
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Expériences Intégrées : Vibe &amp; Wakies
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Réseau social IA &amp; collaboration vocale temps réel
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                100% Intégré
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Carte Vibe */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 border border-purple-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-pink-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Vibe · Réseau Social IA
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Partagez des stories 24h, publiez des médias jusqu&apos;à 1
                    Go et conversez avec mAI nativement au cœur de vos cercles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Stories · Fil · Collections
                  </span>
                  <a
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 inline-flex items-center gap-1"
                    href="/vibe"
                  >
                    Accéder à Vibe <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Carte Wakies */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Wakies · Espaces Vocaux
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Échangez vocalement avec des mascottes et spécialistes IA en
                    direct, collaborez dans des espaces partagés et pilotez vos
                    flux.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Voix HD · Spécialistes IA
                  </span>
                  <Link
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    href="/downloads"
                  >
                    Télécharger Wakies <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Passerelle d&apos;identité unifiée par e-mail et notifications
              synchronisées
            </span>
            <Link
              className="font-bold text-indigo-600 hover:text-indigo-700"
              href="/docs"
            >
              Guide d&apos;écosystème →
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 6 : Écosystème GitHub & Communauté (1 colonne) */}
        <motion.div
          className="rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Écosystème mAI
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Transparence &amp; Communauté
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  Version Active
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  v0.9.4 Stable
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  Licence Logicielle
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  MIT / Souverain
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  Design System
                </span>
                <span className="font-bold text-purple-600 font-mono">
                  @mdevs/ui 0.9.4
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Dépôts ouverts mDevsLabs</span>
            <a
              className="font-bold text-slate-800 hover:text-purple-600 inline-flex items-center gap-1"
              href="https://github.com/mDevsLabs"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub Organisation <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
