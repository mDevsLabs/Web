"use client";

import { Command } from "cmdk";
import { BarChart3Icon as BarChart3, FileTextIcon as FileText, FolderIcon as Folder, LifeBuoyIcon as LifeBuoy, Loader2Icon as Loader2, PlusCircleIcon as PlusCircle, SearchIcon as Search } from "@mdevs/icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  toSitePath,
  useSiteRouter as useRouter,
} from "@/components/site/router";
import { useSiteSearch } from "@/components/site/ui/search-bar";
import type { ChangelogsByProject } from "@/lib/site/changelog";
import type { NewsArticle } from "@/lib/site/news";
import { SEARCH_TYPE_LABELS } from "@/lib/site/search-types";

export function CommandMenu({
  open,
  setOpen,
  changelogs,
  news,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  changelogs?: ChangelogsByProject;
  news?: NewsArticle[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { results, loading } = useSiteSearch(query, "all", 12);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length >= 2;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Réinitialise la requête à la fermeture du menu.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[20vh] bg-slate-900/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/60 overflow-hidden"
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.1 }}
          >
            <Command
              className="flex flex-col w-full h-full"
              label="Menu de commandes"
              shouldFilter={false}
            >
              <div className="flex items-center px-4 border-b border-black/5 bg-white/40">
                <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                <Command.Input
                  autoFocus
                  className="w-full h-14 bg-transparent outline-none text-slate-900 placeholder:text-slate-500"
                  onValueChange={setQuery}
                  placeholder="Rechercher sur tout le site..."
                  value={query}
                />
              </div>
              <Command.List className="max-h-[400px] overflow-y-auto p-2 scroll-py-2">
                {searching ? (
                  results.length === 0 ? (
                    loading ? (
                      <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Recherche…
                      </div>
                    ) : (
                      <Command.Empty className="py-6 text-center text-sm text-slate-500">
                        Aucun résultat trouvé.
                      </Command.Empty>
                    )
                  ) : (
                    <Command.Group
                      className="text-xs font-semibold text-slate-500 px-2 py-2"
                      heading={`Résultats (${results.length})`}
                    >
                      {results.map((result) => (
                        <Command.Item
                          className="flex items-start gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors mb-0.5"
                          key={`${result.type}-${result.href}-${result.title}`}
                          onSelect={() =>
                            runCommand(() => router.push(result.href))
                          }
                          value={`${result.type}-${result.href}-${result.title}`}
                        >
                          <FileText className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <span className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate">
                              {result.title}
                            </span>
                            {result.description && (
                              <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {result.description}
                              </span>
                            )}
                          </span>
                          <span className="ml-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0 mt-0.5">
                            {SEARCH_TYPE_LABELS[result.type]}
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )
                ) : (
                  <>
                    <Command.Group
                      className="text-xs font-semibold text-slate-500 px-2 py-2"
                      heading="Projets mAI"
                    >
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/projects/web"))
                        }
                        value="projet-web"
                      >
                        <Folder className="w-4 h-4 text-purple-500" />
                        <span>Web - Application d&apos;IA en ligne</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/projects/vibe"))
                        }
                        value="projet-vibe"
                      >
                        <Folder className="w-4 h-4 text-pink-500" />
                        <span>Vibe - Réseau social avec IA intégrée</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/projects/coder"))
                        }
                        value="projet-coder"
                      >
                        <Folder className="w-4 h-4 text-purple-500" />
                        <span>Coder - IDE IA &amp; Agents MCP</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/projects/cli"))
                        }
                        value="projet-cli"
                      >
                        <Folder className="w-4 h-4 text-emerald-500" />
                        <span>CLI - Discussions &amp; Code Terminal</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/projects/pulse"))
                        }
                        value="projet-pulse"
                      >
                        <Folder className="w-4 h-4 text-indigo-500" />
                        <span>Pulse - Extensions mAI</span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group
                      className="text-xs font-semibold text-slate-500 px-2 pt-4 pb-2"
                      heading="Support & Assistance"
                    >
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/support"))
                        }
                        value="support-centre"
                      >
                        <LifeBuoy className="w-4 h-4 text-purple-600" />
                        <span>Centre de Support &amp; Assistance</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/support/new"))
                        }
                        value="support-ticket-new"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        <span>Signaler un bug / Créer un ticket</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/support/tickets"))
                        }
                        value="support-tickets"
                      >
                        <LifeBuoy className="w-4 h-4 text-blue-600" />
                        <span>Mes tickets &amp; Historique</span>
                      </Command.Item>
                      <Command.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors"
                        onSelect={() =>
                          runCommand(() => router.push("/support/stats"))
                        }
                        value="support-stats"
                      >
                        <BarChart3 className="w-4 h-4 text-amber-600" />
                        <span>Statistiques &amp; Analyse du Support</span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group
                      className="text-xs font-semibold text-slate-500 px-2 pt-4 pb-2"
                      heading="Changelog mAI"
                    >
                      {changelogs?.mAI?.map((change) => (
                        <Command.Item
                          className="flex flex-col px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors mb-1"
                          key={`mai-${change.version}`}
                          onSelect={() =>
                            runCommand(() => router.push("/changelog/mai"))
                          }
                          value={`changelog-mai-${change.version}`}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <FileText className="w-4 h-4 text-purple-500" />
                            <span>
                              {change.version} - {change.title}
                            </span>
                          </div>
                          <div className="pl-6 text-xs text-slate-500 line-clamp-1 mt-1">
                            {change.description.replace(/\n/g, " ")}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group
                      className="text-xs font-semibold text-slate-500 px-2 pt-4 pb-2"
                      heading="Changelog mSearch"
                    >
                      {changelogs?.mSearch?.map((change) => (
                        <Command.Item
                          className="flex flex-col px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors mb-1"
                          key={`msearch-${change.version}`}
                          onSelect={() =>
                            runCommand(() => router.push("/changelog/msearch"))
                          }
                          value={`changelog-msearch-${change.version}`}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>
                              {change.version} - {change.title}
                            </span>
                          </div>
                          <div className="pl-6 text-xs text-slate-500 line-clamp-1 mt-1">
                            {change.description.replace(/\n/g, " ")}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group
                      className="text-xs font-semibold text-slate-500 px-2 pt-4 pb-2"
                      heading="Actualités"
                    >
                      {news?.map((article) => (
                        <Command.Item
                          className="flex flex-col px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer aria-selected:bg-black/5 aria-selected:text-slate-900 transition-colors mb-1"
                          key={`news-${article.slug}`}
                          onSelect={() =>
                            runCommand(() =>
                              router.push(`/news/${article.slug}`)
                            )
                          }
                          value={`news-${article.slug}`}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <FileText className="w-4 h-4 text-orange-500" />
                            <span>{article.title}</span>
                          </div>
                          <div className="pl-6 text-xs text-slate-500 line-clamp-1 mt-1">
                            {article.description}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
