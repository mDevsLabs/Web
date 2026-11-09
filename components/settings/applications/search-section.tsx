"use client";

import { SearchIcon } from "@mdevs/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SourceIcon } from "@/components/search/source-icon";
import { useAutosaveSection } from "@/hooks/use-autosave-section";
import {
  MAI_SEARCH_LANGUAGE_LABELS,
  MAI_SEARCH_LANGUAGES,
  MAI_SEARCH_RESULT_COUNT_DEFAULT,
  MAI_SEARCH_RESULT_COUNT_MAX,
  MAI_SEARCH_RESULT_COUNT_MIN,
  MAI_SEARCH_SAFETY_LABELS,
  MAI_SEARCH_SAFETY_LEVELS,
  MAI_SEARCH_SOURCE_DESCRIPTIONS,
  MAI_SEARCH_SOURCE_KEYS,
  MAI_SEARCH_SOURCE_LABELS,
  type MaiSearchLanguage,
  type MaiSearchSafetyLevel,
  type MaiSearchSourceKey,
} from "@/lib/search/sources";
import { cn } from "@/lib/utils";

type SearchSettingsSectionProps = {
  userPrefData?: {
    searchLanguage?: MaiSearchLanguage;
    searchResultCount?: number;
    searchSafetyLevel?: MaiSearchSafetyLevel;
    searchSources?: MaiSearchSourceKey[];
  } | null;
  mutateUserPref: () => Promise<unknown>;
  searchResultsMax: number;
};

export function SearchSettingsSection({
  userPrefData,
  mutateUserPref,
  searchResultsMax,
}: SearchSettingsSectionProps) {
  const [searchLanguage, setSearchLanguage] = useState<MaiSearchLanguage>("fr");
  const [searchResultCount, setSearchResultCount] = useState<number>(
    MAI_SEARCH_RESULT_COUNT_DEFAULT
  );
  const [searchSafetyLevel, setSearchSafetyLevel] =
    useState<MaiSearchSafetyLevel>("medium");
  const [searchSources, setSearchSources] = useState<MaiSearchSourceKey[]>([
    ...MAI_SEARCH_SOURCE_KEYS,
  ]);

  useEffect(() => {
    if (!userPrefData) return;
    if (userPrefData.searchLanguage) {
      setSearchLanguage(userPrefData.searchLanguage);
    }
    if (typeof userPrefData.searchResultCount === "number") {
      setSearchResultCount(
        Math.min(userPrefData.searchResultCount, searchResultsMax)
      );
    }
    if (userPrefData.searchSafetyLevel) {
      setSearchSafetyLevel(userPrefData.searchSafetyLevel);
    }
    if (Array.isArray(userPrefData.searchSources)) {
      setSearchSources(userPrefData.searchSources);
    }
  }, [searchResultsMax, userPrefData]);

  const instantaneRecherche = useMemo(
    () => ({
      searchLanguage,
      searchResultCount: Math.min(searchResultCount, searchResultsMax),
      searchSafetyLevel,
      searchSources,
    }),
    [
      searchLanguage,
      searchResultCount,
      searchResultsMax,
      searchSafetyLevel,
      searchSources,
    ]
  );

  const appliquerRecherche = useCallback((etat: typeof instantaneRecherche) => {
    setSearchLanguage(etat.searchLanguage);
    setSearchResultCount(etat.searchResultCount);
    setSearchSafetyLevel(etat.searchSafetyLevel);
    setSearchSources(etat.searchSources);
  }, []);

  useAutosaveSection({
    apply: appliquerRecherche,
    enabled: Boolean(userPrefData),
    errorMessage: "Impossible d'enregistrer les paramètres de recherche.",
    successMessage: "Paramètres de recherche enregistrés",
    values: instantaneRecherche,
    write: async (etat) => {
      const reponse = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          searchLanguage: etat.searchLanguage,
          searchResultCount: etat.searchResultCount,
          searchSafetyLevel: etat.searchSafetyLevel,
          searchSources: etat.searchSources,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!reponse.ok) {
        throw new Error("Erreur lors de l'enregistrement des préférences.");
      }
      await mutateUserPref();
    },
  });

  const toggleSearchSource = (source: MaiSearchSourceKey) => {
    setSearchSources((actuelles) => {
      const restantes = actuelles.filter((item) => item !== source);
      if (restantes.length === 0) return actuelles;
      return actuelles.includes(source) ? restantes : [...actuelles, source];
    });
  };

  return (
    <section
      className="flex flex-col gap-6 scroll-mt-24 pt-4 border-t border-border/50"
      id="search"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SearchIcon className="size-4" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Recherche &amp; mAI Search
            </h3>
            <p className="text-xs text-muted-foreground">
              Langue, volume de résultats, sources interrogées et filtre de
              sécurité
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Chaque réglage est enregistré dès que vous le modifiez.
        </p>
      </div>

      <div className="surface-card flex flex-col gap-4 p-5 scroll-mt-24">
        <p className="text-xs text-muted-foreground">
          Ces réglages s'appliquent à toutes vos recherches mAI Search, depuis
          la page de recherche comme depuis les outils d'IA. Le serveur les
          applique: une recherche ne peut pas les contourner.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              htmlFor="search-language"
            >
              Langue
            </label>
            <select
              className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
              id="search-language"
              onChange={(e) =>
                setSearchLanguage(e.target.value as MaiSearchLanguage)
              }
              value={searchLanguage}
            >
              {MAI_SEARCH_LANGUAGES.map((langue) => (
                <option key={langue} value={langue}>
                  {MAI_SEARCH_LANGUAGE_LABELS[langue]}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-muted-foreground">
              Langue de l'encyclopédie et des recherches.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                htmlFor="search-count"
              >
                Résultats par recherche
              </label>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {searchResultCount}
              </span>
            </div>
            <input
              aria-label="Résultats par recherche"
              className="w-full accent-primary"
              id="search-count"
              max={searchResultsMax}
              min={MAI_SEARCH_RESULT_COUNT_MIN}
              onChange={(e) =>
                setSearchResultCount(
                  Math.min(
                    searchResultsMax,
                    Number.parseInt(e.target.value, 10) ||
                      MAI_SEARCH_RESULT_COUNT_MIN
                  )
                )
              }
              step={1}
              type="range"
              value={Math.min(
                searchResultCount,
                searchResultsMax,
                MAI_SEARCH_RESULT_COUNT_MAX
              )}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {[10, 25, 50, 100, 200]
                .filter((nombre) => nombre <= searchResultsMax)
                .map((nombre) => (
                  <button
                    className={cn(
                      "chip text-[11px] px-2 py-0.5",
                      searchResultCount === nombre &&
                        "bg-foreground text-background font-medium"
                    )}
                    data-active={
                      searchResultCount === nombre ? "true" : undefined
                    }
                    key={nombre}
                    onClick={() => setSearchResultCount(nombre)}
                    type="button"
                  >
                    {nombre}
                  </button>
                ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Volume maximal renvoyé par le moteur, PAR SOURCE. Votre forfait
              {` ${searchResultsMax}`} résultats au maximum.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              htmlFor="search-safety"
            >
              Filtre de sécurité
            </label>
            <select
              className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
              id="search-safety"
              onChange={(e) =>
                setSearchSafetyLevel(e.target.value as MaiSearchSafetyLevel)
              }
              value={searchSafetyLevel}
            >
              {MAI_SEARCH_SAFETY_LEVELS.map((niveau) => (
                <option key={niveau} value={niveau}>
                  {MAI_SEARCH_SAFETY_LABELS[niveau]}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-muted-foreground">
              Retire les résultats manifestement sensibles.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Sources interrogées
          </span>
          <div className="flex flex-wrap gap-2">
            {MAI_SEARCH_SOURCE_KEYS.map((source) => {
              const active = searchSources.includes(source);
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "chip flex items-center gap-1.5 text-xs cursor-pointer",
                    active
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-active={active ? "true" : undefined}
                  key={source}
                  onClick={() => toggleSearchSource(source)}
                  title={MAI_SEARCH_SOURCE_DESCRIPTIONS[source]}
                  type="button"
                >
                  <SourceIcon className="size-3.5" source={source} />
                  <span>{MAI_SEARCH_SOURCE_LABELS[source]}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {
              MAI_SEARCH_SOURCE_DESCRIPTIONS[
                searchSources.includes("wikipedia") ? "wikipedia" : "web"
              ]
            }
          </p>
        </div>
      </div>
    </section>
  );
}
