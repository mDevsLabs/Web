import { describe, expect, it } from "vitest";
import {
  markdownToDocx,
  markdownToPdf,
  markdownToText,
} from "@/lib/export/document-export";
import { resolveNewPageDefaults } from "@/lib/pages/defaults";
import { isPageAuthor, pageOwnerIds } from "@/lib/pages/identity";
import { PAGE_CONTENT_MAX, pageContentTooLong } from "@/lib/pages/limits";
import {
  canAttachPage,
  canDetachPage,
  canEditPage,
  canExportPage,
  canUsePageAssistant,
  canViewPage,
} from "@/lib/pages/permissions";
import { decideRevision } from "@/lib/pages/revision";
import { getTierPageLimit, isPageQuotaExceeded } from "@/lib/plans/tier-limits";
import { buildPageSystemPrompt } from "@/lib/prompts/pages";
import { PERSONAL_HEADER } from "@/lib/prompts/personal";
import { SOURCE_ORDER } from "@/lib/search/index-query";
import { SEARCH_SOURCE_KEYS, SEARCH_SOURCE_LABELS } from "@/lib/search/types";

const SAMPLE = `# Titre

Un paragraphe **gras** avec un accent : été.

- une puce
- deux

1. premier

> une citation

\`\`\`
code
\`\`\`

| A | B |
| - | - |
| 1 | 2 |

---
`;

describe("Permissions des pages", () => {
  it("réserve l'édition, l'export et mAI à l'auteur", () => {
    expect(canViewPage("author")).toBe(true);
    expect(canViewPage("viewer")).toBe(true);
    expect(canViewPage(null)).toBe(false);
    expect(canEditPage("author")).toBe(true);
    expect(canEditPage("viewer")).toBe(false);
    expect(canExportPage("viewer")).toBe(false);
    expect(canUsePageAssistant("viewer")).toBe(false);
  });

  it("laisse détacher l'auteur et le propriétaire du projet", () => {
    expect(
      canDetachPage({
        hasProject: true,
        pageRole: "author",
        projectRole: "member",
      })
    ).toBe(true);
    expect(
      canDetachPage({
        hasProject: true,
        pageRole: "viewer",
        projectRole: "owner",
      })
    ).toBe(true);
    expect(
      canDetachPage({
        hasProject: true,
        pageRole: "viewer",
        projectRole: "member",
      })
    ).toBe(false);
    expect(
      canDetachPage({
        hasProject: false,
        pageRole: "author",
        projectRole: null,
      })
    ).toBe(false);
  });

  it("rattache seulement l'auteur qui peut contribuer au projet", () => {
    expect(canAttachPage({ isAuthor: true, projectRole: "member" })).toBe(true);
    expect(canAttachPage({ isAuthor: true, projectRole: null })).toBe(false);
    expect(canAttachPage({ isAuthor: false, projectRole: "owner" })).toBe(
      false
    );
  });

  it("reconnaît l'auteur par identifiant ou email", () => {
    expect(pageOwnerIds("42", "a@b.c")).toEqual(["42", "a@b.c"]);
    expect(isPageAuthor("a@b.c", "42", "a@b.c")).toBe(true);
    expect(isPageAuthor("autre", "42", "a@b.c")).toBe(false);
  });
});

describe("Quota et révision des pages", () => {
  it("borne Free, Plus et Pro, et laisse Max illimité", () => {
    expect(getTierPageLimit("free")).toBe(10);
    expect(getTierPageLimit("plus")).toBe(40);
    expect(getTierPageLimit("pro")).toBe(100);
    expect(getTierPageLimit("max")).toBeNull();
  });

  it("retombe sur Free pour un forfait illisible", () => {
    expect(getTierPageLimit(null)).toBe(10);
    expect(getTierPageLimit("inconnu")).toBe(10);
    expect(isPageQuotaExceeded("inconnu", 10)).toBe(true);
    expect(isPageQuotaExceeded("max", 10_000)).toBe(false);
  });

  it("refuse une révision qui ne correspond pas", () => {
    expect(decideRevision(3, 3)).toEqual({ next: 4, ok: true });
    expect(decideRevision(3, 2).ok).toBe(false);
    expect(decideRevision(1.5, 1).ok).toBe(false);
  });

  it("borne le corps indépendamment du forfait", () => {
    expect(pageContentTooLong("a".repeat(PAGE_CONTENT_MAX))).toBe(false);
    expect(pageContentTooLong("a".repeat(PAGE_CONTENT_MAX + 1))).toBe(true);
  });
});

describe("Export des pages", () => {
  it("produit du texte, un DOCX et un PDF", async () => {
    const text = markdownToText(SAMPLE);
    expect(text).toContain("Titre");
    expect(text).toContain("été");
    expect(text).toContain("une puce");
    expect(text).toContain("1 | 2");

    const docx = await markdownToDocx(SAMPLE, "Titre");
    expect(docx[0]).toBe(0x50);
    expect(docx[1]).toBe(0x4b);

    const pdf = await markdownToPdf(SAMPLE, "Titre");
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
  }, 30_000);
});

describe("Prompt et recherche des pages", () => {
  it("place les consignes personnelles après le contrat", () => {
    const prompt = buildPageSystemPrompt({
      accountEnabled: true,
      accountInstructions: "Toujours vouvoyer.",
      intent: "edit",
      pagePrompt: "Ton pédagogique.",
      projectInstructions: "Projet alpha.",
      selection: "passage choisi",
    });
    const header = prompt.indexOf(PERSONAL_HEADER);
    expect(header).toBeGreaterThan(prompt.indexOf("MODE ÉDITION"));
    expect(prompt.indexOf("CONTEXTE DU PROJET")).toBeGreaterThan(header);
    expect(prompt.indexOf("PROMPT DE LA PAGE")).toBeGreaterThan(
      prompt.indexOf("CONTEXTE DU PROJET")
    );
    expect(prompt.indexOf("INSTRUCTIONS DU COMPTE")).toBeGreaterThan(
      prompt.indexOf("PROMPT DE LA PAGE")
    );
    expect(prompt).toContain("passage choisi");
    expect(prompt).toContain("modifier_page");
  });

  it("injecte la mémoire du compte une seule fois", () => {
    const prompt = buildPageSystemPrompt({
      accountEnabled: true,
      accountInstructions: "Toujours vouvoyer.",
      intent: "propose",
      memoryBlock: "MÉMOIRE — 1. Prague",
      pagePrompt: null,
      projectInstructions: "Projet alpha.",
      selection: null,
    });
    expect(prompt.split("Prague").length - 1).toBe(1);
    expect(prompt.indexOf("MÉMOIRE")).toBeGreaterThan(
      prompt.indexOf("CONTEXTE DU PROJET")
    );
    expect(prompt.indexOf("INSTRUCTIONS DU COMPTE")).toBeGreaterThan(
      prompt.indexOf("Prague")
    );
  });

  it("omet les instructions du compte quand elles sont désactivées", () => {
    const prompt = buildPageSystemPrompt({
      accountEnabled: false,
      accountInstructions: "secret",
      intent: "propose",
      pagePrompt: null,
      projectInstructions: null,
      selection: null,
    });
    expect(prompt).not.toContain("secret");
    expect(prompt).toContain("proposer_modification");
  });

  it("expose la source Pages dans l'index interne", () => {
    expect(SEARCH_SOURCE_KEYS).toContain("page");
    expect(SEARCH_SOURCE_LABELS.page).toBe("Pages");
    expect(new Set(SOURCE_ORDER)).toEqual(new Set(SEARCH_SOURCE_KEYS));
  });

  it("copie les défauts du compte sur une page nouvelle", () => {
    expect(
      resolveNewPageDefaults({
        duplicate: null,
        preferences: {
          pagesDefaultModel: " mai-2 ",
          pagesDefaultPrompt: "  Vouvoyer. ",
        },
      })
    ).toEqual({
      customPrompt: "Vouvoyer.",
      modelId: "mai-2",
    });
  });

  it("laisse une page nouvelle sans consigne quand le défaut est vide", () => {
    expect(
      resolveNewPageDefaults({
        duplicate: null,
        preferences: {
          pagesDefaultModel: "  ",
          pagesDefaultPrompt: "   ",
        },
      })
    ).toEqual({ customPrompt: null, modelId: null });
  });

  it("reprend le modèle de la page source lors d'une duplication", () => {
    expect(
      resolveNewPageDefaults({
        duplicate: { customPrompt: "Source", modelId: "autre" },
        preferences: {
          pagesDefaultModel: "mai-2",
          pagesDefaultPrompt: "Défaut",
        },
      })
    ).toEqual({ customPrompt: "Source", modelId: "autre" });
  });
});
