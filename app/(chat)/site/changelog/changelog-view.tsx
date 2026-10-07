"use client";

import {
  ArrowLeft,
  ExternalLink,
  GitCommit,
  type LucideIcon,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import Link from "@/components/site/router";
import type { ChangelogsByProject } from "@/lib/site/changelog";

const iconMap: Record<string, LucideIcon> = {
  GitCommit,
  Star,
  Zap,
};

function cleanMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/<a name="[^"]+"><\/a>/g, "")
    .replace(/<sup>Released on \*\*([^*]+)\*\*<\/sup>/gi, "*Publié le $1*")
    .replace(/<div align="right">[\s\S]*?<\/div>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<details>/gi, "\n")
    .replace(/<\/details>/gi, "\n")
    .replace(/<summary>([\s\S]*?)<\/summary>/gi, "\n**$1**\n")
    .replace(/<kbd>([\s\S]*?)<\/kbd>/gi, "`$1`")
    .trim();
}

const markdownComponents = (isSearch: boolean) => ({
  a: ({ ...props }) => (
    <a
      className={`font-semibold hover:underline ${isSearch ? "text-blue-600" : "text-purple-600"}`}
      rel="noreferrer"
      target="_blank"
      {...props}
    />
  ),
  code: ({ ...props }) => (
    <code
      className="bg-slate-100 px-1.5 py-0.5 rounded text-sm text-pink-600 font-mono"
      {...props}
    />
  ),
  h1: ({ ...props }) => (
    <h1
      className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 mt-8 mb-4"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 mt-8 mb-4 border-b border-black/10 pb-2"
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3" {...props} />
  ),
  h4: ({ ...props }) => (
    <h4 className="text-lg font-bold text-slate-900 mt-5 mb-2" {...props} />
  ),
  li: ({ ...props }) => <li {...props} />,
  p: ({ ...props }) => (
    <p
      className="my-3 text-slate-600 leading-relaxed text-sm md:text-base font-light"
      {...props}
    />
  ),
  sup: ({ ...props }) => (
    <span className="text-xs italic block mb-2" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul
      className="list-disc pl-6 my-3 text-slate-600 space-y-1.5 text-sm md:text-base"
      {...props}
    />
  ),
});

export default function ChangelogView({
  changelogs,
  filterProject,
}: {
  changelogs: ChangelogsByProject;
  filterProject?: "mai" | "msearch";
}) {
  const isSearch = filterProject === "msearch";
  const projectColor = isSearch ? "blue" : "purple";
  const projectName = isSearch ? "mSearch" : "mAI";
  const projectRepo = isSearch ? "mDevsLabs/mSearch" : "mDevsLabs/mAI";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-left mb-10 md:mb-16 space-y-2">
        <Link
          className={`inline-flex items-center gap-2 text-${projectColor}-600 hover:text-${projectColor}-800 transition-colors mb-4`}
          href="/projects"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </Link>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] md:leading-[0.85] uppercase text-slate-900"
          initial={{ opacity: 0, y: -20 }}
        >
          Notes de <br className="hidden sm:block" />
          <span
            className={`text-transparent bg-clip-text bg-gradient-to-r from-${projectColor}-500 via-blue-500 to-emerald-500`}
          >
            Version
          </span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1 }}
          className="text-slate-500 text-base md:text-lg font-light mt-2 md:mt-4"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
        >
          Suivez l&apos;évolution et les dernières mises à jour de{" "}
          <span className={`text-${projectColor}-600 font-semibold`}>
            {projectName}
          </span>
          .
        </motion.p>
      </div>

      <div className="flex flex-col gap-12">
        {/* mAI Changelog */}
        {(!filterProject || filterProject === "mai") && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-purple-600">mAI</span> Changelog
            </h2>
            <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="prose max-w-none text-slate-600 prose-headings:text-slate-800 prose-a:text-purple-600 prose-strong:text-slate-800 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-purple-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:not-italic prose-blockquote:text-slate-600">
                {changelogs?.mAIRaw ? (
                  <Markdown components={markdownComponents(false)}>
                    {cleanMarkdown(changelogs.mAIRaw)}
                  </Markdown>
                ) : (
                  <div className="space-y-10 md:space-y-8 flex-1">
                    {changelogs?.mAI?.map((change, i) => {
                      const Icon = iconMap[change.icon as string] || Star;
                      return (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className="border-l-2 border-slate-200 pl-4 md:pl-6 py-2 relative group"
                          initial={{ opacity: 0, y: 20 }}
                          key={i}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="absolute -left-[9px] top-1.5 flex items-center justify-center w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-125 transition-transform" />

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-slate-500 font-bold uppercase tracking-widest w-fit">
                              {change.version} • {change.date}
                            </span>
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-xs font-medium w-fit ${change.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>
                                {change.type === "feature"
                                  ? "Nouveauté"
                                  : "Amélioration"}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-4">
                            {change.title}
                          </h3>

                          <div className="prose prose-sm max-w-none text-slate-600 prose-headings:text-slate-800 prose-a:text-purple-600 prose-strong:text-slate-800 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-purple-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:not-italic prose-blockquote:text-slate-600">
                            <Markdown>{change.description}</Markdown>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-black/10 flex justify-end">
                <a
                  className={`inline-flex items-center gap-1 text-${projectColor}-600 hover:text-${projectColor}-800 text-sm font-medium`}
                  href={`https://github.com/${projectRepo}/releases`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Voir toutes les releases
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* mSearch Changelog */}
        {(!filterProject || filterProject === "msearch") && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-blue-600">mSearch</span> Changelog
            </h2>
            <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="prose max-w-none text-slate-600 prose-headings:text-slate-800 prose-a:text-blue-600 prose-strong:text-slate-800 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-blue-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:not-italic prose-blockquote:text-slate-600">
                {changelogs?.mSearchRaw ? (
                  <Markdown components={markdownComponents(true)}>
                    {cleanMarkdown(changelogs.mSearchRaw)}
                  </Markdown>
                ) : (
                  <div className="space-y-10 md:space-y-8 flex-1">
                    {changelogs?.mSearch?.map((change, i) => {
                      const Icon = iconMap[change.icon as string] || Star;
                      return (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className="border-l-2 border-slate-200 pl-4 md:pl-6 py-2 relative group"
                          initial={{ opacity: 0, y: 20 }}
                          key={i}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="absolute -left-[9px] top-1.5 flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform" />

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-slate-500 font-bold uppercase tracking-widest w-fit">
                              {change.version} • {change.date}
                            </span>
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-xs font-medium w-fit ${change.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>
                                {change.type === "feature"
                                  ? "Nouveauté"
                                  : "Amélioration"}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-4">
                            {change.title}
                          </h3>

                          <div className="prose prose-sm max-w-none text-slate-600 prose-headings:text-slate-800 prose-a:text-blue-600 prose-strong:text-slate-800 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-blue-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:not-italic prose-blockquote:text-slate-600">
                            <Markdown>{change.description}</Markdown>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-black/10 flex justify-end">
                <a
                  className={
                    "inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  }
                  href={`https://github.com/${projectRepo}/releases`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Voir toutes les releases
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
