/** Wizard /create-subagent : guide la création de la description de rôle Subagent */

import type { AppLocale } from "../src/i18n/types.js";

export type SubagentCreatorScope = "user" | "project";

export function formatSubagentCreatorUserBubble(
  scope: SubagentCreatorScope,
  _lang: AppLocale,
  userNote: string
): string {
  const head =
    scope === "project"
      ? "[Créer un Sous-agent · Ce projet]"
      : "[Créer un Sous-agent · Tous les projets]";
  const body = userNote.trim();
  return body ? `${head}\n${body}` : head;
}

export function buildSubagentCreatorSystemAppend(
  scope: SubagentCreatorScope,
  _lang: AppLocale,
  workspaceRoot: string | null
): string {
  const scopeBlock =
    scope === "project"
      ? `**Cible : ce projet.** Privilégiez l'ajout du sous-agent dans le fichier **.mai/agent.json** du workspace ou les paramètres de projet. Racine du workspace : \`${workspaceRoot ?? "(aucun)"}\`.`
      : "**Cible : tous les projets (global / utilisateur).** Décrivez comment ajouter le sous-agent via mAI Coder **Paramètres → Agent → Subagents**.";

  const toolBlock = `**Mode d'exécution :** Ce tour s'exécute en mode **Agent** avec les outils \`Write\` et \`Edit\`.
- Si un espace de travail est ouvert, vous **devez** persister le sous-agent en modifiant les fichiers projet (ex: dans \`.mai/agent.json\`). Ne donnez pas seulement du JSON à copier ; utilisez les outils.
- Si la portée est globale sans espace de travail ouvert, indiquez les étapes d'ajout manuel.`;

  const core = `Vous êtes l'assistant de **création de Sous-agent** pour mAI Coder. Les notes de l'utilisateur figurent après la balise de portée.

${toolBlock}

Votre mission :
1. Clarifiez le rôle, les déclencheurs de délégation, les limites et la mémoire persistante si nécessaire.
2. Si la mémoire persistante est utile, choisissez le \`memoryScope\` (\`user\` / \`project\` / \`local\`).
3. Lorsque l'espace de travail est ouvert, **appliquez** la spécification du sous-agent (nom, description, instructions, memoryScope) dans les fichiers appropriés avec les outils.
4. Concluez par une courte explication sur la portée d'effet dans mAI Coder.

${scopeBlock}`;

  return `### mAI Coder · Créateur de Sous-agents (intégré)\n\n${core}`;
}
