import { z } from "zod";
export const computerPermissionsSchema = z
  .object({
    browser: z.boolean(),
    enabled: z.boolean(),
    files: z.boolean(),
    shell: z.boolean(),
  })
  .strict();
export type ComputerPermissions = z.infer<typeof computerPermissionsSchema>;
export interface ComputerAudit {
  action: string;
  actor: "owner" | "agent";
  createdAt: number;
  id: string;
  outcome: "pending" | "succeeded" | "failed";
}
export interface ComputerControl {
  holder: "bot" | "human";
  request?: { id: string; status: string };
  requested: boolean;
  resumeSnapshotRequired: boolean;
  transitioning: boolean;
}
export interface ComputerStatus {
  audit: ComputerAudit[];
  configured: boolean;
  control?: ComputerControl;
  error?: string;
  permissions: ComputerPermissions;
  state: "not_configured" | "stopped" | "running" | "unavailable";
}
const path = z
  .string()
  .max(1024)
  .refine(
    (p) =>
      !p.startsWith("/") &&
      !p.includes("\\") &&
      !p.includes("\0") &&
      !p.split("/").some((s) => s === ".."),
    "Use a relative workspace path without traversal."
  );
const empty = z.object({}).strict();
const ref = {
  ref: z.string().min(1).max(100),
  snapshotId: z.number().int().nonnegative(),
};
export const computerInputs = {
  click: z.object(ref).strict(),
  exec: z
    .object({
      command: z.string().trim().min(1).max(8000),
      timeoutMs: z.number().int().min(1000).max(60_000).default(30_000),
    })
    .strict(),
  files_list: z.object({ path: path.default("") }).strict(),
  files_read: z.object({ path: path.refine((p) => p.length > 0) }).strict(),
  files_write: z
    .object({
      append: z.boolean().optional(),
      contents: z.string().max(100_000),
      path: path.refine((p) => p.length > 0),
    })
    .strict(),
  human_click: z
    .object({
      x: z.number().finite().min(0).max(16_000),
      y: z.number().finite().min(0).max(16_000),
    })
    .strict(),
  human_key: z.object({ key: z.string().min(1).max(100) }).strict(),
  human_scroll: z
    .object({ deltaY: z.number().finite().min(-10_000).max(10_000) })
    .strict(),
  human_type: z.object({ text: z.string().max(16_000) }).strict(),
  key: z.object({ key: z.string().min(1).max(100) }).strict(),
  navigate: z
    .object({
      url: z
        .string()
        .url()
        .max(2048)
        .refine(
          (s) =>
            ["http:", "https:"].includes(new URL(s).protocol) &&
            !new URL(s).username &&
            !new URL(s).password
        ),
    })
    .strict(),
  read: empty,
  screenshot: empty,
  scroll: z
    .object({ deltaY: z.number().finite().min(-10_000).max(10_000) })
    .strict(),
  snapshot: empty,
  type: z
    .object({
      ...ref,
      submit: z.boolean().optional(),
      text: z.string().max(16_000),
    })
    .strict(),
};
export type ComputerAction = keyof typeof computerInputs;
