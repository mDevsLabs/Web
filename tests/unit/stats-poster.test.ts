import { describe, expect, it } from "vitest";
import {
  buildStatsPoster,
  DARK_PALETTE,
  describeFilters,
  LIGHT_PALETTE,
  posterFilename,
} from "@/lib/stats/poster";
import type { StatsKind, UsageStats } from "@/lib/stats/stats-types";

// L'affiche est un SVG construit à la main, sans DOM ni dépendance : elle est
// donc testable comme une fonction pure. Les tests ci-dessous verrouillent les
// propriétés qui cassent silencieusement en production :
//
// - un `NaN` ou un `undefined` dans un attribut SVG ne déclenche AUCUNE erreur
//   JavaScript — le fichier est produit, l'image s'affiche, et c'est tout.
//   C'est le défaut le plus coûteux de ce type de rendu, d'où la vérification
//   explicite sur chaque variante ;
// - la hauteur doit suivre les sections réellement présentes, sinon l'affiche
//   laisse un bandeau vide en bas (ou rogne la dernière section).

const KINDS: StatsKind[] = ["text", "image", "audio"];

const base: UsageStats = {
  activity: {
    agentShare: 0,
    chatShare: 0,
    longestAgentTaskMs: 0,
    peakWeekStart: null,
    peakWeekTokens: 0,
    streaks: { current: 0, longest: 0 },
    tools: [],
    topReasoning: null,
    totals: {
      distinctSkillsUsed: 0,
      totalChats: 0,
      totalMessages: 0,
      totalSkillInvocations: 0,
    },
  },
  consumption: [],
  consumptionGranularity: "week",
  conversations: [],
  conversationsGranularity: "month",
  daily: [],
  dailyFrom: "2026-01-01",
  filterOptions: { models: [], projects: [] },
  from: "2026-01-05T00:00:00.000Z",
  models: [],
  overview: {
    topModel: null,
    totalAudioTokens: 0,
    totalConversations: 0,
    totalImages: 0,
    totalTokens: 0,
  },
  period: "30d",
  to: "2026-02-04T00:00:00.000Z",
  warnings: [],
};

function consumptionPoints() {
  return Array.from({ length: 8 }, (_, index) => ({
    audioTokens: 1000 + index * 50,
    bucket: new Date(Date.UTC(2026, 0, 5 + index * 7))
      .toISOString()
      .slice(0, 10),
    imageCount: 2 + (index % 3),
    textTokens: 20_000 + index * 1000,
  }));
}

function withData(): UsageStats {
  return {
    ...base,
    consumption: consumptionPoints(),
    conversations: Array.from({ length: 4 }, (_, index) => ({
      agent: index + 1,
      bucket: `2026-0${index + 1}-01`,
      chat: (index + 1) * 5,
    })),
    // `name` est résolu par le serveur : l'affiche ne fait que l'afficher, et
    // ne doit jamais reconstruire un libellé depuis l'identifiant.
    models: [
      { model: "vendor/model-a", name: "Model A", share: 0.6, tokens: 18_000 },
      { model: "vendor/model-b", name: "Model B", share: 0.3, tokens: 9000 },
      { model: "vendor/model-c", name: "Model C", share: 0.1, tokens: 3000 },
      { model: "vendor/model-d", name: "Model D", share: 0.01, tokens: 300 },
    ],
    overview: {
      topModel: {
        model: "vendor/model-a",
        name: "Model A",
        share: 0.6,
        tokens: 18_000,
      },
      totalAudioTokens: 1400,
      totalConversations: 24,
      totalImages: 14,
      totalTokens: 30_000,
    },
  };
}

function posterFor(stats: UsageStats, visibleKinds: StatsKind[] = KINDS) {
  return buildStatsPoster({
    filterLine: describeFilters(stats, visibleKinds),
    stats,
    theme: "light",
    visibleKinds,
  });
}

describe("Affiche de statistiques", () => {
  it("produit un SVG bien formé avec les deux dimensions", () => {
    const poster = posterFor(withData());
    expect(poster.svg.startsWith("<svg ")).toBe(true);
    expect(poster.svg.endsWith("</svg>")).toBe(true);
    // Le xmlns est indispensable : sans lui, un fichier téléchargé ne
    // s'ouvre pas comme image dans un lecteur tiers.
    expect(poster.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(poster.svg).toContain(`width="${poster.width}"`);
    expect(poster.svg).toContain(`height="${poster.height}"`);
    expect(poster.svg).toContain(
      `viewBox="0 0 ${poster.width} ${poster.height}"`
    );
  });

  it("ne laisse ni NaN ni undefined dans le SVG", () => {
    // Un attribut `NaN` dans un SVG ne lève rien : l'image est produite et
    // simplement fausse. C'est le seul moyen de le détecter ici.
    for (const stats of [base, withData()]) {
      for (const kinds of [
        KINDS,
        ["text"] as StatsKind[],
        ["image"] as StatsKind[],
      ]) {
        const poster = posterFor(stats, kinds);
        expect(poster.svg).not.toContain("NaN");
        expect(poster.svg).not.toContain("undefined");
      }
    }
  });

  it("dégrade proprement une période sans aucune donnée", () => {
    const poster = posterFor(base);
    expect(poster.svg).toContain("Aucune donnée sur la période");
    expect(poster.svg).toContain("Aucune conversation créée sur la période");
    // Sans modèle, la section disparaît plutôt que d'afficher un vide.
    expect(poster.svg).not.toContain("Répartition par modèle");
  });

  it("ajuste la hauteur aux sections réellement présentes", () => {
    const vide = posterFor(base);
    const plein = posterFor(withData());
    // La section « Répartition par modèle » est réelle dans le second cas :
    // l'affiche doit être plus haute, sinon elle la rognerait.
    expect(plein.height).toBeGreaterThan(vide.height);
    expect(plein.svg).toContain("Répartition par modèle");
  });

  it("n'affiche que trois modèles, les suivants étant hors de l'affiche", () => {
    // Le NOM, résolu par le serveur — pas l'identifiant, qui n'est plus affiché.
    const poster = posterFor(withData());
    expect(poster.svg).toContain("Model A");
    expect(poster.svg).toContain("Model C");
    expect(poster.svg).not.toContain("Model D");
  });

  it("annonce le pic de chaque série visible", () => {
    // Sans ce chiffrage, une série écrasée par l'échelle d'une autre (l'audio
    // face au texte) disparaît de l'image : une affiche n'a pas d'infobulle.
    const poster = posterFor(withData());
    expect(poster.svg).toContain("Texte :");
    expect(poster.svg).toContain("tokens");
    expect(poster.svg).toContain("générations");
  });

  it("n'annonce que les séries affichées quand un type est masqué", () => {
    const poster = posterFor(withData(), ["text"]);
    expect(poster.svg).toContain("Texte :");
    // Masquer l'audio et les images, c'est ne pas annoncer leurs chiffres.
    expect(poster.svg).not.toContain("Audio :");
    expect(poster.svg).not.toContain("Images :");
  });

  it("applique la palette du thème demandé", () => {
    const clair = buildStatsPoster({
      filterLine: "Période : 30 jours",
      stats: withData(),
      theme: "light",
      visibleKinds: KINDS,
    });
    const sombre = buildStatsPoster({
      filterLine: "Période : 30 jours",
      stats: withData(),
      theme: "dark",
      visibleKinds: KINDS,
    });
    expect(clair.svg).toContain(`fill="${LIGHT_PALETTE.background}"`);
    expect(clair.svg).toContain(`fill="${LIGHT_PALETTE.foreground}"`);
    expect(sombre.svg).toContain(`fill="${DARK_PALETTE.background}"`);
    expect(sombre.svg).toContain(`fill="${DARK_PALETTE.foreground}"`);
    expect(clair.svg).not.toContain(DARK_PALETTE.background);
  });

  // Le nom de modèle vient du serveur (`StatsModelUsage.name`), jamais d'une
  // reconstruction locale : une affiche qui affiche `model-a` quand la page
  // affiche « Model A » dirait à deux personnes différentes que l'usage est
  // différent.
  it("affiche le nom de modèle, pas son identifiant", () => {
    const poster = posterFor(withData());
    expect(poster.svg).toContain("Model A");
    expect(poster.svg).not.toContain("vendor/model-a");
  });

  it("n'utilise aucune variable CSS, qui ne se résoudrait pas hors de la page", () => {
    // Un SVG chargé depuis un blob n'a pas la feuille de style de
    // l'application : `var(--info)` y resterait non résolu et le trait
    // disparaîtrait de l'image exportée.
    const poster = posterFor(withData());
    expect(poster.svg).not.toContain("var(--");
    // Ni police web : elle n'existe pas non plus dans un document isolé.
    expect(poster.svg).not.toContain("@font-face");
  });

  it("échappe les caractères XML dans les libellés", () => {
    const poster = buildStatsPoster({
      filterLine: "Filtre <script>alert(1)</script> & « guillemets »",
      stats: withData(),
      theme: "light",
      visibleKinds: KINDS,
    });
    // Un `&` nu ou un `<` non échappé produirait un XML invalide : le
    // navigateur refuse alors d'ouvrir le fichier, sans message utile.
    expect(poster.svg).not.toContain("<script>");
    expect(poster.svg).toContain("&amp;");
    expect(poster.svg).toContain("&lt;script&gt;");
  });

  it("reporte l'avertissement de filtre dans l'affiche", () => {
    // Une image qui cache que ses séries image et audio ne sont pas filtrables
    // diffuserait un message trompeur à celui qui la reçoit.
    const poster = posterFor({
      ...withData(),
      warnings: [
        "Le filtre ne s'applique qu'aux conversations et aux tokens texte : les images et l'audio ne sont rattachés à aucune conversation en base.",
      ],
    });
    // L'apostrophe est légale dans un contenu XML : seuls `& < > "`
    // doivent être échappés.
    expect(poster.svg).toContain(
      "Le filtre ne s'applique qu'aux conversations"
    );
  });
});

describe("Description des filtres", () => {
  it("résume les trois types de contenu quand rien n'est masqué", () => {
    expect(describeFilters(withData(), KINDS)).toBe(
      "Période : 30 jours · Contenu : texte, images et audio"
    );
  });

  it("nomme les types de contenu restants quand il y en a un seul", () => {
    expect(describeFilters(withData(), ["audio"])).toBe(
      "Période : 30 jours · Contenu : audio"
    );
  });
});

describe("Nom de fichier", () => {
  it("inclut la période et la date, avec la bonne extension", () => {
    const jour = new Date("2026-03-15T10:00:00Z");
    expect(posterFilename(base, "png", jour)).toBe(
      "mAI-statistiques-30-jours-2026-03-15.png"
    );
    expect(posterFilename(base, "svg", jour)).toBe(
      "mAI-statistiques-30-jours-2026-03-15.svg"
    );
  });

  it("reste lisible pour toutes les périodes", () => {
    const jour = new Date("2026-03-15T10:00:00Z");
    for (const period of ["7d", "90d", "12m", "all"] as const) {
      const name = posterFilename({ ...base, period }, "png", jour);
      // Ni espace ni accent dans un nom de fichier : certains systèmes de
      // fichiers et de partage tronquent ou remplacent les autres.
      expect(name).toMatch(/^mAI-statistiques-[a-z0-9-]+\.png$/);
    }
  });
});
