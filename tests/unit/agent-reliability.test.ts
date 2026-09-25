import { describe, expect, it } from "vitest";
import { agentRequestBodySchema } from "@/app/(chat)/api/agent/schema";
import { validateAttachmentsAgainstModel } from "@/lib/agent/context/files";
import { DEFAULT_AGENT_FLAGS } from "@/lib/agent/flags";
import { resolveToolPermission } from "@/lib/agent/tools/permissions";
import type { ModelCapabilities } from "@/lib/ai/registry";

describe("Agent — garde des outils et médias", () => {
  it("ne permet jamais auto pour une mutation externe, même avec surcharge", () => {
    const tool = {
      id: "external",
      permissions: {
        default: "auto" as const,
        impact: "external_mutation" as const,
      },
    };
    expect(
      resolveToolPermission({
        autonomy: "high",
        overrides: { external: "auto" },
        tool,
      })
    ).toBe("ask");
    expect(
      resolveToolPermission({
        autonomy: "high",
        overrides: { external: "off" },
        tool,
      })
    ).toBe("off");
  });

  it("conserve l'automatisme possible pour un livrable local", () => {
    const tool = {
      id: "artifact",
      permissions: {
        default: "auto" as const,
        impact: "local_creation" as const,
      },
    };
    expect(resolveToolPermission({ autonomy: "high", tool })).toBe("auto");
  });

  it("refuse un média incompatible avec les capacités détaillées", () => {
    const capabilities = {
      documents: true,
      images: false,
      maxFiles: 2,
    } as ModelCapabilities;
    expect(
      validateAttachmentsAgainstModel({
        attachments: [
          {
            contentType: "image/png",
            name: "image.png",
            url: "https://example.com/a",
          },
        ],
        capabilities,
      }).error
    ).toContain("images");
    expect(
      validateAttachmentsAgainstModel({
        attachments: [
          {
            contentType: "application/pdf",
            name: "rapport.pdf",
            url: "https://example.com/a",
          },
        ],
        capabilities,
      }).error
    ).toBeUndefined();
  });
});

describe("Agent — déploiement progressif", () => {
  it("garde les nouvelles interfaces derrière leurs flags", () => {
    expect(DEFAULT_AGENT_FLAGS["agent.approvalPreview"]).toBe(false);
    expect(DEFAULT_AGENT_FLAGS["agent.guidedResume"]).toBe(false);
    expect(DEFAULT_AGENT_FLAGS["agent.scheduleHistory"]).toBe(false);
    expect(DEFAULT_AGENT_FLAGS["agent.activity"]).toBe(false);
  });

  it("valide l'identifiant du run parent", () => {
    const base = {
      id: "11111111-1111-4111-8111-111111111111",
      message: {
        id: "22222222-2222-4222-8222-222222222222",
        parts: [{ text: "Poursuis", type: "text" }],
        role: "user",
      },
      modelId: "model",
    };
    expect(
      agentRequestBodySchema.safeParse({
        ...base,
        resumeFromRunId: "33333333-3333-4333-8333-333333333333",
      }).success
    ).toBe(true);
    expect(
      agentRequestBodySchema.safeParse({ ...base, resumeFromRunId: "invalide" })
        .success
    ).toBe(false);
  });
});
