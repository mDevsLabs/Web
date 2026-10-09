"use client";

import { ArchiveIcon as Archive, ExternalLinkIcon as ExternalLink, Gamepad2Icon as Gamepad2, LayersIcon as Layers, SearchIcon as Search } from "@mdevs/icons";
import type { IconProps } from "@mdevs/icons";
import { motion } from "motion/react";
import Image from "next/image";
import { GithubRepoStats } from "@/components/site/github-repo-stats";
import { getProjectPresentation } from "@/components/site/projects/project-presentation";
import Link from "@/components/site/router";
import { PageSearch } from "@/components/site/ui/search-bar";
import {
  activeProjects,
  PLATFORM_DEVICE_ICONS,
  type Project,
  publicArchivedProjects,
} from "@/lib/site/projects-data";

type ActiveProjectCard = Project & {
  number: string;
  link: string;
  repo: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  borderHover: string;
};

const activeProjectCards: ActiveProjectCard[] = activeProjects.map(
  (project) => ({
    ...project,
    link: project.link ?? `/projects/${project.id}`,
    number: project.number ?? "",
    repo: project.repo ?? "",
    ...getProjectPresentation(project),
  })
);

const archivedProjectIcons: Record<string, React.ComponentType<any>> = {
  msearch: Search,
  openprovider: Layers,
  snob: Gamepad2,
};

const archivedProjectCards = publicArchivedProjects.map((project) => ({
  ...project,
  icon: archivedProjectIcons[project.id] ?? Archive,
}));

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-16">
      {/* En-tête de la page */}
      <div className="text-left space-y-2">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] md:leading-[0.85] uppercase text-slate-900"
          initial={{ opacity: 0, y: -20 }}
        >
          Projets <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500">
            Suite mAI
          </span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1 }}
          className="text-slate-500 text-base md:text-lg font-light mt-2 md:mt-4 max-w-2xl"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
        >
          Découvrez la suite officielle des 5 projets mAI développés par
          mDevsLabs pour révolutionner votre façon de travailler avec
          l'intelligence artificielle.
        </motion.p>

        <motion.div
          animate={{ opacity: 1 }}
          className="pt-3"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PageSearch placeholder="Rechercher un projet…" type="project" />
        </motion.div>
      </div>

      {/* Grille des 5 projets actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeProjectCards.map((project, idx) => {
          const IconComponent = project.icon;
          return (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 transition-all overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ${project.borderHover} flex flex-col justify-between`}
              initial={{ opacity: 0, scale: 0.95 }}
              key={project.id}
              transition={{ delay: 0.1 + idx * 0.08 }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <div className="text-6xl font-black italic tracking-tighter select-none text-slate-900">
                  {project.number}
                </div>
              </div>

              <div className="flex flex-col relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-900 shadow-md">
                    <IconComponent className={`w-8 h-8 ${project.iconColor}`} />
                  </div>
                </div>

                <h2 className="text-3xl font-black mb-1 text-slate-900 flex items-center gap-2">
                  {project.name}
                </h2>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.platforms.map((plat) => {
                    const device = PLATFORM_DEVICE_ICONS[plat];
                    return (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-xs text-slate-800 uppercase font-bold tracking-wider"
                        key={plat}
                      >
                        {device && (
                          <Image
                            alt={device.alt}
                            className="w-3 h-3 object-contain"
                            height={12}
                            src={device.src}
                            width={12}
                          />
                        )}
                        {plat}
                      </span>
                    );
                  })}
                </div>

                <p className="text-purple-600 font-medium text-xs sm:text-sm mb-3 italic">
                  &quot;{project.tagline ?? project.description}&quot;
                </p>

                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-slate-200/60 mt-auto">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <Link
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-purple-600 transition-all shadow-xs"
                    href={project.link}
                  >
                    Découvrir {project.name}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {project.repo ? (
                  <GithubRepoStats repo={project.repo} />
                ) : (
                  <div className="text-xs font-bold text-slate-400 italic py-1">
                    Dépôt GitHub : En conception
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────
          SECTION PROJETS ARCHIVÉS
      ───────────────────────────────────────────── */}
      <div className="pt-8 border-t border-slate-200">
        <div className="text-left space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase tracking-wider">
            <Archive className="w-3.5 h-3.5" />
            Historique &amp; Archives
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">
            Projets <span className="text-slate-500">Archivés</span>
          </h2>
          <p className="text-slate-500 text-sm font-light">
            Ces projets ne reçoivent plus de mises à jour majeures mais restent
            accessibles à des fins de documentation et d&apos;archive technique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedProjectCards.map((project) => {
            const IconComponent = project.icon;
            return (
              <div
                className="bg-white/30 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between opacity-80 hover:opacity-100 hover:border-slate-300 transition-all"
                key={project.id}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center p-2 border border-slate-200">
                      {project.image ? (
                        <Image
                          alt={project.name}
                          className="w-full h-full object-contain rounded-lg"
                          height={32}
                          src={project.image}
                          width={32}
                        />
                      ) : (
                        <IconComponent className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 font-bold uppercase tracking-widest">
                      {project.label ?? "Archivé"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.platforms.map((p) => (
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                        key={p}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                  {project.link ? (
                    <Link
                      className="text-xs font-semibold text-slate-700 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      href={project.link}
                    >
                      Voir l&apos;archive
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      Archive non publiée
                    </span>
                  )}
                  {project.repo && <GithubRepoStats repo={project.repo} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
