import {
  effectiveTools,
  hasTool,
  type PromptCapabilities,
  type PromptToolDescriptor,
} from "@/lib/prompts/capabilities";

// Sections conditionnelles du prompt système. Chaque fonction renvoie `null`
// quand la capacité correspondante est absente : l'appelant filtre, et le
// prompt final ne contient que ce qui est réellement possible pour la requête.
//
// Aucun test ne doit avoir à deviner si une section existe : elle est Pilotée
// par le contrat de capacités, lui-même rempli par l'état réel du run.

const NO_TOOLS_NOTICE =
  "OUTILS — Tu n'as aucun outil dans cet échange. Réponds avec ton texte, et indique clairement ce qui te manque pour aller plus loin si la demande l'exige.";

function describeTool(tool: PromptToolDescriptor): string {
  return `- ${tool.id} (${tool.label}) : ${tool.description}`;
}

export function toolsSection(input: PromptCapabilities): string | null {
  const tools = effectiveTools(input);
  if (tools.length === 0) {
    return NO_TOOLS_NOTICE;
  }
  return [
    `OUTILS DISPONIBLES — ${tools.length} outil${tools.length > 1 ? "s" : ""} activé${tools.length > 1 ? "s" : ""} pour cet échange. Appelle-les avec leur identifiant exact, dès que la demande s'y prête, sans demander la permission.`,
    ...tools.map(describeTool),
  ].join("\n");
}

export function memorySection(input: PromptCapabilities): string | null {
  const memory = input.memory;
  if (!memory) {
    return null;
  }
  const writable = hasTool(input, "manage_memory") || hasTool(input, "memory");
  const lines = [
    "MÉMOIRE — Informations déjà retenues sur l'utilisateur, injectées ci-dessous. Utilise-les pour personnaliser tes réponses, sans les répéter mot pour mot.",
  ];
  if (memory.block) {
    lines.push(memory.block);
  } else {
    lines.push("Aucun élément retenu pour l'instant.");
  }
  if (writable && memory.writable) {
    lines.push(
      "Tu peux compléter cette mémoire quand l'utilisateur te demande de retenir une information durable, ou te corrige sur un fait personnel."
    );
  } else if (writable && !memory.writable) {
    lines.push(
      "La limite d'enregistrement de la mémoire est atteinte pour ce forfait : ne promets pas d'enregistrer, indique à l'utilisateur qu'elle est pleine."
    );
  }
  return lines.join("\n");
}

export function tasksSection(input: PromptCapabilities): string | null {
  if (!hasTool(input, "tasks")) {
    return null;
  }
  return [
    "OUTIL DE TÂCHES — L'utilisateur a activé l'option Tâches pour cet échange.",
    "Appelle `tasks` EN PREMIER, avant tout autre outil et avant d'écrire la moindre réponse : il structure un plan de 2 à 8 tâches ordonnées, chacune avec un intitulé court et un résultat attendu.",
    "Ce plan est affiché tel quel à l'utilisateur : il sert de contrat de progression, pas de brouillon. Exécute-le ensuite étape par étape sans attendre de validation, et termine toujours par une réponse textuelle.",
  ].join("\n");
}

export function planSection(input: PromptCapabilities): string | null {
  const plan = input.plan;
  if (!plan) {
    return null;
  }
  return [
    `PLAN DE TRAVAIL (« ${plan.title} ») — préparé pour cette tâche, ce n'est pas l'utilisateur qui l'a écrit.`,
    ...plan.items.map(
      (item, index) =>
        `${index + 1}. ${item.label}${item.description ? ` — ${item.description}` : ""}`
    ),
    "Suis ce plan, ajuste-le si les résultats l'exigent, et indique brièvement où tu en es. Ne le réécris pas.",
  ].join("\n");
}

export function attachmentsSection(input: PromptCapabilities): string | null {
  if (input.attachments <= 0) {
    return null;
  }
  return [
    `PIÈCES JOINTES — ${input.attachments} pièce${input.attachments > 1 ? "s" : ""} jointe${input.attachments > 1 ? "s" : ""} à ce message. Leur contenu est déjà présent ci-dessus : ne redemandes pas le fichier et n'invente jamais une partie que tu n'as pas lue.`,
  ].join("\n");
}

export function extensionsSection(input: PromptCapabilities): string | null {
  const extensions = effectiveTools(input).filter(
    (tool) => tool.kind !== "native"
  );
  if (extensions.length === 0) {
    return null;
  }
  return [
    "EXTENSIONS — Des outils externes (serveurs MCP, plugins) sont branchés sur cet échange. Ils peuvent échouer indépendamment du reste : lis leur erreur, n'invente jamais leur résultat, et dis à l'utilisateur quand la ressource est inaccessible.",
    ...extensions.map(describeTool),
  ].join("\n");
}

export function reasoningSection(input: PromptCapabilities): string | null {
  if (!input.reasoning) {
    return null;
  }
  return "RAISONNEMENT — Tu peux produire un raisonnement avant de répondre. Expose uniquement des actions, des choix et des résultats : jamais un monologue intérieur.";
}

export function askUserSection(input: PromptCapabilities): string | null {
  if (!hasTool(input, "ask_user") && !hasTool(input, "askUser")) {
    return null;
  }
  return "QUESTIONS — Si une information indispensable manque et qu'aucune hypothèse raisonnable n'est possible, pose une question précise avec l'outil dédié plutôt que d'inventer. Le run attend alors la réponse de l'utilisateur avant de reprendre.";
}
