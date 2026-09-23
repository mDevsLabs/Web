import { describe, expect, it } from "vitest";
import {
  decideToolPermission,
  permissionToDecision,
} from "@/lib/agent/tools/permissions";
import type { RegisteredAgentTool } from "@/lib/agent/types";

function toolWith(
  permissions: RegisteredAgentTool["permissions"]
): Pick<RegisteredAgentTool, "id" | "permissions"> {
  return { id: "demo_tool", permissions };
}

describe("PermissionEngine tri-états", () => {
  it("traduit les permissions en décisions allow / require_approval / deny", () => {
    expect(permissionToDecision("auto")).toBe("allow");
    expect(permissionToDecision("ask")).toBe("require_approval");
    expect(permissionToDecision("off")).toBe("deny");
  });

  it("exige l'approbation pour un outil destructif, même en autonomie élevée", () => {
    expect(
      decideToolPermission({
        autonomy: "high",
        tool: toolWith({ default: "auto", destructive: true }),
      })
    ).toBe("require_approval");
  });

  it("laisse filtrer un outil en lecture seule en autonomie élevée", () => {
    expect(
      decideToolPermission({
        autonomy: "high",
        tool: toolWith({ default: "ask", readOnly: true }),
      })
    ).toBe("allow");
  });

  it("fait primer la surcharge utilisateur explicite", () => {
    expect(
      decideToolPermission({
        autonomy: "high",
        overrides: { demo_tool: "ask" },
        tool: toolWith({ default: "auto", readOnly: true }),
      })
    ).toBe("require_approval");
  });

  it("interdit via deny quand l'utilisateur a désactivé l'outil", () => {
    expect(
      decideToolPermission({
        autonomy: "standard",
        overrides: { demo_tool: "off" },
        tool: toolWith({ default: "auto" }),
      })
    ).toBe("deny");
  });
});
