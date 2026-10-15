import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  requireWorkspace,
  resolveAgentFilePath,
  type ToolExecutionContext,
} from "./toolContext.js";

export const SEVERITY_LABEL: Record<number, string> = {
  1: "error",
  2: "warning",
  3: "info",
  4: "hint",
};

export const LSP_OPERATION_SET = new Set([
  "goToDefinition",
  "findReferences",
  "hover",
  "documentSymbol",
  "workspaceSymbol",
  "goToImplementation",
  "prepareCallHierarchy",
  "incomingCalls",
  "outgoingCalls",
  "getDiagnostics",
]);

export const LSP_POSITION_OPTIONAL = new Set(["getDiagnostics", "workspaceSymbol"]);

export function lspRelUriPath(uri: string, workspaceRoot: string): string {
  if (!uri.startsWith("file:")) return uri;
  try {
    const p = fileURLToPath(uri);
    return path.relative(workspaceRoot, p).replace(/\\/g, "/") || ".";
  } catch {
    return uri;
  }
}

export function formatLspLocationish(res: unknown, workspaceRoot: string): string {
  if (res == null) return "(no results)";
  const arr = Array.isArray(res) ? res : [res];
  const lines: string[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const uri = (o.uri ?? o.targetUri) as string | undefined;
    const range = (o.range ?? o.targetSelectionRange ?? o.targetRange) as
      | { start?: { line: number; character: number } }
      | undefined;
    if (uri && range?.start) {
      const rel = lspRelUriPath(uri, workspaceRoot);
      const line = (range.start.line ?? 0) + 1;
      const col = (range.start.character ?? 0) + 1;
      lines.push(`${rel}:${line}:${col}`);
    }
  }
  if (lines.length === 0)
    return typeof res === "object"
      ? JSON.stringify(res).slice(0, 12_000)
      : String(res);
  const cap = 500;
  return (
    lines.slice(0, cap).join("\n") +
    (lines.length > cap ? `\n... (${lines.length - cap} more locations)` : "")
  );
}

export function formatLspHover(raw: unknown): string {
  if (raw == null) return "(no hover)";
  if (typeof raw !== "object") return String(raw);
  const c = (raw as { contents?: unknown }).contents;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "value" in (c as object)) {
    return String((c as { value?: string }).value ?? "");
  }
  if (Array.isArray(c)) {
    return c
      .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
      .join("\n");
  }
  return JSON.stringify(raw).slice(0, 12_000);
}

export function formatLspDocumentSymbolsNode(
  s: unknown,
  indent: number,
  workspaceRoot: string
): string[] {
  if (!s || typeof s !== "object") return [];
  const o = s as Record<string, unknown>;
  const lines: string[] = [];
  const name = String(o.name ?? "?");
  const kind = o.kind == null ? "" : String(o.kind);
  let suffix = "";
  if (o.range && typeof o.range === "object") {
    const st = (o.range as { start?: { line: number } }).start;
    if (st) suffix = ` L${(st.line ?? 0) + 1}`;
  }
  if (o.location && typeof o.location === "object") {
    const loc = o.location as {
      uri: string;
      range?: { start: { line: number } };
    };
    const rel = lspRelUriPath(loc.uri, workspaceRoot);
    const ln = (loc.range?.start?.line ?? 0) + 1;
    suffix = ` ${rel}:${ln}`;
  }
  lines.push(
    `${"  ".repeat(indent)}${name}${kind ? ` [${kind}]` : ""}${suffix}`
  );
  const ch = o.children;
  if (Array.isArray(ch)) {
    for (const c of ch)
      lines.push(...formatLspDocumentSymbolsNode(c, indent + 1, workspaceRoot));
  }
  return lines;
}

export function formatLspDocumentSymbolsResult(
  res: unknown,
  workspaceRoot: string
): string {
  if (!Array.isArray(res) || res.length === 0) return "(no symbols)";
  const parts: string[] = [];
  for (const s of res)
    parts.push(...formatLspDocumentSymbolsNode(s, 0, workspaceRoot));
  const cap = 400;
  return (
    parts.slice(0, cap).join("\n") +
    (parts.length > cap ? "\n... (truncated)" : "")
  );
}

export function formatLspWorkspaceSymbols(
  res: unknown,
  workspaceRoot: string
): string {
  if (!Array.isArray(res) || res.length === 0) return "(no symbols)";
  const lines: string[] = [];
  for (const s of res as Array<{
    name?: string;
    location?: { uri: string; range?: { start: { line: number } } };
  }>) {
    if (!s?.location?.uri) continue;
    const rel = lspRelUriPath(s.location.uri, workspaceRoot);
    const line = (s.location.range?.start?.line ?? 0) + 1;
    lines.push(`${s.name ?? "?"} — ${rel}:${line}`);
    if (lines.length >= 300) break;
  }
  return lines.join("\n") || "(no symbols)";
}

export function formatLspCallHierarchyPrepare(
  res: unknown,
  workspaceRoot: string
): string {
  if (res == null) return "(no items)";
  const arr = Array.isArray(res) ? res : [res];
  const lines: string[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? "?");
    const uri = o.uri as string | undefined;
    const range = o.range as { start?: { line: number } } | undefined;
    if (!uri) continue;
    const rel = lspRelUriPath(uri, workspaceRoot);
    const ln = (range?.start?.line ?? 0) + 1;
    lines.push(`${name} — ${rel}:${ln}`);
  }
  return lines.join("\n") || "(no items)";
}

export function formatLspCallHierarchyCalls(
  res: unknown,
  workspaceRoot: string,
  op: "incomingCalls" | "outgoingCalls"
): string {
  if (res == null || (Array.isArray(res) && res.length === 0))
    return "(no calls)";
  if (!Array.isArray(res)) return JSON.stringify(res).slice(0, 12_000);
  const lines: string[] = [];
  if (op === "incomingCalls") {
    for (const row of res as Array<{
      from?: {
        name?: string;
        uri?: string;
        range?: { start: { line: number } };
      };
    }>) {
      const from = row.from;
      if (!from?.uri) continue;
      const rel = lspRelUriPath(from.uri, workspaceRoot);
      const ln = (from.range?.start?.line ?? 0) + 1;
      lines.push(`from ${from.name ?? "?"} @ ${rel}:${ln}`);
    }
  } else {
    for (const row of res as Array<{
      to?: { name?: string; uri?: string; range?: { start: { line: number } } };
    }>) {
      const to = row.to;
      if (!to?.uri) continue;
      const rel = lspRelUriPath(to.uri, workspaceRoot);
      const ln = (to.range?.start?.line ?? 0) + 1;
      lines.push(`to ${to.name ?? "?"} @ ${rel}:${ln}`);
    }
  }
  return lines.slice(0, 400).join("\n") || JSON.stringify(res).slice(0, 12_000);
}

export async function executeLspTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  const args = call.arguments;
  const op = String(args.operation ?? "").trim();
  const filePathRaw = String(args.filePath ?? args.file_path ?? "").trim();
  if (!op) {
    return {
      content:
        "Error: operation is required (e.g. goToDefinition, findReferences, hover, getDiagnostics)",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!LSP_OPERATION_SET.has(op)) {
    return {
      content: `Error: unknown LSP operation "${op}"`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!filePathRaw) {
    return {
      content: "Error: filePath is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let line = typeof args.line === "number" ? args.line : Number(args.line);
  let character =
    typeof args.character === "number"
      ? args.character
      : Number(args.character);
  if (LSP_POSITION_OPTIONAL.has(op)) {
    if (!Number.isFinite(line) || line < 1) line = 1;
    if (!Number.isFinite(character) || character < 1) character = 1;
  } else if (
    !Number.isFinite(line) ||
    !Number.isFinite(character) ||
    line < 1 ||
    character < 1
  ) {
    return {
      content:
        "Error: line and character must be positive integers (1-based, as shown in the editor).",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const root = requireWorkspace(execCtx);
  let rel: string;
  let full: string;
  try {
    ({ rel, full } = resolveAgentFilePath(filePathRaw, execCtx));
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return {
      content: `File not found or not a regular file: ${rel}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const mgr = execCtx.workspaceLspManager;
  if (!mgr) {
    return {
      content: "LSP manager is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let session: Awaited<ReturnType<WorkspaceLspManager["sessionForFile"]>>;
  try {
    session = await mgr.sessionForFile(full, root);
  } catch (e) {
    return {
      content: `Could not start language server: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!session) {
    const ext = path.extname(rel).toLowerCase() || "(none)";
    return {
      content: `No LSP server handles extension "${ext}". Add a plugin under <maiData>/plugins/<name>/ or <workspace>/.mai/plugins/<name>/ with .lsp.json (command + extensionToLanguage), or use legacy settings.json "lsp.servers". For TS/JS, install typescript-language-server in the project or register it explicitly.`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const text = fs.readFileSync(full, "utf-8");
  const uri = pathToFileURL(full).href;

  try {
    let out = "";
    switch (op) {
      case "getDiagnostics": {
        const items = await session.diagnostics(uri, text);
        if (items === null) {
          out =
            "Pull diagnostics not supported by the current language server. Try running tsc manually.";
        } else if (items.length === 0) {
          out = `No diagnostics in ${rel}.`;
        } else {
          out = items
            .map((d) => {
              const sev = SEVERITY_LABEL[d.severity ?? 1] ?? "error";
              const ln = (d.range.start.line ?? 0) + 1;
              const col = (d.range.start.character ?? 0) + 1;
              return `[${sev}] ${rel}:${ln}:${col} — ${d.message}`;
            })
            .join("\n");
        }
        break;
      }
      case "goToDefinition":
        out = formatLspLocationish(
          await session.definition(uri, line, character, text),
          root
        );
        break;
      case "findReferences":
        out = formatLspLocationish(
          await session.references(uri, line, character, text),
          root
        );
        break;
      case "hover":
        out = formatLspHover(await session.hover(uri, line, character, text));
        break;
      case "documentSymbol":
        out = formatLspDocumentSymbolsResult(
          await session.documentSymbols(uri, text),
          root
        );
        break;
      case "workspaceSymbol":
        await session.syncDocument(uri, text);
        out = formatLspWorkspaceSymbols(
          await session.workspaceSymbol(""),
          root
        );
        break;
      case "goToImplementation":
        out = formatLspLocationish(
          await session.implementation(uri, line, character, text),
          root
        );
        break;
      case "prepareCallHierarchy":
        out = formatLspCallHierarchyPrepare(
          await session.prepareCallHierarchy(uri, line, character, text),
          root
        );
        break;
      case "incomingCalls": {
        const items = await session.prepareCallHierarchy(
          uri,
          line,
          character,
          text
        );
        const arr = Array.isArray(items) ? items : items ? [items] : [];
        if (arr.length === 0) out = "No call hierarchy item at this position.";
        else
          out = formatLspCallHierarchyCalls(
            await session.incomingCalls(arr[0]),
            root,
            "incomingCalls"
          );
        break;
      }
      case "outgoingCalls": {
        const items = await session.prepareCallHierarchy(
          uri,
          line,
          character,
          text
        );
        const arr = Array.isArray(items) ? items : items ? [items] : [];
        if (arr.length === 0) out = "No call hierarchy item at this position.";
        else
          out = formatLspCallHierarchyCalls(
            await session.outgoingCalls(arr[0]),
            root,
            "outgoingCalls"
          );
        break;
      }
      default:
        out = `Unsupported operation: ${op}`;
    }
    return {
      content: out,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e) {
    return {
      content: `LSP error (${op}): ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}
