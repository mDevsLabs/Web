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
export interface Wakie {
  createdAt: number;
  id: string;
  instructions: string;
  learningContainerId?: string | null;
  memoryAllowed: boolean;
  name: string;
  researchAllowed: boolean;
  skillDeliveryEnabled?: boolean;
  /** Default destination for saved pages, not ownership. */
  spaceId: string;
  spaceIds: string[];
}
export interface Conversation {
  createdAt: number;
  id: string;
  /** Frozen at creation; null means this conversation does not participate. */
  learningContainerId?: string | null;
  ownerId: string;
  title: string;
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
