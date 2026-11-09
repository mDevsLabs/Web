"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  SparklesIcon as Sparkles,
  TerminalIcon as Terminal,
  CpuIcon as Cpu,
  ActivityIcon as Activity,
  ServerIcon as Server,
  ShieldCheckIcon as ShieldCheck,
  ArrowRightIcon as ArrowRight,
  LayersIcon as Layers,
  ExternalLinkIcon as ExternalLink,
  UsersIcon as Users,
  MicIcon as Mic,
  SearchIcon as Search,
  ZapIcon as Zap,
} from "@mdevs/icons";

export function HomeWidgetsGrid() {
  const [activePrompt, setActivePrompt] = useState(
    "Planifie l'architecture d'un service d'IA souverain"
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState(
    "Architecture recommandée : Découplage BFF Next.js 16 pour le streaming UI avec exécuteur asynchrone Hono. Persistance hybride PostgreSQL Neon (Drizzle ORM) pour les mémoires vectorielles et chiffrement AES-256 des secrets via le standard ouvert MCP."
  );

  const [selectedModel, setSelectedModel] = useState<"mai-2" | "apex" | "opal" | "light">("mai-2");

  const runSimulation = (promptText: string) => {
    setActivePrompt(promptText);
    setIsSimulating(true);
    setStreamedResponse("");

    const fullText =
      promptText.includes("PostgreSQL")
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
    "mai-2": {
      name: "mAI-2 Flagship",
      tagline: "Raisonnement profond multimodal & architecture agentique avancée",
      context: "1 000 000 tokens",
      latency: "28ms premier token",
      throughput: "145 tokens/s",
      badge: "Nouvelle Génération",
      color: "from-purple-600 via-indigo-600 to-blue-600",
    },
    apex: {
      name: "mAI-1.5 Apex",
      tagline: "Modèle haute précision pour l'ingénierie logicielle et l'analyse de données",
      context: "256 000 tokens",
      latency: "32ms premier token",
      throughput: "115 tokens/s",
      badge: "Ingénierie & Code",
      color: "from-blue-600 to-cyan-600",
    },
    opal: {
      name: "mAI-1.5 Opal",
      tagline: "Équilibre optimal entre réactivité, performance sémantique et coût",
      context: "128 000 tokens",
      latency: "22ms premier token",
      throughput: "160 tokens/s",
      badge: "Équilibré & Polyvalent",
      color: "from-emerald-600 to-teal-600",
    },
    light: {
      name: "mAI-1.5 Light",
      tagline: "Ultra-rapide et optimisé pour le calcul edge et les réponses instantanées",
      context: "64 000 tokens",
      latency: "14ms premier token",
      throughput: "240 tokens/s",
      badge: "Ultra-Léger & Edge",
      color: "from-amber-600 to-orange-600",
    },
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <div className="flex flex-col items-center text-center mb-10 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-semibold tracking-wide uppercase mb-3 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Écosystème Unifié mAI</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900"
        >
          Une Plateforme Unique.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500">
            Toute l&apos;Intelligence.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed"
        >
          Explorez en direct les moteurs de calcul, les agents autonomes, les intégrations MCP et l&apos;infrastructure souveraine réunis dans mAI.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* WIDGET 1 : Moteur d'Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity opacity-70" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Moteur d&apos;Agents Autonomes</h3>
                  <p className="text-xs text-slate-500 font-medium">Orchestration multi-étapes &amp; sous-agents</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>En Ligne · v2.4</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { title: "1. Observation", desc: "UserMemory & Contexte", icon: Search, color: "text-blue-600", bg: "bg-blue-50 border-blue-200/80" },
                { title: "2. Réflexion", desc: "Thinking & Planification", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50 border-purple-200/80" },
                { title: "3. Outils & MCP", desc: "Sandbox & Outillage", icon: Terminal, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200/80" },
                { title: "4. Vérification", desc: "Synthèse & Validation", icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200/80" },
              ].map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3.5 border ${step.bg} flex flex-col justify-between transition-transform duration-200 hover:scale-[1.02]`}
                  >
                    <IconComponent className={`w-5 h-5 ${step.color} mb-2`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{step.title}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-center">
              <div>
                <div className="text-xl font-extrabold text-slate-900">24 ms</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Latence médiane</div>
              </div>
              <div className="border-x border-slate-200/80">
                <div className="text-xl font-extrabold text-purple-600">99.8%</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Fiabilité d&apos;exécution</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-600">4 actifs</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Sous-agents parallèles</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Standard ouvert Model Context Protocol compatible</span>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
            >
              <span>Lire la documentation technique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 2 : Statut Système */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Santé Système</h3>
                  <p className="text-xs text-slate-500 font-medium">Services opérationnels</p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3">
              {[
                { name: "API REST & Passerelle", status: "100%", latency: "18ms", active: true },
                { name: "Moteur Inférence mAI", status: "99.98%", latency: "28ms", active: true },
                { name: "Recherche mAI Search", status: "Opérationnel", latency: "You+Wiki", active: true },
                { name: "Authentification SSO JWT", status: "Opérationnel", latency: "0ms local", active: true },
                { name: "Bases PostgreSQL & Drizzle", status: "Synchro", latency: "Neon EU", active: true },
              ].map((svc, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{svc.latency}</span>
                    <span className="font-bold text-emerald-600">{svc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Surveillance continue 24/7</span>
            <Link
              href="/support"
              className="text-xs font-bold text-slate-700 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
            >
              Assistance &amp; Incidents <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 3 : Mini-Playground Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 bg-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Terminal &amp; Test Interactif</h3>
                  <p className="text-xs text-slate-400 font-medium">Simulation instantanée avec inférence locale</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-300 text-xs font-mono">
                  Modèle : mAI-2 (Raisonnement Actif)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "Planifie l'architecture d'un service d'IA souverain",
                "Analyse et optimise les requêtes d'une base PostgreSQL",
                "Rédige un serveur MCP personnalisé pour un connecteur API",
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => runSimulation(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activePrompt === p
                      ? "bg-purple-600/30 border-purple-500 text-purple-200 font-semibold"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

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
                <span className="text-emerald-400 font-semibold">Exécution réussie</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Découvrez la puissance complète de l&apos;agent autonome dans l&apos;application mAI.
            </span>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30"
            >
              <span>Continuer dans le Chat mAI</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 4 : Modèles Phares */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catalogue Modèles</h3>
                  <p className="text-xs text-slate-500 font-medium">Famille mAI de pointe</p>
                </div>
              </div>
              <Link href="/models" className="text-xs font-bold text-purple-600 hover:underline">
                Tous les modèles
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100/80 mb-4 text-xs font-semibold">
              {(["mai-2", "apex", "opal", "light"] as const).map((mKey) => (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setSelectedModel(mKey)}
                  className={`py-1.5 rounded-lg transition-all capitalize cursor-pointer text-center ${
                    selectedModel === mKey
                      ? "bg-white text-purple-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {mKey === "mai-2" ? "mAI-2" : mKey}
                </button>
              ))}
            </div>

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
                  <span className="font-bold text-slate-900">{modelSpecs[selectedModel].context}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vitesse :</span>
                  <span className="font-bold text-emerald-600">{modelSpecs[selectedModel].throughput}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Latence :</span>
                  <span className="font-bold text-purple-600">{modelSpecs[selectedModel].latency}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Disponible API &amp; Ollama</span>
            <Link href="/models" className="font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1">
              Explorer les benchmarks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 5 : Modules Vibe & Wakies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Expériences Intégrées : Vibe &amp; Wakies</h3>
                  <p className="text-xs text-slate-500 font-medium">Réseau social IA &amp; collaboration vocale temps réel</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                100% Intégré
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 border border-purple-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-pink-600" />
                    <span className="font-bold text-sm text-slate-900">Vibe · Réseau Social IA</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Partagez des stories 24h, publiez des médias jusqu&apos;à 1 Go et conversez avec mAI nativement au cœur de vos cercles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Stories · Fil · Collections</span>
                  <a href="/vibe" className="text-xs font-bold text-pink-600 hover:text-pink-700 inline-flex items-center gap-1">
                    Accéder à Vibe <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-slate-900">Wakies · Espaces Vocaux</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Échangez vocalement avec des mascottes et spécialistes IA en direct, collaborez dans des espaces partagés et pilotez vos flux.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Voix HD · Spécialistes IA</span>
                  <Link href="/downloads" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                    Télécharger Wakies <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Passerelle d&apos;identité unifiée par e-mail et notifications synchronisées</span>
            <Link href="/docs" className="font-bold text-indigo-600 hover:text-indigo-700">
              Guide d&apos;écosystème →
            </Link>
          </div>
        </motion.div>

        {/* WIDGET 6 : Écosystème GitHub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Écosystème mAI</h3>
                <p className="text-xs text-slate-500 font-medium">Transparence &amp; Communauté</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Version Active</span>
                <span className="font-bold text-slate-900 font-mono">v0.9.4 Stable</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Licence Logicielle</span>
                <span className="font-bold text-slate-900 font-mono">MIT / Souverain</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Design System</span>
                <span className="font-bold text-purple-600 font-mono">@mdevs/ui 0.9.4</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Dépôts ouverts mDevsLabs</span>
            <a
              href="https://github.com/mDevsLabs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-800 hover:text-purple-600 inline-flex items-center gap-1"
            >
              GitHub Organisation <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
