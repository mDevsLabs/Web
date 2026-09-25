import { describe, expect, it } from "vitest";
import { inputSchemaFor } from "@/lib/mcp/chat-tools";

describe("Schéma d'entrée MCP", () => {
  it("applique required, types et refus des propriétés inattendues", () => {
    const schema = inputSchemaFor({
      inputSchema: {
        additionalProperties: false,
        properties: {
          count: { type: "integer" },
          label: { enum: ["a", "b"], type: "string" },
        },
        required: ["count"],
        type: "object",
      },
      name: "example",
    });

    expect(schema.safeParse({ count: 2, label: "a" }).success).toBe(true);
    expect(schema.safeParse({ label: "a" }).success).toBe(false);
    expect(schema.safeParse({ count: 1, unexpected: true }).success).toBe(
      false
    );
    expect(schema.safeParse({ count: 1.5 }).success).toBe(false);
    expect(schema.safeParse({ count: 1, label: "c" }).success).toBe(false);
  });
});
