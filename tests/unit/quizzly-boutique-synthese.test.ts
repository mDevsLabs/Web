/**
 * Tests unitaires pour la boutique étendue, les cadeaux et les fiches de synthèse Quizzly.
 */

import { describe, expect, it } from "vitest";
import { normaliserCosmetiques } from "@/lib/quizzly/rules";
import {
  articleBoutique,
  classeCadre,
  listerArticlesBoutique,
} from "@/lib/quizzly/shop";
import { FICHES_SYNTHESE } from "@/lib/quizzly/synthese-data";

describe("Quizzly Boutique Étendue", () => {
  it("contient les nouveaux cadres diamant et améthyste", () => {
    const articles = listerArticlesBoutique();
    const diamant = articles.find((a) => a.id === "cadre-diamant");
    const amethyste = articles.find((a) => a.id === "cadre-amethyste");

    expect(diamant).toBeDefined();
    expect(diamant?.price).toBe(600);
    expect(diamant?.kind).toBe("frame");
    expect(amethyste).toBeDefined();
    expect(amethyste?.price).toBe(500);
    expect(amethyste?.kind).toBe("frame");
  });

  it("gère les classes CSS des nouveaux cadres", () => {
    expect(classeCadre("cadre-diamant")).toBe("ring-2 ring-cyan-400");
    expect(classeCadre("cadre-amethyste")).toBe("ring-2 ring-purple-500");
    expect(classeCadre("cadre-or")).toBe("ring-2 ring-q-streak");
  });

  it("fusionne un article persistant avec le catalogue statique", () => {
    const articleCustom = {
      description: "Pour les plus illustres érudits.",
      id: "titre-legende-vivante",
      kind: "boost" as const,
      label: "Légende Vivante",
      price: 999,
    };

    const lookup = articleBoutique("titre-legende-vivante", [articleCustom]);
    expect(lookup).toBeDefined();
    expect(lookup?.label).toBe("Légende Vivante");
    expect(lookup?.price).toBe(999);

    const liste = listerArticlesBoutique([articleCustom]);
    expect(liste.some((a) => a.id === "titre-legende-vivante")).toBe(true);
  });
});

describe("Quizzly Cosmétiques et Cadeaux", () => {
  it("normalise correctement les cadeaux reçus, envoyés et articles personnalisés", () => {
    const brute = {
      customItems: [],
      equippedFrame: "cadre-diamant",
      giftsReceived: [
        {
          claimed: false,
          gems: 50,
          id: "gift-1",
          message: "Bravo pour le quiz !",
          recipientId: "user-2",
          senderDisplayName: "Mathias",
          senderId: "user-1",
          senderUsername: "mathias",
          sentAt: "2026-11-01T10:00:00.000Z",
        },
      ],
      giftsSent: [],
      ownedFrames: ["cadre-ardoise", "cadre-diamant"],
    };

    const normalise = normaliserCosmetiques(brute);
    expect(normalise.equippedFrame).toBe("cadre-diamant");
    expect(normalise.ownedFrames).toContain("cadre-diamant");
    expect(normalise.giftsReceived).toHaveLength(1);
    expect(normalise.giftsReceived?.[0]?.gems).toBe(50);
    expect(normalise.giftsReceived?.[0]?.senderDisplayName).toBe("Mathias");
  });

  it("gère une structure vide de cosmétiques avec des valeurs par défaut sûres", () => {
    const normalise = normaliserCosmetiques(null);
    expect(normalise.equippedFrame).toBeNull();
    expect(normalise.ownedFrames).toEqual([]);
    expect(normalise.giftsReceived).toEqual([]);
    expect(normalise.giftsSent).toEqual([]);
    expect(normalise.customItems).toEqual([]);
  });
});

describe("Quizzly Synthèse Pédagogique", () => {
  it("contient un corpus riche de fiches de révision", () => {
    expect(FICHES_SYNTHESE.length).toBeGreaterThanOrEqual(10);
  });

  it("chaque fiche contient les éléments pédagogiques indispensables", () => {
    for (const fiche of FICHES_SYNTHESE) {
      expect(fiche.id).toBeTruthy();
      expect(fiche.title).toBeTruthy();
      expect(fiche.subjectId).toBeTruthy();
      expect(fiche.subjectLabel).toBeTruthy();
      expect(fiche.summary).toBeTruthy();
      expect(fiche.keyPoints.length).toBeGreaterThan(0);
      expect(fiche.commonMistakes.length).toBeGreaterThan(0);
      expect(fiche.schoolYears.length).toBeGreaterThan(0);
    }
  });

  it("couvre différentes matières dont maths, svt, histoire et français", () => {
    const matieres = new Set(FICHES_SYNTHESE.map((f) => f.subjectId));
    expect(matieres.has("mathematiques")).toBe(true);
    expect(matieres.has("svt")).toBe(true);
    expect(matieres.has("histoire-geographie")).toBe(true);
    expect(matieres.has("francais")).toBe(true);
  });
});

describe("Quizzly Préchargement & Correction", () => {
  it("corrige fidèlement une question unique pour le préchargement", async () => {
    const { corrigerQuestion } = await import("@/lib/quizzly/grade");
    const question = {
      correctAnswers: [1],
      explanation: "Paris est la capitale de la France.",
      id: "q1",
      options: ["Lyon", "Paris", "Marseille", "Bordeaux"],
      question: "Quelle est la capitale de la France ?",
      type: "single_choice" as const,
    };

    const juste = corrigerQuestion(question, [1]);
    expect(juste.correct).toBe(true);
    expect(juste.expectedIndexes).toEqual([1]);
    expect(juste.explanation).toBe("Paris est la capitale de la France.");

    const faux = corrigerQuestion(question, [0]);
    expect(faux.correct).toBe(false);
    expect(faux.expectedIndexes).toEqual([1]);
    expect(faux.givenIndexes).toEqual([0]);
  });
});
