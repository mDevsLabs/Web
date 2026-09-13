import type { Tool, UIMessageStreamWriter } from "ai";
import type { ChatMessage } from "@/lib/types";

// Icône d'un plugin : soit une icône de la dépendance lucide-react, soit une
// image locale (chemin dans /public) ou distante (URL https).
export type PluginIconRef =
  | { type: "lucide"; name: string }
  | { type: "image"; src: string };

export type PluginCategory = {
  id: string;
  label: string;
  icon: string;
};

// Partie « outil IA » du manifeste : identifiant d'outil (clé utilisée par le
// SDK AI et par les mentions @) et hint injecté dans le prompt système.
export type PluginToolManifest = {
  id: string;
  label: string;
  systemHint: string;
};

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  icon: PluginIconRef;
  minTier: "free" | "plus" | "pro" | "max";
  tool: PluginToolManifest;
};

// Dépendances injectées pour les plugins qui en ont besoin (stream de données,
// session authentifiée, modèle courant). Toutes optionnelles : un plugin
// purement fonctionnel (météo, quiz) les ignore, et certains contextes
// d'exécution (planification) n'ont pas de stream UI.
export type PluginToolDeps = {
  chatModel?: string;
  dataStream?: UIMessageStreamWriter<ChatMessage>;
  isGhostMode?: boolean;
  session?: unknown;
};

export type PluginDefinition = {
  manifest: PluginManifest;
  createTool: (deps: PluginToolDeps) => Tool;
};

// Vue client : manifeste + état d'installation pour l'utilisateur courant.
export type PluginCatalogEntry = PluginManifest & {
  installed: boolean;
  enabled: boolean;
  installedVersion: string | null;
  updateAvailable: boolean;
};
