import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageOutline } from "@/components/wakies/PageOutline";
import type { Page } from "@/lib/wakies/pages";

function page(partial: Partial<Page> & { id: string; title: string }): Page {
  return {
    content: "",
    createdAt: 1,
    parentId: null,
    pinned: false,
    revision: 1,
    settings: null,
    sourceThreadId: null,
    spaceId: "space-1",
    updatedAt: 1,
    ...partial,
  };
}

function render(pages: Page[]): string {
  return renderToStaticMarkup(
    createElement(PageOutline, {
      onClose: () => {},
      onNew: () => {},
      onPage: () => {},
      pages,
      selected: "",
    })
  );
}

describe("Plan des pages Wakies — données historiques invalides", () => {
  it("affiche la hiérarchie valide", () => {
    const markup = render([
      page({ id: "root", title: "Racine" }),
      page({ id: "child", parentId: "root", title: "Enfant" }),
    ]);
    expect(markup).toContain("Racine");
    expect(markup).toContain("Enfant");
  });

  it("affiche une page dont le parent est introuvable, à la racine", () => {
    const markup = render([
      page({ id: "orphan", parentId: "disparu", title: "Orpheline" }),
    ]);
    expect(markup).toContain("Orpheline");
    expect(markup).toContain('data-orphan="true"');
    expect(markup).toContain("parent introuvable");
  });

  it("affiche un cycle une seule fois, sans récursion infinie", () => {
    const markup = render([
      page({ id: "a", parentId: "b", title: "Cycle A" }),
      page({ id: "b", parentId: "a", title: "Cycle B" }),
    ]);
    expect(markup).toContain("Cycle A");
    expect(markup).toContain("Cycle B");
    // Chaque titre n'apparaît qu'une fois dans le plan (le libellé visible).
    expect((markup.match(/>Cycle A</g) ?? []).length).toBe(1);
    expect((markup.match(/>Cycle B</g) ?? []).length).toBe(1);
  });

  it("affiche une page auto-parentée sans disparaître", () => {
    const markup = render([
      page({ id: "self", parentId: "self", title: "Auto-parente" }),
    ]);
    expect(markup).toContain("Auto-parente");
    expect(markup).toContain('data-orphan="true"');
  });
});
