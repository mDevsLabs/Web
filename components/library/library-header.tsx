import React from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  CloudUploadIcon,
  FolderIcon,
  LayoutGridIcon,
  LibraryIcon,
  ListFilterIcon,
  ListIcon,
  Loader2Icon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "@mdevs/icons";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { APP_PRICING_URL } from "@/lib/constants";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  cnSortItem,
  EXTRA_CATEGORY_OPTIONS,
  type ExtraCategory,
  formatBytes,
  type LibraryTab,
  PERIOD_LABELS,
  type Period,
  SORT_LABELS,
  type SortKey,
  type StorageUsage,
  TABS,
} from "./library-types";

export function LibraryHeader({
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  onImportFilesClick,
  onImportFolderClick,
  extraCategory,
  setExtraCategory,
  period,
  setPeriod,
  hasAdvancedFilters,
  resetAdvancedFilters,
  storage,
  activeTab,
  setActiveTab,
  isUploading,
  uploadingFilesCount,
}: {
  sortBy: SortKey;
  setSortBy: (k: SortKey) => void;
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onImportFilesClick: () => void;
  onImportFolderClick: () => void;
  extraCategory: ExtraCategory;
  setExtraCategory: (c: ExtraCategory) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  hasAdvancedFilters: boolean;
  resetAdvancedFilters: () => void;
  storage: StorageUsage | null;
  activeTab: LibraryTab;
  setActiveTab: (t: LibraryTab) => void;
  isUploading: boolean;
  uploadingFilesCount: number;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/50 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PageBackButton />
          <LibraryIcon className="size-6 shrink-0 text-foreground" />
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Bibliothèque
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tri */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Trier les fichiers"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={`Tri : ${SORT_LABELS[sortBy]}`}
                type="button"
              >
                <ListFilterIcon className="size-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem
                  className={cnSortItem(sortBy === key)}
                  key={key}
                  onClick={() => setSortBy(key)}
                >
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bascule Grille / Liste */}
          <fieldset
            aria-label="Mode d'affichage"
            className="m-0 flex items-center rounded-full border border-border bg-muted/40 p-0.5"
          >
            <button
              aria-label="Vue grille"
              aria-pressed={viewMode === "grid"}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
              title="Vue grille"
              type="button"
            >
              <LayoutGridIcon className="size-4" />
            </button>
            <button
              aria-label="Vue liste"
              aria-pressed={viewMode === "list"}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
              title="Vue liste"
              type="button"
            >
              <ListIcon className="size-4" />
            </button>
          </fieldset>

          {/* Recherche */}
          <div className="relative w-full min-w-44 sm:w-64">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Chercher dans la bibliothèque"
              className="h-10 rounded-full border-border/60 bg-card pl-10 pr-3 text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher dans Bibliothèque"
              type="text"
              value={searchQuery}
            />
          </div>

          {/* Nouveau : import fichiers ou dossier entier */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-95"
                type="button"
              >
                Nouveau
                <ChevronDownIcon className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={onImportFilesClick}
              >
                <CloudUploadIcon className="size-4" />
                Importer des fichiers
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={onImportFolderClick}
              >
                <FolderIcon className="size-4" />
                Importer un dossier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtres avancés : format complémentaire + période */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Filtres avancés"
                className={`relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground ${
                  hasAdvancedFilters
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                title="Filtres avancés"
                type="button"
              >
                <SlidersHorizontalIcon className="size-4.5" />
                {hasAdvancedFilters && (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Format complémentaire
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {EXTRA_CATEGORY_OPTIONS.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat];
                      return (
                        <button
                          className="chip"
                          data-active={extraCategory === cat}
                          key={cat}
                          onClick={() =>
                            setExtraCategory(
                              extraCategory === cat ? null : cat
                            )
                          }
                          type="button"
                        >
                          <Icon className="size-3" />
                          {CATEGORY_LABELS[cat]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Période
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
                      <button
                        className="chip"
                        data-active={period === key}
                        key={key}
                        onClick={() => setPeriod(key)}
                        type="button"
                      >
                        {PERIOD_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>
                {hasAdvancedFilters && (
                  <Button
                    onClick={resetAdvancedFilters}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Quota */}
      {storage && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatBytes(storage.bytes_used)} sur{" "}
            {formatBytes(storage.bytes_limit)} utilisés
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {storage.files_count ?? 0} fichier
            {(storage.files_count ?? 0) > 1 ? "s" : ""}
          </span>
          <span aria-hidden="true">·</span>
          <span>Forfait {storage.tier}</span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storage.percent_used > 90
                  ? "bg-destructive"
                  : storage.percent_used > 75
                    ? "bg-warning"
                    : "bg-foreground/70"
              }`}
              style={{
                width: `${Math.min(100, Math.max(1, storage.percent_used))}%`,
              }}
            />
          </div>
          {storage.percent_used >= 90 && (
            <span className="flex items-center gap-1 text-warning">
              <AlertCircleIcon className="size-3.5" />
              Presque plein —{" "}
              <Link
                className="font-semibold underline underline-offset-2 hover:text-foreground"
                href={APP_PRICING_URL}
              >
                mettre à niveau
              </Link>
            </span>
          )}
        </div>
      )}

      {/* Onglets simples */}
      <nav
        aria-label="Filtres de la bibliothèque"
        className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar"
      >
        {TABS.map((tab) => (
          <button
            className="chip px-3.5 py-1.5 text-xs"
            data-active={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
        {isUploading && (
          <span className="ml-2 flex items-center gap-1.5 text-[11px] text-primary">
            <Loader2Icon className="size-3 animate-spin" />
            {uploadingFilesCount} import(s) en cours
          </span>
        )}
      </nav>
    </header>
  );
}
