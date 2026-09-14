// AUTO-GÉNÉRÉ par `scripts/gen-plugin-catalog.ts` — ne pas éditer à la main.
// Safe côté client : n'importe que des manifestes JSON (aucun outil IA).
import airQualityPluginManifest from "./air-quality/index.json";
import frHolidaysPluginManifest from "./fr-holidays/index.json";
import jsonToolboxPluginManifest from "./json-toolbox/index.json";
import quizzlyPluginManifest from "./quizzly/index.json";
import weatherPluginManifest from "./weather/index.json";
import rootCatalog from "./index.json";
import type { PluginCategory, PluginManifest } from "./types";

export const PLUGIN_CATEGORIES = rootCatalog.categories as PluginCategory[];

export const PLUGIN_MANIFESTS = [
  airQualityPluginManifest,
  frHolidaysPluginManifest,
  jsonToolboxPluginManifest,
  quizzlyPluginManifest,
  weatherPluginManifest,
] as unknown as PluginManifest[];

export const PLUGIN_CATALOG_VERSION = rootCatalog.catalogVersion;
