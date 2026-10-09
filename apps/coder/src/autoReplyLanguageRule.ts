export const AUTO_REPLY_LANGUAGE_RULE_ID = "__auto-reply-language__";

/**
 * Règle système : l'agent doit répondre dans la langue principale du prompt utilisateur,
 * et non dans une langue figée par l'interface.
 * Par défaut l'interface est en français, mais la sortie suit la langue du dernier message utilisateur.
 */

function buildRuleName(): string {
  return "Langue : suivre le prompt utilisateur";
}

function buildRuleContent(): string {
  return [
    "Répondez toujours dans la langue principale du prompt utilisateur (détectez la langue du dernier message utilisateur).",
    "Appliquez cette langue à toutes vos sorties en langage naturel, y compris :",
    "- la réponse finale destinée à l'utilisateur ;",
    "- les réflexions internes et tokens de pensée (thinking / reasoning) ;",
    "- les champs en langage naturel dans les arguments d'outils (ex: prompt TaskCreate, message TaskUpdate, questions et options ask_plan_question, invites request_user_input) ;",
    "- les commentaires dans le code adressés à l'utilisateur.",
    "Conservez les termes techniques tels quels (chemins de fichiers, options CLI, identifiants, noms de bibliothèques / frameworks / outils, logs ou erreurs copiés), même lorsque la phrase environnante est dans une autre langue.",
    "Si la langue du prompt est indéterminée ou mixte, utilisez le français par défaut.",
    "Ne changez de langue que si l'utilisateur le fait ou le demande explicitement dans le tour en cours.",
  ].join("\n");
}

export function createAutoReplyLanguageRule(
  _locale?: string,
  _uiLocale?: unknown
): {
  id: string;
  name: string;
  content: string;
  scope: "always";
  enabled: true;
} {
  return {
    content: buildRuleContent(),
    enabled: true,
    id: AUTO_REPLY_LANGUAGE_RULE_ID,
    name: buildRuleName(),
    scope: "always",
  };
}

export function buildAutoReplyLanguageRuleBlock(
  _locale?: string,
  _uiLocale?: unknown
): string {
  const rule = createAutoReplyLanguageRule();
  return `#### Rule: ${rule.name}\n${rule.content}`;
}
