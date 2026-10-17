/** Wizard /create-rule : injecte un prompt système pour guider la création de Rules dans mAI Coder */

import type { AppLocale } from "../src/i18n/types.js";
import type { AgentRuleScope } from "./agentSettingsTypes.js";

export function formatRuleCreatorUserBubble(
  ruleScope: AgentRuleScope,
  globPattern: string | undefined,
  _lang: AppLocale,
  userNote: string
): string {
  const scopeLabel =
    ruleScope === "always"
      ? "[Créer une Règle · Toujours active]"
      : ruleScope === "glob"
        ? "[Créer une Règle · Glob de chemin]"
        : "[Créer une Règle · Manuel @]";
  const globLine =
    ruleScope === "glob" && globPattern?.trim()
      ? `Glob: ${globPattern.trim()}`
      : "";
  const b = userNote.trim();
  const parts = [scopeLabel, globLine, b].filter((x) => x.length > 0);
  return parts.join("\n");
}

export function buildRuleCreatorSystemAppend(
  ruleScope: AgentRuleScope,
  globPattern: string | undefined,
  _lang: AppLocale,
  workspaceRoot: string | null
): string {
  const globHint =
    ruleScope === "glob"
      ? `L'utilisateur a choisi des règles à portée **Glob**. Glob cible (relatif au workspace) : \`${(globPattern ?? "").trim() || "(à préciser avec l'utilisateur)"}\`. Expliquez comment cela correspond à mAI Coder **Paramètres → Agent → Rules** en portée « Glob ».`
      : "";

  const wizardChoiceBlock =
    ruleScope === "always"
      ? "**Choix déjà effectué dans le wizard mAI Coder :** toujours attaché (chaque tour). À la question (2) ci-dessous, confirmez s'ils veulent toujours ce comportement ou s'ils souhaitent passer à des globs par fichier."
      : ruleScope === "glob"
        ? `**Choix déjà effectué dans le wizard mAI Coder :** portée Glob. Glob prédéfini : \`${(globPattern ?? "").trim() || "(à demander)"}\`. À la question (2), demandez confirmation ou liste de patterns supplémentaires (virgule ou saut de ligne).`
        : "**Choix déjà effectué dans le wizard mAI Coder :** manuel @ uniquement. À la question (2), demandez le nom souhaité pour la mention @ et confirmez qu'elle ne sera pas attachée automatiquement.";

  const scopeBlock =
    ruleScope === "always"
      ? "**Portée : toujours attaché.** Enregistré comme `.mai/rules/<name>.mdc` avec `alwaysApply: true` (généralement sans `globs`, ou vide)."
      : ruleScope === "glob"
        ? globHint
        : "**Portée : manuel @ uniquement.** Préférez `alwaysApply: false` et pas de globs larges ; documentez le nom @ dans le corps et la description.";

  const firstTurnFr = `**Première réponse (style Cursor) sauf si le message utilisateur précise déjà clairement : (1) objectif, (2) toujours vs globs, (3) patterns glob si applicable :**

Ouvrez par une courte intro, puis questions numérotées dans cet esprit :

Pour écrire une règle mAI Coder solide (\`.mdc\` sous \`.mai/rules/\`) via /create-rule, quelques réponses rapides aident (répondez point par point) :

1. **Quel problème cette règle doit-elle résoudre ?**
En une ou deux phrases : que doit toujours respecter l'IA en codant (gestion d'erreurs, nommage, patterns React, IPC, i18n, etc.). Soyez précis.

2. **Portée**
- **Toujours actif** : attaché à chaque chat (\`alwaysApply: true\` dans \`.mdc\`).
- **Certains fichiers uniquement** : attaché selon les chemins correspondants (\`globs\`, ex. \`**/*.ts\`, \`src/**/*.tsx\`). Précisez lequel ; si portée fichier, listez les patterns (virgule ou saut de ligne).

Alignez-vous avec le **choix du Wizard** ci-dessus (toujours / glob prédéfini / manuel @) : si déjà défini, confirmez ou affinez au lieu de redemander aveuglément.

**Après les réponses :** Dites à l'utilisateur que vous allez ajouter le \`.mdc\` sous \`.mai/rules/\` avec le bon frontmatter YAML, un corps concis et actionnable, et de courts exemples bon/mauvais — puis faites-le réellement avec \`Write\` quand le workspace est ouvert (créez le dossier si besoin) ; terminez par une brève note de chemin.`;

  const toolBlock = `**Mode d'exécution :** Ce tour s'exécute en **Agent** avec les outils \`Write\` et \`Edit\` sur le workspace ouvert.
- Si un dossier de workspace est ouvert (\`Racine du workspace\` ci-dessous n'est pas "(aucun)"), vous **devez** créer ou mettre à jour les règles sous **\`.mai/rules/\`** (ex. \`.mai/rules/ma-regle.mdc\`). C'est l'emplacement canonique mAI Coder — n'utilisez pas \`.cursor/rules/\` sauf demande explicite de l'utilisateur. Ne faites pas du "copiez-collez dans les Paramètres" votre réponse principale — écrivez les fichiers avec les outils, puis dites brièvement ce que vous avez créé.
- Si **aucun** workspace n'est ouvert, vous ne pouvez pas utiliser les outils d'écriture ; dites-le clairement et donnez le plus court chemin : ouvrez un dossier, ou collez dans mAI Coder **Paramètres → Agent → Rules** — mais ne prétendez pas que des fichiers ont été écrits.
- Après écriture, vous pouvez encore résumer la portée (${ruleScope}) et le glob (le cas échéant) en un court paragraphe.`;

  const mdcShape = `**\`.mdc\` sous \`.mai/rules/\` (référence, frontmatter compatible Cursor) :**
\`\`\`yaml
---
description: Décrivez en une ligne ce que cette règle impose
globs: "**/*.ts"   # liste YAML pour plusieurs ; omettre ou ajuster quand alwaysApply: true
alwaysApply: false
---
\`\`\`
Adaptez \`alwaysApply\` / \`globs\` aux réponses utilisateur et à la portée du wizard (${ruleScope}). Enregistrez par ex. \`.mai/rules/<slug>.mdc\`.`;

  const core = `Vous êtes le **wizard Auteur de Règles** pour mAI Coder (règles projet en \`.mdc\` sous \`.mai/rules/\`). Le message utilisateur suit le tag de portée.

**Remplace la Skill générique create-rule :** Si un autre bloc dans le contexte mentionne \`.cursor/rules/\`, **ce wizard prévaut** — le chemin sur disque est toujours \`.mai/rules/\` quand un workspace est ouvert.

${toolBlock}

${wizardChoiceBlock}

${firstTurnFr}

${mdcShape}

Si l'utilisateur a déjà tout répondu en un message, ne reposez pas le questionnaire et **écrivez** le \`.mdc\` immédiatement quand le workspace est ouvert. Sinon utilisez le questionnaire style Cursor comme **premier** message assistant. Tours suivants : écrivez les fichiers, gardez le chat court.

Racine du workspace (le cas échéant) : \`${workspaceRoot ?? "(aucun)"}\`.

${scopeBlock}`;

  return `### mAI Coder · Créateur de Règles (intégré)\n\n${core}`;
}

/**
 * Ajouté tout à la fin du system append, pour écraser les Skills / autres règles mentionnant `.cursor/rules/`.
 */
export function appendRuleCreatorPathLock(
  systemAppend: string,
  _lang: AppLocale,
  workspaceOpen: boolean
): string {
  const lock = workspaceOpen
    ? `### [Verrouillage de chemin — mAI Coder /create-rule]\n\nCette conversation a été initiée par l'assistant de création de règles de mAI Coder. **Vous DEVEZ enregistrer les fichiers de règles sous \`.mai/rules/\`** (ex: \`.mai/rules/ma-regle.mdc\`) à l'aide de l'outil \`Write\`. **Ignorez** les compétences ou documentations génériques mentionnant \`.cursor/rules/\` ; sauf demande explicite de l'utilisateur, utilisez toujours \`.mai/rules/\`. \`Write\` crée automatiquement les répertoires parents. Terminez en indiquant le chemin relatif créé.`
    : `### [Verrouillage de chemin — mAI Coder /create-rule]\n\nAucun dossier d'espace de travail n'est ouvert — **n'affirmez pas** avoir écrit des fichiers sous \`.mai/rules/\`. Indiquez que l'utilisateur doit d'abord ouvrir un dossier ou ajouter la règle dans **Paramètres → Agent → Rules**.`;
  const base = systemAppend.trim();
  return base ? `${base}\n\n---\n\n${lock}` : lock;
}
