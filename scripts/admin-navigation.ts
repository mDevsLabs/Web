const commands = [
  {
    id: "1",
    label: "Réinitialiser les quotas API",
    group: "Quotas",
    aliases: ["api", "reset-api"],
  },
  {
    id: "2",
    label: "Réinitialiser les quotas mAI",
    group: "Quotas",
    aliases: ["mai", "tokens", "weekly"],
  },
  {
    id: "3",
    label: "Réinitialiser les quotas images",
    group: "Quotas",
    aliases: ["img", "image", "images"],
  },
  {
    id: "4",
    label: "Réinitialiser les quotas audio",
    group: "Quotas",
    aliases: ["audio", "speech", "voix"],
  },
  {
    id: "5",
    label: "Réinitialiser tous les quotas",
    group: "Quotas",
    aliases: ["all", "tout", "reset-all"],
  },
  {
    id: "6",
    label: "Codes d’abonnement",
    group: "Accès",
    aliases: ["codes", "code", "abonnement"],
  },
  {
    id: "7",
    label: "Comptes clients",
    group: "Accès",
    aliases: ["users", "clients", "comptes", "customers"],
  },
  {
    id: "8",
    label: "Studio newsletter",
    group: "Communication",
    aliases: ["news", "newsletter", "mail"],
  },
  {
    id: "9",
    label: "Notifications et actualités",
    group: "Communication",
    aliases: ["notif", "notifications", "broadcast"],
  },
  {
    id: "10",
    label: "Formulaires et sondages",
    group: "Communication",
    aliases: ["forms", "form", "sondages"],
  },
  {
    id: "11",
    label: "Catalogue des modèles",
    group: "Modèles",
    aliases: ["models", "modeles", "catalogue"],
  },
  {
    id: "12",
    label: "Synchroniser les modèles",
    group: "Modèles",
    aliases: ["sync", "cron", "update-models"],
  },
  {
    id: "13",
    label: "Boutique Quizzly",
    group: "Quizzly",
    aliases: ["shop", "boutique", "quizzly"],
  },
  {
    id: "14",
    label: "Créditer des gemmes et de l’XP",
    group: "Quizzly",
    aliases: ["credit", "gemmes", "xp"],
  },
  {
    id: "15",
    label: "Maintenance du site",
    group: "Infrastructure",
    aliases: ["maint", "maintenance", "lock"],
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function resolveCommand(value: string) {
  const key = normalize(value);
  return commands.find(({ id, aliases }) => id === key || aliases.includes(key))
    ?.id;
}

export function renderMenu(filter = "") {
  const key = normalize(filter);
  const lines = ["🛠️  mAI / Administration"];
  let section = "";
  for (const { id, label, group, aliases } of commands) {
    if (!normalize([id, label, group, ...aliases].join(" ")).includes(key))
      continue;
    if (section !== group) {
      section = group;
      lines.push(`\n${group}`);
    }
    lines.push(`  ${id.padStart(2)}  ${label}  ·  ${aliases[0]}`);
  }
  if (!section) lines.push("Aucune commande correspondante.");
  lines.push(
    "\n🌐 16 / html : ouvrir la vue navigateur\nNuméro ou raccourci · /mot : filtrer · ? : menu complet · q : quitter"
  );
  return lines.join("\n");
}
