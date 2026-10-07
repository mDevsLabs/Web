import { describe, expect, it } from "vitest";
import { isCreationMode, normalizeCreationMode } from "@/lib/creation/mode";

describe("mode Création", () => {
  it("ne valide que les deux modes proposés", () => {
    expect(isCreationMode("image")).toBe(true);
    expect(isCreationMode("audio")).toBe(true);
    for (const value of [undefined, null, "", "images", "Image", 42]) {
      expect(isCreationMode(value)).toBe(false);
      expect(normalizeCreationMode(value)).toBe("image");
    }
    expect(normalizeCreationMode("audio")).toBe("audio");
  });
});
