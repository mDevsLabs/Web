// AUTO-GÉNÉRÉ par `scripts/gen-plugin-catalog.ts` — ne pas éditer à la main.
// Safe côté client : n'importe que des manifestes JSON (aucun outil IA).
import airQualityPluginManifest from "./air-quality/index.json";
import crossrefPluginManifest from "./crossref/index.json";
import eurostatPluginManifest from "./eurostat/index.json";
import frHolidaysPluginManifest from "./fr-holidays/index.json";
import githubPublicPluginManifest from "./github-public/index.json";
import gitlabPublicPluginManifest from "./gitlab-public/index.json";
import jsonToolboxPluginManifest from "./json-toolbox/index.json";
import mobiliteFrPluginManifest from "./mobilite-fr/index.json";
import openFoodFactsPluginManifest from "./open-food-facts/index.json";
import openLibraryPluginManifest from "./open-library/index.json";
import openalexPluginManifest from "./openalex/index.json";
import quizzlyPluginManifest from "./quizzly/index.json";
import tvmazePluginManifest from "./tvmaze/index.json";
import weatherPluginManifest from "./weather/index.json";
import wikidataPluginManifest from "./wikidata/index.json";
import worldBankPluginManifest from "./world-bank/index.json";
import rootCatalog from "./index.json";
import type { PluginCategory, PluginManifest } from "./types";

export const PLUGIN_CATEGORIES = rootCatalog.categories as PluginCategory[];

export const PLUGIN_MANIFESTS = [
  airQualityPluginManifest,
  crossrefPluginManifest,
  eurostatPluginManifest,
  frHolidaysPluginManifest,
  githubPublicPluginManifest,
  gitlabPublicPluginManifest,
  jsonToolboxPluginManifest,
  mobiliteFrPluginManifest,
  openFoodFactsPluginManifest,
  openLibraryPluginManifest,
  openalexPluginManifest,
  quizzlyPluginManifest,
  tvmazePluginManifest,
  weatherPluginManifest,
  wikidataPluginManifest,
  worldBankPluginManifest,
] as unknown as PluginManifest[];

export const PLUGIN_CATALOG_VERSION = rootCatalog.catalogVersion;
