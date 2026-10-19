import { describe, expect, it } from "vitest";
import {
  nextReleaseTag,
  releaseChannel,
  releaseTitle,
} from "../../scripts/release-version.mjs";

describe("versions des releases", () => {
  it("donne la priorité au canal PR même lorsque la cible est main", () => {
    expect(releaseChannel("pull_request", "main")).toBe("pr");
    expect(releaseChannel("push", "feature/images")).toBe("beta");
    expect(releaseChannel("workflow_dispatch", "main")).toBe("stable");
  });
  it("incrémente uniquement le canal et la version concernés", () => {
    expect(
      nextReleaseTag("0.9.1", "beta", [
        "beta.0.9.1-2",
        "beta.0.9.1-10",
        "pr.0.9.1-20",
        "beta.0.9.2-50",
      ])
    ).toBe("beta.0.9.1-11");
    expect(nextReleaseTag("0.9.2", "pr", ["pr.0.9.1-7"])).toBe("pr.0.9.2-1");
    expect(
      nextReleaseTag("0.9.1", "pr", ["pr.0.9.1-alpha", "pr.0.9.1-0"])
    ).toBe("pr.0.9.1-1");
  });
  it("refuse de remplacer une version stable", () => {
    expect(nextReleaseTag("0.9.1", "stable", [])).toBe("stable.0.9.1");
    expect(() => nextReleaseTag("0.9.1", "stable", ["stable.0.9.1"])).toThrow(
      "Augmentez"
    );
  });
  it("refuse une version ou un canal invalides", () => {
    expect(() => nextReleaseTag("../main", "beta", [])).toThrow();
    expect(() => nextReleaseTag("0.9.1", "autre", [])).toThrow();
  });
  it("génère les titres canoniques", () => {
    expect(releaseTitle("beta.0.9.1-1")).toBe("Beta 0.9.1-1");
    expect(releaseTitle("stable.0.9.1")).toBe("Stable 0.9.1");
    expect(releaseTitle("pr.0.9.1-2")).toBe("PR 0.9.1-2");
  });
});
