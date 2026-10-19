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

/** Strip a doc URL down to its 22-char doc_id if a URL was passed. */
function normalizeDocId(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const m = trimmed.match(/(?:docx?|docs|wiki)\/([A-Za-z0-9]+)/);
  return m?.[1] ?? trimmed;
}

/**
 * Minimal block-descriptor → Feishu block payload converter.
 *
 * Supported kinds (cover ~95% of agent-generated content):
 * - text (with optional bold/italic/code/strike)
 * - heading (level 1-9)
 * - bullet, ordered (single-paragraph items)
 * - todo (checkbox)
 * - code (with language)
 * - quote
 * - divider
 * - callout
 *
 * We deliberately do NOT port the upstream 681-line blockFactory: tables,
 * whiteboards, formula blocks, and image binding are out of scope for v1
 * — agents writing full reports can always create text/heading/code/list
 * which round-trips losslessly through the docx_v1 batch_create API.
 */

type SimpleBlock = {
  kind:
    | "text"
    | "heading"
    | "bullet"
    | "ordered"
    | "todo"
    | "code"
    | "quote"
    | "divider"
    | "callout";
  text?: string;
  headingLevel?: number;
  codeLanguage?: string;
  bold?: boolean;
  italic?: boolean;
  inlineCode?: boolean;
  strikethrough?: boolean;
  checked?: boolean;
};

const HEADING_BLOCK_TYPES: Record<number, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 11,
};

function buildElement(block: SimpleBlock) {
  const text = block.text ?? "";
  return [
    {
      text_run: {
        content: text,
        text_element_style: {
          bold: Boolean(block.bold),
          inline_code: Boolean(block.inlineCode),
          italic: Boolean(block.italic),
          strikethrough: Boolean(block.strikethrough),
        },
      },
    },
  ];
}

function buildBlock(block: SimpleBlock): Record<string, unknown> {
  switch (block.kind) {
    case "text":
      return {
        block_type: 2,
        text: { elements: buildElement(block), style: {} },
      };
    case "heading": {
      const level = Math.min(Math.max(block.headingLevel ?? 1, 1), 9);
      const blockType = HEADING_BLOCK_TYPES[level]!;
      const fieldName = `heading${level}`;
      return {
        block_type: blockType,
        [fieldName]: { elements: buildElement(block), style: {} },
      };
    }
    case "bullet":
      return {
        block_type: 12,
        bullet: { elements: buildElement(block), style: {} },
      };
    case "ordered":
      return {
        block_type: 13,
        ordered: { elements: buildElement(block), style: {} },
      };
    case "todo":
      return {
        block_type: 17,
        todo: {
          elements: buildElement(block),
          style: { done: Boolean(block.checked) },
        },
      };
    case "code":
      return {
        block_type: 14,
        code: {
          elements: buildElement(block),
          style: { language: codeLanguageId(block.codeLanguage) },
        },
      };
    case "quote":
      return {
        block_type: 15,
        quote: { elements: buildElement(block), style: {} },
      };
    case "divider":
      return { block_type: 22, divider: {} };
    case "callout":
      return {
        block_type: 19,
        callout: { elements: buildElement(block), style: {} },
      };
  }
}

function codeLanguageId(name?: string): number {
  const lang = (name ?? "").toLowerCase().trim();
  const map: Record<string, number> = {
    bash: 5,
    c: 6,
    "c++": 8,
    cpp: 8,
    csharp: 9,
    go: 16,
    html: 19,
    java: 23,
    javascript: 24,
    js: 24,
    json: 25,
    kotlin: 28,
    markdown: 32,
    md: 32,
    objectivec: 35,
    php: 39,
    plaintext: 1,
    py: 49,
    python: 49,
    rust: 53,
    scala: 54,
    shell: 5,
    sql: 56,
    swift: 58,
    text: 1,
    ts: 63,
    typescript: 63,
    xml: 65,
    yaml: 67,
    yml: 67,
  };
  return map[lang] ?? 1;
}

export const FEISHU_DOCUMENT_TOOL_NAMES = [
  "create_feishu_document",
  "get_feishu_document_blocks",
  "batch_create_feishu_blocks",
  "search_feishu_documents",
] as const;

export const feishuDocumentToolDefs: AgentToolDef[] = [
  {
    description:
      "Create a new Feishu Docs document under a specified Drive folder. Returns { document_id, title, url }. Use create_feishu_folder first if you need a new folder.",
    name: "create_feishu_document",
    parameters: {
      properties: {
        folderToken: {
          description:
            "Target folder token (suffix in folder URL). Cannot be empty.",
          type: "string",
        },
        title: { description: "Document title.", type: "string" },
      },
      required: ["title", "folderToken"],
      type: "object",
    },
  },
  {
    description:
      "Fetch the full block tree of a Feishu Docs document. Pass documentId (doc_id or full doc URL — wiki nodes must first be resolved). Auto-paginates internally; returns the flat block array.",
    name: "get_feishu_document_blocks",
    parameters: {
      properties: {
        documentId: { description: "Document id or full URL.", type: "string" },
        pageSize: {
          description: "Page size (default 500, max 500).",
          type: "number",
        },
      },
      required: ["documentId"],
      type: "object",
    },
  },
  {
    description:
      "Append a batch of blocks under a parent block in a Feishu Docs document. parentBlockId defaults to the document root (= documentId). Each `blocks[i]` is a simple descriptor: { kind: text|heading|bullet|ordered|todo|code|quote|divider|callout, text, headingLevel?, codeLanguage?, bold?, italic?, inlineCode?, strikethrough?, checked? }. Use this to write text/headings/code/lists into a document.",
    name: "batch_create_feishu_blocks",
    parameters: {
      properties: {
        blocks: {
          description:
            "Array of block descriptors (see top-level description).",
          type: "array",
        },
        documentId: {
          description: "Document id (or full URL).",
          type: "string",
        },
        index: {
          description: "Insert position among siblings. Omit to append at end.",
          type: "number",
        },
        parentBlockId: {
          description:
            "Parent block id to append under. Omit to append at document root.",
          type: "string",
        },
      },
      required: ["documentId", "blocks"],
      type: "object",
    },
  },
  {
    description:
      "Full-text search Feishu Docs by keyword. Returns up to maxSize results (default first page ~50). Pagination via offset.",
    name: "search_feishu_documents",
    parameters: {
      properties: {
        maxSize: {
          description: "Cap on returned results. Omit for first page only.",
          type: "number",
        },
        offset: { description: "Starting offset. Default 0.", type: "number" },
        searchKey: { description: "Keyword.", type: "string" },
      },
      required: ["searchKey"],
      type: "object",
    },
  },
];

export function buildFeishuDocumentHandlers(
  client: FeishuApiClient
): Record<string, Handler> {
  return {
    batch_create_feishu_blocks: async (call) => {
      try {
        const documentId = normalizeDocId(
          String(call.arguments.documentId ?? "")
        );
        if (!documentId)
          return makeErrorResult(
            call.id,
            call.name,
            new Error("documentId is required.")
          );
        const blocksRaw = Array.isArray(call.arguments.blocks)
          ? call.arguments.blocks
          : [];
        if (blocksRaw.length === 0) {
          return makeErrorResult(
            call.id,
            call.name,
            new Error("blocks must contain at least one item.")
          );
        }
        const built = blocksRaw.map((b) => buildBlock(b as SimpleBlock));
        const parentBlockId =
          String(call.arguments.parentBlockId ?? "").trim() || documentId;
        const body: Record<string, unknown> = { children: built };
        if (typeof call.arguments.index === "number") {
          body.index = call.arguments.index;
        }
        const res = await client.request<{ data?: { children?: unknown[] } }>({
          data: body,
          method: "POST",
          url: `/open-apis/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children`,
          userToken: client.hasUserToken,
        });
        const data = res?.data ?? (res as { children?: unknown[] });
        return makeJsonResult(call.id, call.name, {
          children: data?.children ?? [],
          count: data?.children?.length ?? 0,
        });
      } catch (e) {
        return makeErrorResult(call.id, call.name, e);
      }
    },
    create_feishu_document: async (call) => {
      try {
        const title = String(call.arguments.title ?? "").trim();
        const folderToken = String(call.arguments.folderToken ?? "").trim();
        if (!title)
          return makeErrorResult(
            call.id,
            call.name,
            new Error("title is required.")
          );
        if (!folderToken)
          return makeErrorResult(
            call.id,
            call.name,
            new Error("folderToken is required.")
          );
        const res = await client.request<{ data?: { document?: unknown } }>({
          data: { folder_token: folderToken, title },
          method: "POST",
          url: "/open-apis/docx/v1/documents",
          userToken: client.hasUserToken,
        });
        const doc = res?.data?.document ?? res?.data ?? res;
        return makeJsonResult(call.id, call.name, doc);
      } catch (e) {
        return makeErrorResult(call.id, call.name, e);
      }
    },
    get_feishu_document_blocks: async (call) => {
      try {
        const documentId = normalizeDocId(
          String(call.arguments.documentId ?? "")
        );
        if (!documentId)
          return makeErrorResult(
            call.id,
            call.name,
            new Error("documentId is required.")
          );
        const pageSize = Math.min(
          Number(call.arguments.pageSize ?? 500) || 500,
          500
        );
        const allBlocks: unknown[] = [];
        let pageToken = "";
        const MAX_PAGES = 50;
        for (let page = 0; page < MAX_PAGES; page++) {
          const params: Record<string, unknown> = {
            document_revision_id: -1,
            page_size: pageSize,
          };
          if (pageToken) params.page_token = pageToken;
          const res = await client.request<{
            data?: {
              items?: unknown[];
              page_token?: string;
              has_more?: boolean;
            };
          }>({
            method: "GET",
            params,
            url: `/open-apis/docx/v1/documents/${documentId}/blocks`,
            userToken: client.hasUserToken,
          });
          const data =
            res?.data ??
            (res as {
              items?: unknown[];
              page_token?: string;
              has_more?: boolean;
            });
          allBlocks.push(...(data?.items ?? []));
          if (!data?.has_more || !data?.page_token) break;
          pageToken = data.page_token;
        }
        return makeJsonResult(call.id, call.name, {
          blocks: allBlocks,
          count: allBlocks.length,
        });
      } catch (e) {
        return makeErrorResult(call.id, call.name, e);
      }
    },
    search_feishu_documents: async (call) => {
      try {
        const searchKey = String(call.arguments.searchKey ?? "").trim();
        if (!searchKey)
          return makeErrorResult(
            call.id,
            call.name,
            new Error("searchKey is required.")
          );
        const maxSize =
          typeof call.arguments.maxSize === "number"
            ? call.arguments.maxSize
            : undefined;
        let offset =
          typeof call.arguments.offset === "number" ? call.arguments.offset : 0;
        const PAGE_SIZE = 50;
        const items: unknown[] = [];
        let hasMore = true;
        const MAX_PAGES = 20;
        for (
          let page = 0;
          page < MAX_PAGES &&
          hasMore &&
          (maxSize === undefined || items.length < maxSize);
          page++
        ) {
          const res = await client.request<{
            data?: { docs_entities?: unknown[]; has_more?: boolean };
          }>({
            data: {
              count: PAGE_SIZE,
              docs_types: ["doc"],
              offset,
              search_key: searchKey,
            },
            method: "POST",
            url: "/open-apis/suite/docs-api/search/object",
            userToken: client.hasUserToken,
          });
          const data =
            res?.data ??
            (res as { docs_entities?: unknown[]; has_more?: boolean });
          const batch = data?.docs_entities ?? [];
          items.push(...batch);
          offset += batch.length;
          hasMore = Boolean(data?.has_more) && batch.length > 0;
          if (maxSize === undefined) break;
        }
        return makeJsonResult(call.id, call.name, {
          hasMore,
          items: maxSize === undefined ? items : items.slice(0, maxSize),
          nextOffset: offset,
        });
      } catch (e) {
        return makeErrorResult(call.id, call.name, e);
      }
    },
  };
}
