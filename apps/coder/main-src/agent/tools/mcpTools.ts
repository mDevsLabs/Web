import type { McpToolResult } from "../../mcp/index.js";
import { getMcpManager } from "../../mcp/index.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  throwIfToolAbortRequested,
  type ToolExecutionContext,
} from "./toolContext.js";

export function formatMcpToolResultForAgent(result: McpToolResult): string {
  const parts: string[] = [];
  for (const block of result.content ?? []) {
    if (block.type === "text" && block.text != null && block.text !== "") {
      parts.push(block.text);
    } else if (block.type === "image") {
      parts.push(
        block.data
          ? `[image${block.mimeType ? ` ${block.mimeType}` : ""}, base64 ${Math.min(block.data.length, 64)} chars…]`
          : "[image]"
      );
    } else if (block.type === "resource") {
      parts.push("[resource]");
    } else {
      parts.push(JSON.stringify(block));
    }
  }
  const text = parts.join("\n\n").trim();
  return text || "(empty MCP result)";
}

export async function executeListMcpResources(call: ToolCall): Promise<ToolResult> {
  const filter = String(call.arguments.server ?? "").trim();
  const mgr = getMcpManager();
  const clients = mgr.getConnectedClients();
  let targets = clients;
  if (filter) {
    targets = clients.filter(
      (c) => c.config.id === filter || c.config.name === filter
    );
    if (targets.length === 0) {
      return {
        content: `No connected MCP server matches "${filter}".`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
  }
  const rows: Array<{
    uri: string;
    name: string;
    server: string;
    mimeType?: string;
    description?: string;
  }> = [];
  for (const c of targets) {
    const st = c.getServerStatus();
    for (const r of st.resources) {
      rows.push({
        description: r.description,
        mimeType: r.mimeType,
        name: r.name,
        server: c.config.name,
        uri: r.uri,
      });
    }
  }
  const text = JSON.stringify(rows, null, 2);
  return {
    content: text || "[]",
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export async function executeReadMcpResource(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "readMcpResource:start");
  const server = String(call.arguments.server ?? "").trim();
  const uri = String(call.arguments.uri ?? "").trim();
  if (!server || !uri) {
    return {
      content: "Error: server and uri are required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const client = getMcpManager().getClientByServerRef(server);
  if (!client) {
    return {
      content: `MCP server not found: ${server}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (client.getServerStatus().status !== "connected") {
    return {
      content: `MCP server not connected: ${server}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  try {
    const raw = await client.readResource(uri, execCtx.signal);
    const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    return {
      content: text,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      content: `MCP resources/read failed: ${msg}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

export async function executeMcpAgentTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  try {
    throwIfToolAbortRequested(execCtx.signal, call.name, "mcpTool:start");
    const raw = await getMcpManager().callTool(
      call.name,
      call.arguments,
      execCtx.signal
    );
    const content = formatMcpToolResultForAgent(raw);
    return {
      content,
      isError: !!raw.isError,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      content: `MCP tool error: ${msg}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}
