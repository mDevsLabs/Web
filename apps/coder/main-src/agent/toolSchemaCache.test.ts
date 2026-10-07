import { describe, expect, it } from "vitest";
import type { AgentToolDef } from "./agentTools";
import {
  buildAnthropicToolSchemas,
  buildOpenAIToolSchemas,
} from "./toolSchemaCache";

const writeLikeTool: AgentToolDef = {
  description: "Order-sensitive write-like tool.",
  name: "WriteLikeOrderTest",
  parameters: {
    properties: {
      file_path: {
        description: "Path to the file.",
        type: "string",
      },
      content: {
        description: "Full file contents.",
        type: "string",
      },
    },
    required: ["file_path", "content"],
    type: "object",
  },
};

function objectKeys(value: unknown): string[] {
  return Object.keys(value as Record<string, unknown>);
}

describe("toolSchemaCache", () => {
  it("preserves JSON schema property order in emitted OpenAI tools", () => {
    const [schema] = buildOpenAIToolSchemas([writeLikeTool]);
    const parameters = schema?.function.parameters as
      | { properties?: unknown; required?: unknown }
      | undefined;
    expect(objectKeys(parameters?.properties)).toEqual([
      "file_path",
      "content",
    ]);
    expect(parameters?.required).toEqual(["file_path", "content"]);
  });

  it("preserves JSON schema property order in emitted Anthropic tools", () => {
    const [schema] = buildAnthropicToolSchemas([writeLikeTool]);
    const inputSchema = schema?.input_schema as
      | { properties?: unknown; required?: unknown }
      | undefined;
    expect(objectKeys(inputSchema?.properties)).toEqual([
      "file_path",
      "content",
    ]);
    expect(inputSchema?.required).toEqual(["file_path", "content"]);
  });
});
