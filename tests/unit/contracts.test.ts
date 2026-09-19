import { describe, expect, it } from "vitest";
import {
  approvalDecisionSchema,
  reorientationInstructionSchema,
  runIntentSchema,
  scheduleIntentSchema,
  scheduleMutationSchema,
  suggestedActionProposalsSchema,
  toolSelectionOutputSchema,
} from "@/lib/agent/contracts";

describe("Contrats structurés Agent", () => {
  it("accepte une intention de run valide", () => {
    const parsed = runIntentSchema.safeParse({
      kind: "run",
      modelId: "google/gemini-2.5-flash",
      task: "Prépare un rapport de veille",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejette une intention de run sans tâche", () => {
    const parsed = runIntentSchema.safeParse({
      kind: "run",
      modelId: "google/gemini-2.5-flash",
      task: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("valide une planification avec fuseau IANA et règle récurrente", () => {
    const parsed = scheduleIntentSchema.safeParse({
      instructions: "Cherche les news IA et résume.",
      kind: "schedule",
      modelId: "google/gemini-2.5-flash",
      rule: { frequency: "daily", kind: "recurring", time: "09:00" },
      timezone: "Europe/Paris",
      title: "Veille quotidienne",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejette un fuseau non IANA", () => {
    const parsed = scheduleIntentSchema.safeParse({
      instructions: "Résume.",
      kind: "schedule",
      modelId: "google/gemini-2.5-flash",
      rule: { kind: "once" },
      timezone: "Pas/Un Fuseau",
      title: "Veille",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejette une heure locale mal formée", () => {
    const parsed = scheduleIntentSchema.safeParse({
      instructions: "Résume.",
      kind: "schedule",
      modelId: "google/gemini-2.5-flash",
      rule: { frequency: "daily", kind: "recurring", time: "9h" },
      timezone: "Europe/Paris",
      title: "Veille",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejette une weekday sur une récurrence daily", () => {
    const parsed = scheduleIntentSchema.safeParse({
      instructions: "Résume.",
      kind: "schedule",
      modelId: "google/gemini-2.5-flash",
      rule: {
        frequency: "daily",
        kind: "recurring",
        time: "09:00",
        weekday: "monday",
      },
      timezone: "Europe/Paris",
      title: "Veille",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepte une mutation de mise à jour avec patch non vide", () => {
    const parsed = scheduleMutationSchema.safeParse({
      action: "update",
      patch: {
        rule: {
          frequency: "weekly",
          kind: "recurring",
          time: "18:30",
          weekday: "friday",
        },
        time: undefined,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejette une mutation update sans modification", () => {
    const parsed = scheduleMutationSchema.safeParse({
      action: "update",
      patch: {},
    });
    expect(parsed.success).toBe(false);
  });

  it("valide une instruction de réorientation avec arrêt demandé", () => {
    const parsed = reorientationInstructionSchema.safeParse({
      stopRequested: true,
      text: "Change de sujet, concentre-toi sur le Q3.",
    });
    expect(parsed.success).toBe(true);
  });

  it("valide une décision d'approbation de refus motivée", () => {
    const parsed = approvalDecisionSchema.safeParse({
      decision: "deny",
      reason: "Je ne veux pas de cet envoi.",
    });
    expect(parsed.success).toBe(true);
  });

  it("valide une sélection d'outils vide (aucune famille nécessaire)", () => {
    const parsed = toolSelectionOutputSchema.safeParse({ families: [] });
    expect(parsed.success).toBe(true);
  });

  it("rejette une sélection d'outils dépassant 6 familles", () => {
    const parsed = toolSelectionOutputSchema.safeParse({
      families: ["a", "b", "c", "d", "e", "f", "g"],
    });
    expect(parsed.success).toBe(false);
  });

  it("borne les actions suggérées à 3", () => {
    const parsed = suggestedActionProposalsSchema.safeParse({
      actions: [
        { id: "create_report", label: "Créer un rapport" },
        { id: "export_csv", label: "Exporter CSV" },
        { id: "more_research", label: "Poursuivre la recherche" },
        { id: "extra", label: "Quatrième" },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
