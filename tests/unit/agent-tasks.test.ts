import { describe, expect, it } from "vitest";
import { applyPlanProgress } from "@/lib/agent/plan";
import { tasksToPlan } from "@/lib/agent/tools/internal/tasks";

describe("outil tasks", () => {
  it("transforme une mise à jour en plan remplaçable et conserve les détails", () => {
    const plan = tasksToPlan({
      tasks: [
        {
          description: "Rassembler les informations disponibles.",
          title: "Rechercher les sources",
        },
        {
          title: "Rédiger la synthèse",
        },
      ],
      title: "Nouvelle liste",
    });

    expect(plan.title).toBe("Nouvelle liste");
    expect(plan.items).toHaveLength(2);
    expect(plan.items[0]).toMatchObject({
      description: "Rassembler les informations disponibles.",
      id: "task-1",
      label: "Rechercher les sources",
      status: "pending",
    });
    expect(plan.items[1]?.description).toBeUndefined();
  });

  it("ne marque pas toutes les tâches lorsqu'une étape n'a pas de titre", () => {
    const plan = tasksToPlan({
      tasks: [
        { title: "Rechercher les sources" },
        { title: "Rédiger la synthèse" },
      ],
    });

    expect(
      applyPlanProgress({ plan, status: "completed", title: "  " }).items
    ).toEqual(plan.items);
  });
});
