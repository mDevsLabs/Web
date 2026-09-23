// AUTO-GÉNÉRÉ par `scripts/gen-plugin-catalog.ts` — ne pas éditer à la main.
// Réservé au serveur : importe les implémentations d'outils (ai, zod).
import "server-only";
import { airQualityPlugin } from "./air-quality";
import { crossrefPlugin } from "./crossref";
import { frHolidaysPlugin } from "./fr-holidays";
import { githubPublicPlugin } from "./github-public";
import { jsonToolboxPlugin } from "./json-toolbox";
import { openFoodFactsPlugin } from "./open-food-facts";
import { openLibraryPlugin } from "./open-library";
import { quizzlyPlugin } from "./quizzly";
import { tvmazePlugin } from "./tvmaze";
import { weatherPlugin } from "./weather";
import { worldBankPlugin } from "./world-bank";
import type { PluginDefinition } from "./types";

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  airQualityPlugin,
  crossrefPlugin,
  frHolidaysPlugin,
  githubPublicPlugin,
  jsonToolboxPlugin,
  openFoodFactsPlugin,
  openLibraryPlugin,
  quizzlyPlugin,
  tvmazePlugin,
  weatherPlugin,
  worldBankPlugin,
];
