import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultPane } from "@/components/wakies/ResultPane";
import type { Wakie } from "@/lib/wakies/shared/types";

const wakie: Wakie = {
  avatar: null,
  createdAt: 1,
  id: "w1",
  instructions: "",
  mcpServerIds: [],
  memoryAllowed: true,
  model: null,
  name: "Atlas",
  pluginIds: [],
  researchAllowed: true,
  skillIds: [],
  spaceId: "s1",
  spaceIds: ["s1"],
  toolIds: [],
} as Wakie;

function pane(computersAvailable: boolean): string {
  return renderToStaticMarkup(
    createElement(ResultPane, {
      computersAvailable,
      defaultWakieId: wakie.id,
      latest: null,
      onClose: () => {},
      wakieState: "idle",
      wakies: [wakie],
    })
  );
}

describe("Panneau de résultat Wakies — disponibilité d'Ordinateur", () => {
  it("ne propose pas l'onglet Ordinateur quand setup.computers est faux", () => {
    const markup = pane(false);
    expect(markup).not.toContain("Ordinateur de");
    expect(markup).toContain("Synthèse");
  });

  it("propose l'onglet Ordinateur quand le service est disponible", () => {
    const markup = pane(true);
    expect(markup).toContain("Ordinateur de Atlas");
  });
});
