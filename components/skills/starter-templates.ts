import { CpuIcon } from "@mdevs/icons";
import { TOOL_IDS, TOOLS_META } from "@/lib/ai/tools/config";

export const AVAILABLE_TOOLS = [
  ...TOOL_IDS.map((id) => ({
    description: TOOLS_META[id].description,
    icon: TOOLS_META[id].icon as any,
    id,
    label: TOOLS_META[id].label,
  })),
  {
    description: "Autoriser l'utilisation de tous les serveurs MCP configurés",
    icon: CpuIcon as any,
    id: "mcp",
    label: "Outils MCP",
  },
];

export const STARTER_TEMPLATES = [
  {
    color: "#6366f1",
    description:
      "Expert en analyse de code TypeScript, architecture et bonnes pratiques",
    icon: "cpu",
    instructions:
      "Tu es un architecte logiciel expert en TypeScript, Next.js et design patterns. Analyse le code soumis, propose des refactorisations propres, typées rigoureusement et sans régression.",
    name: "Architecte TypeScript",
    tags: ["Dev", "Code", "TypeScript"],
    tools: ["codeExecution", "createDocument"],
  },
  {
    color: "#06b6d4",
    description:
      "Recherche en profondeur sur internet et rédaction de rapports détaillés",
    icon: "globe",
    instructions:
      "Tu es un analyste chercheur web. Pour chaque question, effectue des recherches approfondies, vérifie les sources récentes et synthétise les informations de manière claire et factuelle.",
    name: "Chercheur Web & Synthèse",
    tags: ["Recherche", "Veille"],
    tools: ["webSearch", "createDocument"],
  },
  {
    color: "#10b981",
    description:
      "Rédaction de contenu percutant, articles de blog, newsletters et copywriting",
    icon: "sparkles",
    instructions:
      "Tu es un copywriter de haut niveau. Adopte un ton engageant, dynamique et structuré. Utilise des accroches fortes et adapte le niveau de langage à la cible demandée.",
    name: "Copywriter & Rédaction",
    tags: ["Marketing", "Rédaction"],
    tools: ["createDocument"],
  },
];

export interface SkillParameter {
  name: string;
  description: string;
  required: boolean;
  type?: string;
  defaultValue?: string;
  enumValues?: string[];
}
