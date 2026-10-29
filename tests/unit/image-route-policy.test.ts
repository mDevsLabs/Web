import { describe, expect, it } from "vitest";
import { classifyMidjourneyPath } from "../../image-route-policy";

describe("Classification des routes Midjourney", () => {
  it("une lecture de statut n'est jamais une génération", () => {
    expect(classifyMidjourneyPath("task/abc123/fetch")).toEqual({
      action: null,
      generates: false,
      kind: "task_fetch",
      taskId: "abc123",
    });
    // L'identifiant est décodé, sans exécuter de chemin arbitraire.
    expect(classifyMidjourneyPath("task/a%20b/fetch")).toMatchObject({
      kind: "task_fetch",
      taskId: "a b",
    });
  });

  it("imagine, action, blend, change, modal et swap-face génèrent une image", () => {
    for (const action of [
      "imagine",
      "action",
      "blend",
      "change",
      "modal",
      "swap-face",
    ]) {
      const route = classifyMidjourneyPath(`submit/${action}`);
      expect(route.kind).toBe("submit");
      if (route.kind === "submit") {
        expect(route.generates, action).toBe(true);
        expect(route.action).toBe(action);
      }
    }
  });

  it("describe et shorten ne sont pas des générations facturables comme image", () => {
    for (const action of ["describe", "shorten"]) {
      const route = classifyMidjourneyPath(`submit/${action}`);
      expect(route.kind).toBe("submit");
      if (route.kind === "submit") {
        expect(route.generates, action).toBe(false);
      }
    }
  });

  it("action, change, modal et swap-face exigent une tâche possédée", () => {
    for (const action of ["action", "change", "modal", "swap-face"]) {
      const route = classifyMidjourneyPath(`submit/${action}`);
      expect(route.kind === "submit" && route.requiresTaskId).toBe(true);
    }
    for (const action of ["imagine", "blend", "describe", "shorten"]) {
      const route = classifyMidjourneyPath(`submit/${action}`);
      expect(route.kind === "submit" && route.requiresTaskId).toBe(false);
    }
  });

  it("refuse les chemins hors du contrat", () => {
    expect(classifyMidjourneyPath("submit/../../etc/passwd").kind).toBe(
      "unknown"
    );
    expect(classifyMidjourneyPath("task/abc").kind).toBe("unknown");
    expect(classifyMidjourneyPath("").kind).toBe("unknown");
    expect(classifyMidjourneyPath("submit/imagine/extra").kind).toBe("unknown");
  });
});
