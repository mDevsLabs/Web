import type {
  AgentToolDef,
  ToolCall,
  ToolResult,
} from "../../../agent/agentTools.js";
import {
  type FeishuApiClient,
  makeErrorResult,
  makeJsonResult,
} from "./feishuApiClient.js";

type Handler = (call: ToolCall) => Promise<ToolResult>;

export const FEISHU_FOLDER_TOOL_NAMES = [
  "get_feishu_folder_files",
  "create_feishu_folder",
] as const;

export const feishuFolderToolDefs: AgentToolDef[] = [
  {
    description:
      'List files and subfolders inside a Feishu Drive folder. Provide folderToken (the suffix in the folder URL). Optional orderBy ("EditedTime"|"CreatedTime") and direction ("ASC"|"DESC", default DESC). Works with tenant or user token.',
    name: "get_feishu_folder_files",
    parameters: {
      properties: {
        direction: {
          description: 'Sort direction "ASC"|"DESC". Default "DESC".',
          type: "string",
        },
        folderToken: {
          description:
            "Folder token. Use empty string for the root folder of the user (user token only).",
          type: "string",
        },
        orderBy: {
          description: 'Sort field. Default "EditedTime".',
          type: "string",
        },
      },
      required: ["folderToken"],
      type: "object",
    },
  },
  {
    description:
      "Create a new subfolder under a Feishu Drive folder. Provide parent folderToken (token of parent folder) and the new folder name. Returns { token, url }. Works with tenant or user token.",
    name: "create_feishu_folder",
    parameters: {
      properties: {
        folderToken: { description: "Parent folder token.", type: "string" },
        name: { description: "New folder display name.", type: "string" },
      },
      required: ["folderToken", "name"],
      type: "object",
    },
  },
];

export function buildFeishuFolderHandlers(
  client: FeishuApiClient
): Record<string, Handler> {
  return {
    create_feishu_folder: async (call) => {
      try {
        const folderToken = String(call.arguments.folderToken ?? "").trim();
        const name = String(call.arguments.name ?? "").trim();
        if (!folderToken) {
          return makeErrorResult(
            call.id,
            call.name,
            new Error("folderToken is required.")
          );
        }
        if (!name) {
          return makeErrorResult(
            call.id,
            call.name,
            new Error("name is required.")
          );
        }
        const res = await client.request<{
          data?: { token?: string; url?: string };
        }>({
          data: { folder_token: folderToken, name },
          method: "POST",
          url: "/open-apis/drive/v1/files/create_folder",
          userToken: client.hasUserToken,
        });
        const data = res?.data ?? (res as { token?: string; url?: string });
        return makeJsonResult(call.id, call.name, {
          token: data?.token,
          url: data?.url,
        });
      } catch (e) {
        return makeErrorResult(call.id, call.name, e);
      }
    },
    get_feishu_folder_files: async (call) => {
      try {
        const folderToken = String(call.arguments.folderToken ?? "").trim();
        const orderBy =
          String(call.arguments.orderBy ?? "EditedTime").trim() || "EditedTime";
        const direction =
          String(call.arguments.direction ?? "DESC").trim() || "DESC";
        const params: Record<string, unknown> = {
          direction,
          order_by: orderBy,
        };
        if (folderToken) params.folder_token = folderToken;
        const res = await client.request<{
          data?: {
            files?: unknown[];
            has_more?: boolean;
            next_page_token?: string;
          };
        }>({
          method: "GET",
          params,
          url: "/open-apis/drive/v1/files",
          userToken: client.hasUserToken,
        });
        const data =
          res?.data ??
          (res as {
            files?: unknown[];
            has_more?: boolean;
            next_page_token?: string;
          });
        return makeJsonResult(call.id, call.name, {
          files: data?.files ?? [],
          has_more: Boolean(data?.has_more),
          next_page_token: data?.next_page_token,
        });
      } catch (e) {
        return makeErrorResult(call.id, call.name, e);
      }
    },
  };
}
