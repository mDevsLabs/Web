"use client";

import {
  BrainIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  CpuIcon,
  FileIcon,
  FolderKanbanIcon,
  ImageIcon,
  ListChecksIcon,
  Loader2Icon,
  MessageSquareIcon,
  PuzzleIcon,
  SearchIcon,
  ServerIcon,
  SparklesIcon,
  SquarePenIcon,
  Volume2Icon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { BotGlyph } from "@/components/agents/bot-avatar";
import { PageBackButton } from "@/components/chat/page-back-button";
import { formatCompactFr } from "@/lib/account/format";
import { apiEndpoints, pagePath } from "@/lib/client/api-endpoints";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import {
  isSearchSourceKey,
  PAID_ONLY_SOURCES,
  SEARCH_SOURCE_LABELS,
  type SearchHit,
  type SearchIndexResponse,
  type SearchSourceKey,
} from "@/lib/search/types";
import { cn, fetcher } from "@/lib/utils";

// Recherche interne du compte : une page, un index, dix-sept sources.
//
// La page ne connaît plus AUCUNE source. Elle envoie des mots et un filtre, et
// l'index répond des résultats, des compteurs par source et la suite à charger.
// Toute requête `/api/skills` ou `/api/images/history` depuis ce fichier serait
// une régression de la règle : la page finirait par savoir elle-même quelles
// sources existent, et le jour où l'index en ajoute une, elle l'ignorerait.
//
// Ce qui reste côté client n'est que de la présentation : réordonner les
// groupes, replier un groupe trop long, écrire une commande dans la boîte de
// saisie. Le filtrage, lui, est fait en SQL ou dans l'amont, donc la page ne
// peut pas afficher un résultat que l'index n'a pas compté.

/** Deux caractères : en dessous, tout correspondrait. */
const MIN_QUERY_LENGTH = 2;

/** Délai avant d'interroger l'index. La frappe n'est pas une interrogation. */
const DEBOUNCE_MS = 250;

/** Résultats affichés par groupe avant repli. */
const MAX_RESULTS_PER_GROUP = 12;

/**
 * Raccourci et page de repli de chaque source.
 *
 * `href` sert deux fois : c'est le lien du résultat, et la destination de la
 * carte affichée quand rien n'est saisi. Une source sans page vers laquelle
 * mener n'aurait pas d'entrée dans cet écran — d'où l'absence de « Notifications
 * », pourtant parfaitement indexable : un résultat vers nulle part est pire
 * qu'une source absente.
 */
const SOURCES: Array<{
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: SearchSourceKey;
}> = [
  { href: pagePath("/"), icon: MessageSquareIcon, key: "chat" },
  { href: pagePath("/"), icon: MessageSquareIcon, key: "message" },
  { href: pagePath("/projects"), icon: FolderKanbanIcon, key: "project" },
  { href: pagePath("/projects"), icon: FileIcon, key: "doc" },
  {
    href: pagePath("/tools?tab=skills"),
    icon: SparklesIcon,
    key: "skill",
  },
  { href: pagePath("/"), icon: SquarePenIcon, key: "command" },
  { href: pagePath("/mcp"), icon: ServerIcon, key: "mcp" },
  { href: pagePath("/agents"), icon: BotGlyph, key: "bot" },
  { href: pagePath("/settings?tab=memory"), icon: BrainIcon, key: "memory" },
  {
    href: pagePath("/planning"),
    icon: CalendarClockIcon,
    key: "planning",
  },
  { href: pagePath("/"), icon: ListChecksIcon, key: "run" },
  { href: pagePath("/images"), icon: ImageIcon, key: "image" },
  { href: pagePath("/audio"), icon: Volume2Icon, key: "audio" },
  { href: pagePath("/settings"), icon: CpuIcon, key: "model" },
  {
    href: pagePath("/settings/statistiques"),
    icon: ListChecksIcon,
    key: "stats",
  },
  { href: pagePath("/tools?tab=plugins"), icon: PuzzleIcon, key: "plugin" },
  { href: pagePath("/library"), icon: FileIcon, key: "file" },
];

/**
 * Ordre d'affichage des groupes, dérivé de `SOURCES`.
 *
 * Le serveur ne connaît pas cet ordre : à lui de savoir ce qu'est une source,
 * pas ce qui intéresse d'abord. La page décide donc de l'ordre, et le serveur
 * se contente de répondre.
 */
const SOURCE_ORDER = SOURCES.map((entry) => entry.key);

const ICONS = new Map(SOURCES.map((entry) => [entry.key, entry.icon]));

type Group = {
  hits: SearchHit[];
  icon: React.ComponentType<{ className?: string }>;
  key: SearchSourceKey;
  label: string;
  total: number;
};

function formatDateFr(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

function ResultRow({ hit }: { hit: SearchHit }) {
  const className =
    "flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/50";

  const body = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {renderIcon(hit.source)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {hit.title}
        </span>
        {hit.subtitle ? (
          <span className="truncate text-xs text-muted-foreground">
            {hit.subtitle}
          </span>
        ) : null}
      </span>
      {hit.meta ? (
        <span className="shrink-0 text-[11px] whitespace-nowrap text-muted-foreground">
          {formatMeta(hit)}
        </span>
      ) : null}
    </>
  );

  // Une commande enregistrée ne se visite pas : elle s'emploie. On écrit le
  // déclencheur dans la boîte de saisie du Chat, et l'utilisateur valide —
  // RIEN n'est envoyé tout seul.
  const onPick = () => {
    if (!hit.pendingPrompt) {
      return;
    }
    try {
      sessionStorage.setItem(
        MAI_PENDING_ATTACHMENT_KEY,
        JSON.stringify({ prompt: hit.pendingPrompt })
      );
    } catch {
      // Session sans stockage (navigation privée stricte) : on navigue quand
      // même, l'utilisateur tapera la commande lui-même. Ne pas laisser un
      // échec de stockage rendre le bouton inerte.
    }
  };

  if (hit.external) {
    return (
      <a
        className={className}
        href={hit.href}
        onClick={onPick}
        rel="noreferrer"
        target="_blank"
      >
        {body}
      </a>
    );
  }

  return (
    <Link className={className} href={pagePath(hit.href)} onClick={onPick}>
      {body}
    </Link>
  );
}

/** Les métriques d'un résultat ne sont pas toutes des dates. */
function formatMeta(hit: SearchHit): string {
  if (hit.source === "stats" && hit.meta) {
    return hit.meta;
  }
  if (hit.source === "file" && hit.meta) {
    return hit.meta.split("/")[1] ?? "";
  }
  return formatDateFr(hit.meta) || (hit.meta ?? "");
}

function renderIcon(source: SearchSourceKey) {
  const Icon = ICONS.get(source) ?? SearchIcon;
  return <Icon className="size-4" />;
}

function ResultGroup({ group }: { group: Group }) {
  const Icon = group.icon;
  const [expanded, setExpanded] = useState(false);
  const overflows = group.hits.length > MAX_RESULTS_PER_GROUP;
  const shown = expanded
    ? group.hits
    : group.hits.slice(0, MAX_RESULTS_PER_GROUP);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {group.label}
        <span className="font-normal tracking-normal normal-case">
          ({group.total})
        </span>
      </h2>
      <div className="flex flex-col gap-1.5">
        {shown.map((hit) => (
          <ResultRow hit={hit} key={`${hit.source}-${hit.id}`} />
        ))}
      </div>
      {overflows ? (
        <button
          className="chip self-start"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? "Réduire" : `Voir les ${group.hits.length} résultats`}
          {expanded ? null : (
            <ChevronDownIcon className="size-3 transition-transform" />
          )}
        </button>
      ) : null}
    </section>
  );
}

export function GlobalSearchClient({ isPaid }: { isPaid: boolean }) {
  const [rawQuery, setRawQuery] = useState("");
  const [scope, setScope] = useState<SearchSourceKey | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // La frappe est différée : chaque frappe déclencherait sinon seize requêtes.
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(rawQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const searchable = query.length >= MIN_QUERY_LENGTH;

  // `/` place le curseur dans le champ, sauf si l'utilisateur écrit déjà
  // ailleurs : sans cette garde, sa frappe dans le compositeur de message serait
  // détournée une fois sur deux.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;
      if (isTyping) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleSources = SOURCES.filter(
    (entry) => isPaid || !PAID_ONLY_SOURCES.includes(entry.key)
  );

  const getKey = (pageIndex: number, previous: SearchIndexResponse | null) => {
    if (!searchable) {
      return null;
    }
    // `nextOffset` est la SEULE autorité sur la fin de liste : recompter les
    // groupes du client donnerait un résultat différent de celui de l'index.
    if (pageIndex > 0 && !previous?.nextOffset) {
      return null;
    }
    return apiEndpoints.searchIndex({
      limit: MAX_RESULTS_PER_GROUP,
      offset: pageIndex * MAX_RESULTS_PER_GROUP,
      query,
      sources: scope === "all" ? [] : [scope],
    });
  };

  const { data, error, isLoading, isValidating, setSize, size } =
    useSWRInfinite<SearchIndexResponse>(getKey, fetcher, {
      keepPreviousData: true,
      revalidateOnFocus: false,
    });

  const pages = data ?? [];
  const first = pages[0];
  const hits = pages.flatMap((page) => page?.hits ?? []);
  const nextOffset = first?.nextOffset ?? null;
  const failed = first?.failed ?? [];
  const counts = first?.counts ?? {};
  const total = first?.total ?? 0;

  // Changer de requête ou de filtre repart de la première page. Sans cela, la
  // taille mémorisée de la précédente serait appliquée à la nouvelle : on
  // demanderait les pages 2..N d'une recherche qui n'a pas encore eu lieu.
  //
  // La comparaison se fait sur une chaîne des deux valeurs, et l'effet ne
  // dépend QUE de cette chaîne : `setSize` est stable, et dépendre de `query`
  // et `scope` séparément ferait comparer des valeurs déjà comparées.
  const pageKey = `${scope}::${query}`;
  const [lastPageKey, setLastPageKey] = useState(pageKey);
  useEffect(() => {
    if (lastPageKey !== pageKey) {
      setLastPageKey(pageKey);
      setSize(1);
    }
  }, [lastPageKey, pageKey, setSize]);

  /**
   * Les compteurs des pastilles ne concernent que les sources INTERROGÉES.
   *
   * Avec le filtre « Tout », la réponse contient les dix-sept compteurs, donc
   * une pastille sans compte vaut zéro. Mais quand une source est filtrée, la
   * réponse n'en porte qu'un : sans cette règle, les seize autres pastilles
   * s'afficheraient « 0 » alors qu'elles n'ont pas été consultées — un zéro
   * affirmatif pour une ignorance.
   */
  const countFor = useCallback(
    (key: SearchSourceKey): number | undefined => {
      if (!searchable || scope === "all") {
        return counts[key];
      }
      return key === scope ? counts[key] : undefined;
    },
    [counts, scope, searchable]
  );

  const groups = useMemo<Group[]>(() => {
    const bySource = new Map<SearchSourceKey, SearchHit[]>();
    for (const hit of hits) {
      const bucket = bySource.get(hit.source);
      if (bucket) {
        bucket.push(hit);
      } else {
        bySource.set(hit.source, [hit]);
      }
    }

    return SOURCE_ORDER.flatMap((key) => {
      const bucket = bySource.get(key);
      if (!bucket || bucket.length === 0) {
        return [];
      }
      return [
        {
          hits: bucket,
          icon: ICONS.get(key) ?? SearchIcon,
          key,
          label: SEARCH_SOURCE_LABELS[key],
          // Le compteur de l'index, et non la taille du groupe : celui-ci est
          // borné par la page, celui-là compte tout ce que la source a trouvé.
          total: countFor(key) ?? bucket.length,
        },
      ];
    });
  }, [countFor, hits]);

  const isFirstLoad = isLoading && hits.length === 0;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl p-4 pb-16 sm:p-6 md:p-10">
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-start gap-3">
            <PageBackButton />
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                <SearchIcon className="size-4" />
                Recherche interne
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Rechercher dans tout le compte
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {SOURCES.length} sources : discussions, messages, projets,
                fichiers, Skills, commandes, serveurs MCP, bots, mémoire,
                planification, étapes d'agent, images, audio, modèles et
                statistiques.
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Rechercher dans mon compte"
              className="field-input h-11 pl-9"
              onChange={(event) => setRawQuery(event.target.value)}
              placeholder="Un mot-clé, un modèle, une skill, un souvenir…"
              ref={inputRef}
              type="search"
              value={rawQuery}
            />
            {isValidating ? (
              <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              aria-pressed={scope === "all"}
              className="chip"
              data-active={scope === "all"}
              onClick={() => setScope("all")}
              type="button"
            >
              Tout
              {searchable && total > 0 ? ` (${total})` : ""}
            </button>
            {visibleSources.map((entry) => {
              const count = countFor(entry.key);
              return (
                <button
                  aria-pressed={scope === entry.key}
                  className="chip"
                  data-active={scope === entry.key}
                  key={entry.key}
                  onClick={() => setScope(entry.key)}
                  type="button"
                >
                  <entry.icon className="size-3" />
                  {SEARCH_SOURCE_LABELS[entry.key]}
                  {count === undefined ? null : count > 0 ? (
                    <span className="text-muted-foreground">
                      {formatCompactFr(count)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6 py-6">
          {failed.length > 0 ? (
            <p className="surface-muted text-xs text-muted-foreground">
              Source{failed.length > 1 ? "s" : ""} indisponible
              {failed.length > 1 ? "s" : ""} :{" "}
              {failed.map((key) => SEARCH_SOURCE_LABELS[key]).join(", ")}. Les
              résultats ci-dessous ne couvrent que les sources qui ont répondu.
            </p>
          ) : null}

          {searchable ? (
            isFirstLoad ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                <Loader2Icon className="size-6 animate-spin text-primary" />
                <span className="text-sm">Recherche en cours…</span>
              </div>
            ) : error ? (
              <div className="surface-muted flex flex-col items-center gap-2 text-center">
                <SearchIcon className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Recherche indisponible
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {isSearchSourceKey(scope)
                    ? "Cette source n'a pas répondu. Réessayez dans un instant."
                    : "Réessayez dans un instant."}
                </p>
              </div>
            ) : groups.length === 0 ? (
              <div className="surface-muted flex flex-col items-center gap-2 text-center">
                <SearchIcon className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucun résultat pour « {query} »
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Élargissez la recherche à « Tout », ou essayez un terme plus
                  court.
                </p>
              </div>
            ) : (
              <>
                {groups.map((group) => (
                  // La clé porte la requête ET le filtre : changer l'un des deux
                  // doit repartir d'une vue compacte, pas hériter du dépliage.
                  <ResultGroup
                    group={group}
                    key={`${query}-${scope}-${group.key}`}
                  />
                ))}
                {nextOffset === null ? (
                  <p className="text-center text-[11px] text-muted-foreground">
                    {hits.length} résultat{hits.length > 1 ? "s" : ""} affiché
                    {hits.length > 1 ? "s" : ""} sur {total}.
                  </p>
                ) : (
                  <button
                    className="chip self-center"
                    disabled={isValidating}
                    onClick={() => setSize(size + 1)}
                    type="button"
                  >
                    {isValidating ? "Chargement…" : "Charger plus"}
                  </button>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {rawQuery.length > 0
                  ? `Encore ${MIN_QUERY_LENGTH - rawQuery.length} caractère${MIN_QUERY_LENGTH - rawQuery.length > 1 ? "s" : ""} avant de lancer la recherche.`
                  : "Saisissez au moins deux caractères, ou ouvrez un domaine ci-dessous."}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSources.map((entry) => (
                  <Link
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-3 transition-colors hover:bg-muted/50"
                    href={entry.href}
                    key={entry.key}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <entry.icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {SEARCH_SOURCE_LABELS[entry.key]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
