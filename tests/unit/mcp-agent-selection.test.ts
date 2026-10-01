import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..", "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("Sélection MCP des Agents", () => {
  it("n'accepte pas une liste MCP fournie par le client", () => {
    expect(read("app/(chat)/api/agent/schema.ts")).not.toContain(
      "mcpServerIds"
    );
    expect(read("app/(chat)/api/agent/route.ts")).not.toContain(
      "body.mcpServerIds"
    );
  });

  it("combine les serveurs de l'Agent et ceux de ses Skills", () => {
    const route = read("app/(chat)/api/agent/route.ts");
    expect(route).toContain(
      "new Set([...ctx.agentMcpServerIds, ...ctx.skillMcpServerIds])"
    );
  });
});
