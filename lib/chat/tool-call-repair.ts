// La réparation est partagée avec l'Agent (`lib/agent/tool-call-repair.ts`).
// Un petit modèle produit souvent un JSON presque valide ou un nom inventé.
// Un second appel modèle réintroduirait `tool_choice` ou un coût inutile.

export {
  repairAgentToolCall as repairChatToolCall,
  repairToolInputJson,
} from "@/lib/agent/tool-call-repair";
