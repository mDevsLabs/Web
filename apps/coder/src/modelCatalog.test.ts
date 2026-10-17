import { describe, expect, it } from "vitest";
import {
  createEmptyUserModel,
  DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
  mergeDiscoveredProviderModels,
  type UserModelEntry,
} from "./modelCatalog";

describe("createEmptyUserModel", () => {
  it("defaults temperature mode to auto", () => {
    expect(createEmptyUserModel("prov-a")).toMatchObject({
      providerId: "prov-a",
      temperatureMode: "auto",
    });
  });
});

describe("mergeDiscoveredProviderModels", () => {
  it("adds newly discovered models for a provider", () => {
    const entries: UserModelEntry[] = [
      {
        displayName: "GPT-4o",
        id: "existing",
        maxOutputTokens: DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
        providerId: "prov-a",
        requestName: "gpt-4o",
      },
    ];

    const result = mergeDiscoveredProviderModels(entries, "prov-a", [
      { requestName: "gpt-4o" },
      {
        contextWindowTokens: 128_000,
        maxOutputTokens: 32_768,
        requestName: "gpt-4.1-mini",
      },
    ]);

    expect(result.addedCount).toBe(1);
    expect(result.totalDiscovered).toBe(2);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[1]).toMatchObject({
      contextWindowTokens: 128_000,
      displayName: "gpt-4.1-mini",
      maxOutputTokens: 32_768,
      providerId: "prov-a",
      requestName: "gpt-4.1-mini",
    });
  });

  it("reuses blank placeholder rows before appending new entries", () => {
    const entries: UserModelEntry[] = [
      {
        displayName: "",
        id: "blank",
        maxOutputTokens: DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
        providerId: "prov-a",
        requestName: "",
      },
      {
        displayName: "",
        id: "other-provider",
        maxOutputTokens: DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
        providerId: "prov-b",
        requestName: "",
      },
    ];

    const result = mergeDiscoveredProviderModels(entries, "prov-a", [
      { maxOutputTokens: 8192, requestName: "llama3.2" },
    ]);

    expect(result.addedCount).toBe(1);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      displayName: "llama3.2",
      id: "blank",
      maxOutputTokens: 8192,
      providerId: "prov-a",
      requestName: "llama3.2",
    });
  });

  it("filters already configured duplicate models without mutating existing entries", () => {
    const entries: UserModelEntry[] = [
      {
        displayName: "",
        id: "no-display",
        maxOutputTokens: DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
        providerId: "prov-a",
        requestName: "deepseek-r1",
      },
      {
        displayName: "My Claude Alias",
        id: "custom-display",
        maxOutputTokens: DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
        providerId: "prov-a",
        requestName: "claude-3-7-sonnet",
      },
    ];

    const result = mergeDiscoveredProviderModels(entries, "prov-a", [
      { displayName: "DeepSeek R1", requestName: "deepseek-r1" },
      { displayName: "Claude 3.7 Sonnet", requestName: "claude-3-7-sonnet" },
    ]);

    expect(result.addedCount).toBe(0);
    expect(result.entries[0]).toMatchObject({
      displayName: "",
      requestName: "deepseek-r1",
    });
    expect(result.entries[1]).toMatchObject({
      displayName: "My Claude Alias",
      requestName: "claude-3-7-sonnet",
    });
  });
});
