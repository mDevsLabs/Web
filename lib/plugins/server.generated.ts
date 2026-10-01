// AUTO-GÉNÉRÉ par `scripts/gen-plugin-catalog.ts` — ne pas éditer à la main.
// Réservé au serveur : importe les implémentations d'outils (ai, zod).
import "server-only";
import { airQualityPlugin } from "./air-quality";
import { crossrefPlugin } from "./crossref";
import { eurostatPlugin } from "./eurostat";
import { frHolidaysPlugin } from "./fr-holidays";
import { githubPublicPlugin } from "./github-public";
import { gitlabPublicPlugin } from "./gitlab-public";
import { jsonToolboxPlugin } from "./json-toolbox";
import { mobiliteFrPlugin } from "./mobilite-fr";
import { openFoodFactsPlugin } from "./open-food-facts";
import { openLibraryPlugin } from "./open-library";
import { openalexPlugin } from "./openalex";
import { quizzlyPlugin } from "./quizzly";
import { tvmazePlugin } from "./tvmaze";
import { weatherPlugin } from "./weather";
import { wikidataPlugin } from "./wikidata";
import { worldBankPlugin } from "./world-bank";
import type { PluginDefinition } from "./types";

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  airQualityPlugin,
  crossrefPlugin,
  eurostatPlugin,
  frHolidaysPlugin,
  githubPublicPlugin,
  gitlabPublicPlugin,
  jsonToolboxPlugin,
  mobiliteFrPlugin,
  openFoodFactsPlugin,
  openLibraryPlugin,
  openalexPlugin,
  quizzlyPlugin,
  tvmazePlugin,
  weatherPlugin,
  wikidataPlugin,
  worldBankPlugin,
];
