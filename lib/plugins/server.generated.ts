// AUTO-GÉNÉRÉ par `scripts/gen-plugin-catalog.ts` — ne pas éditer à la main.
// Réservé au serveur : importe les implémentations d'outils (ai, zod).
import "server-only";
import { quizzlyPlugin } from "./quizzly";
import { weatherPlugin } from "./weather";
import type { PluginDefinition } from "./types";

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  quizzlyPlugin,
  weatherPlugin,
];
