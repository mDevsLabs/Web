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
  description: string;
  /**
   * Effet de CET outil. La garde de canal se prend par outil, jamais par plugin.
   */
  effect?: "read" | "write";
  id: string;
  label: string;
  systemHint: string;
};

// Permissions déclarées par un plugin : explicites, vérifiées par
// `scripts/validate-plugins.ts` et rappelées telles quelles à l'utilisateur.
// Un plugin qui écrit des données utilisateur DOIT exiger une approbation.
export type PluginSecretKind = "env" | "auth" | "header";

export type PluginSecretResolver = (request: {
  key: string;
  kind: PluginSecretKind;
}) => Promise<string | undefined>;

export type PluginPermissions = {
  /** Accès réseau : aucun, lecture seule ou écriture explicitement déclarée. */
  network: "none" | "read-only" | "read-write";
  /** Le plugin lit des données rattachées à l'utilisateur. */
  readsUserData: boolean;
  /** Le plugin écrit/modifie des données rattachées à l'utilisateur. */
  writesUserData: boolean;
  /** Approbation explicite requise avant toute exécution sensible. */
  requiresApproval: boolean;
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
  permissions: PluginPermissions;
  tools: PluginToolManifest[];
};

export type PluginToolDeps = {
  channel?: "agent" | "chat" | "planning" | "scheduler";
  chatModel?: string;
  dataStream?: UIMessageStreamWriter<ChatMessage>;
  isGhostMode?: boolean;
  session?: unknown;
  signal?: AbortSignal;
  /** Résolveur server-only, injectable pour lire les jetons du coffre. */
  secretResolver?: PluginSecretResolver;
  userId?: string;
};

export type PluginDefinition = {
  manifest: PluginManifest;
  createTools: (deps: PluginToolDeps) => Record<string, Tool>;
};

// Vue client : manifeste + état d'installation pour l'utilisateur courant.
// Tous les plugins sont accessibles dès le forfait gratuit.
export type PluginCatalogEntry = PluginManifest & {
  installed: boolean;
  enabled: boolean;
  installedVersion: string | null;
  updateAvailable: boolean;
};
