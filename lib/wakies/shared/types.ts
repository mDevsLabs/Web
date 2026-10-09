export type Status =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";
export interface Settings {
  memoryAllowed: boolean;
  name: string;
  /**
   * Configuration de départ ACHEVÉE. `false` = le compte vient de recevoir son
   * espace de départ et doit passer par l'assistant. Jamais lu pour décider
   * d'un accès : c'est un repère de parcours, pas une autorisation.
   */
  onboardingCompleted: boolean;
  paused: boolean;
  researchAllowed: boolean;
}
export interface Task {
  createdAt: number;
  error: string | null;
  id: string;
  intervalSeconds: number | null;
  lease: string | null;
  leaseUntil: number | null;
  nextRunAt: number | null;
  prompt: string;
  status: Status;
  updatedAt: number;
}
export interface Source {
  excerpt: string;
  title: string;
  url: string;
}
export interface Result {
  sample: boolean;
  screenshot?: string;
  sources: Source[];
  text: string;
}
export interface Run {
  error: string | null;
  finishedAt: number | null;
  id: string;
  result: Result | null;
  startedAt: number;
  status: string;
  taskId: string;
}
export interface TaskEvent {
  createdAt: number;
  id: number;
  runId: string | null;
  taskId: string;
  text: string;
}
export interface Memory {
  createdAt: number;
  id: string;
  text: string;
}
export interface Detail {
  events: TaskEvent[];
  runs: Run[];
  task: Task;
}
export interface State {
  configured: boolean;
  memories: Memory[];
  mode: "sample" | "live";
  settings: Settings;
  tasks: Task[];
}
export type Action = "run" | "pause" | "cancel";
export interface Space {
  createdAt: number;
  description: string;
  id: string;
  name: string;
}
/**
 * Sélection d'outils d'un Wakie ou d'une conversation.
 *
 * `null` et `[]` ne veulent PAS dire la même chose, et c'est délibéré :
 *
 *   - sur un **Wakie**, `null` = aucun réglage, donc on sert ce qui est livré
 *     par défaut ;
 *   - sur une **conversation**, `null` = repli sur le réglage du Wakie, tandis
 *     que `[]` = choix explicite de ne rien utiliser.
 *
 * C'est cette distinction qui permet à un réglage de Wakie de servir de
 * défaut sans jamais écraser une conversation qui a décidé autrement. Elle
 * est aussi ce qui interdit de traiter une sélection absente comme « tous les
 * outils du compte ».
 */
export interface CapabilitySelection {
  /** Serveurs MCP autorisés (`McpServer.id`). */
  mcpServerIds?: string[] | null;
  /** Plugins autorisés (`PluginInstallation.pluginId`). */
  pluginIds?: string[] | null;
  /** Skills autorisés (`Skill.id`). */
  skillIds?: string[] | null;
  /** Paramètres des Skills, indexés PAR SKILL : deux Skills peuvent déclarer
   * le même nom de paramètre sans que leurs valeurs se confondent. */
  skillParams?: Record<string, Record<string, string>> | null;
  /** Outils de `lib/ai/tools` autorisés (`TOOL_IDS`). */
  toolIds?: string[] | null;
}

export interface Wakie extends CapabilitySelection {
  /** Mascotte choisie (`/wakies/<avatar>.png`) ; null = déduite de l'id. */
  avatar?: string | null;
  createdAt: number;
  id: string;
  instructions: string;
  learningContainerId?: string | null;
  memoryAllowed: boolean;
  /** Modèle IA par défaut des nouvelles conversations ; null = défaut mAI. */
  model?: string | null;
  name: string;
  researchAllowed: boolean;
  skillDeliveryEnabled?: boolean;
  /** Default destination for saved pages, not ownership. */
  spaceId: string;
  spaceIds: string[];
}

export interface Conversation extends CapabilitySelection {
  createdAt: number;
  id: string;
  /** Frozen at creation; null means this conversation does not participate. */
  learningContainerId?: string | null;
  /** Modèle IA de cette conversation ; null = modèle du Wakie, puis défaut. */
  model?: string | null;
  /** Envoyée par le serveur mais retirée du contrat : `userId` est supprimé
   * par `versClient`. Conservée pour ne pas casser les lectures existantes. */
  ownerId: string;
  title: string;
  /** Mis à jour à chaque message ; absent du contrat historique. */
  updatedAt?: number;
  wakieId: string;
}
export interface CallReceipt {
  anchorMessageId?: string | null;
  conversationId: string;
  endedAt: number | null;
  error: string | null;
  id: string;
  startedAt: number;
  status: "connecting" | "active" | "ended" | "failed";
  transcript: string;
}
export interface SetupStatus {
  browser: boolean;
  /** Ordinateurs persistants (OpenBot) : non branchés. Présent sur le réseau
   * mais absent du contrat historique — voir `lib/wakies/setup.ts`. */
  computers?: boolean;
  intelligence: boolean;
  missing: string[];
  model: boolean;
  slack: string;
  voice: boolean;
}
export interface WorkspaceState {
  calls: CallReceipt[];
  conversations: Conversation[];
  setup: SetupStatus;
  spaces: Space[];
  wakies: Wakie[];
}
