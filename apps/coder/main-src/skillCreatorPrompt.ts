import type { AppLocale } from "../src/i18n/types.js";

export type SkillCreatorScope = "user" | "project";

export function formatSkillCreatorUserBubble(
  scope: SkillCreatorScope,
  _lang: AppLocale,
  userNote: string
): string {
  const head =
    scope === "project"
      ? "[Créer un Skill · Ce projet]"
      : "[Créer un Skill · Tous les projets]";
  const b = userNote.trim();
  return b ? `${head}\n${b}` : head;
}

export function buildSkillCreatorSystemAppend(
  scope: SkillCreatorScope,
  _lang: AppLocale,
  workspaceRoot: string | null
): string {
  const scopeBlock =
    scope === "project"
      ? `**Portée cible : ce projet uniquement.** L'utilisateur a choisi de stocker le nouveau skill pour l'espace de travail actuel. Privilégiez la création ou mise à jour de fichiers sous \`.mai/skills/<slug>/SKILL.md\` (et mentionnez \`.mai/agent.json\` uniquement s'il doit aussi apparaître dans la liste des skills intégrés). Si aucun espace de travail n'est ouvert, n'affirmez pas que les fichiers ont été écrits. Racine du workspace : \`${workspaceRoot ?? "(aucun)"}\`.`
      : "**Portée cible : tous les projets (global / utilisateur).** L'utilisateur a choisi un skill s'appliquant à tous les dépôts. Décrivez l'enregistrement via mAI Coder **Paramètres → Rules / Skills** (liste globale), pas uniquement un seul dépôt. Vous pouvez aussi mentionner `~/.claude/skills/` si pertinent.";

  const toolBlock = `**Mode d'exécution :** Ce tour s'exécute en mode **Agent** avec les outils \`Write\` et \`Edit\` sur le projet ouvert.
- Si un espace de travail est ouvert, vous **devez** créer le skill sur le disque sous \`.mai/skills/<slug>/SKILL.md\` (et mettre à jour la liste dans \`.mai/agent.json\` via \`Edit\` si nécessaire). Ne demandez **pas** à l'utilisateur de copier-coller le fichier SKILL.md complet : écrivez-le avec les outils, puis résumez les chemins.
- Pour la portée **globale / tous projets** sans espace de travail ouvert, indiquez les étapes manuelles requises.
- La portée projet requiert un espace de travail.`;

  const core = `Vous êtes l'assistant de **création de Skill** pour mAI Coder. La demande libre de l'utilisateur figure dans son message (après la balise de portée).

${toolBlock}

Votre mission :
1. Confirmez brièvement votre compréhension ; ne posez des questions de clarification que si des informations bloquantes manquent (nom, conditions de déclenchement, étapes, format de sortie).
2. Lorsque l'espace de travail est ouvert, **écrivez** le fichier **SKILL.md** complet (frontmatter YAML avec au minimum \`name\` et \`description\`) à l'aide des outils.
3. Un court paragraphe expliquant comment l'invoquer dans mAI Coder (ex: \`./slug\`) après la création du fichier.

${scopeBlock}`;

  return `### mAI Coder · Créateur de Skills (intégré)\n\n${core}`;
}
