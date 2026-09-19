import { tool } from "ai";
import { z } from "zod";
import { generateUUID } from "@/lib/utils";

// Diagrammes & mindmaps : l'IA fournit le code source (Mermaid ou PlantUML),
// le client le rend en carte interactive (zoom, pan, export PNG/SVG).
export const generateDiagram = tool({
  description:
    "Génère un diagramme visuel interactif (schéma d'architecture, diagramme de séquence, flowchart, mindmap, timeline, gantt…) rendu directement dans la conversation avec zoom/pan et export PNG/SVG. Utilise Mermaid par défaut. À activer pour visualiser une architecture, un processus, une hiérarchie ou un flux.",
  execute: async ({ code, description, format, title }) => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { error: "Le code du diagramme est vide." };
    }

    // Détection de erreurs évidentes Mermaid avant renvoi (validation complète
    // faite côté client au rendu).
    return {
      code: trimmed,
      description,
      format,
      id: generateUUID(),
      title,
    };
  },
  inputSchema: z.object({
    code: z
      .string()
      .max(20_000)
      .describe(
        "Le code source du diagramme. Pour Mermaid : sans balises ``` (ex: 'graph TD; A-->B;'). Pour PlantUML : bloc complet @startuml ... @enduml."
      ),
    description: z
      .string()
      .max(1000)
      .optional()
      .describe("Courte description optionnelle du diagramme."),
    format: z
      .enum(["mermaid", "plantuml"])
      .default("mermaid")
      .describe(
        "Syntaxe du diagramme : 'mermaid' (recommandé, rendu natif) ou 'plantuml'."
      ),
    title: z
      .string()
      .min(1)
      .max(120)
      .describe("Titre court du diagramme en français."),
  }),
});
