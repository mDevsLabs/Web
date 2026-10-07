"use client";

import { motion } from "motion/react";
import { ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GithubRepoStats } from "@/components/github-repo-stats";
import { getProjectPresentation } from "@/components/projects/project-presentation";
import { activeProjects } from "@/lib/projects-data";

/**
 * Vitrine « La Suite mAI » de la page d'accueil.
 *
 * Les données proviennent de `lib/projects-data.ts` : c'est la même source que la
 * page /projects, la navigation et l'index de recherche. Aucun tableau local, donc
 * aucune dérive possible sur l'ordre, les descriptions ou le nombre de projets.
 */
export function ProjectsShowcase() {
  return (
    <section className="w-full py-6 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4"
      >
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900">
            La Suite <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500">mAI</span>
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-light mt-1 max-w-xl">
            Cinq produits dédiés conçus pour booster votre productivité, votre créativité et vos workflows avec l&apos;IA.
          </p>
        </div>

        <Link
          href="/projects"
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200 hover:border-blue-300 text-slate-900 text-sm font-bold transition-all shadow-xs w-fit"
        >
          Tous les projets
          <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {activeProjects.map((project, index) => {
          const { icon: Icon, iconColor, borderHover } = getProjectPresentation(project);
          const link = project.link ?? `/projects/${project.id}`;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
              className={`group relative bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 sm:p-7 transition-colors duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${borderHover}`}
            >
              {project.number && (
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <span className="text-6xl sm:text-7xl font-black italic tracking-tighter select-none text-slate-900">
                    {project.number}
                  </span>
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900 text-white shadow-md p-2 group-hover:scale-105 transition-transform duration-200">
                    <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
                  {project.name}
                </h3>

                {project.tagline && (
                  <p className="text-xs font-semibold text-slate-500 italic mb-2.5">
                    &quot;{project.tagline}&quot;
                  </p>
                )}

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.platforms.map((plat) => (
                    <span
                      key={plat}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-700 font-bold uppercase tracking-wider"
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-3.5 border-t border-slate-200/60 flex items-center justify-between gap-3 flex-wrap">
                <Link
                  href={link}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-purple-600 transition-colors shadow-xs"
                >
                  Découvrir {project.name}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="shrink-0">
                  {project.repo ? (
                    <GithubRepoStats repo={project.repo} />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 italic">En conception</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
