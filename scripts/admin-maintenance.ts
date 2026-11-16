import type * as readline from "node:readline/promises";
import { generateMaintenanceAccessCode } from "../lib/maintenance/maintenance-bypass.ts";
import { clearMaintenanceCache } from "../lib/maintenance/maintenance-service.ts";

export { generateMaintenanceAccessCode };

export type SqlClient = (
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<any[]>;

const c = {
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bold: "\x1b[1m",
  brightCyan: "\x1b[96m",
  brightGreen: "\x1b[92m",
  brightMagenta: "\x1b[95m",
  brightRed: "\x1b[91m",
  brightWhite: "\x1b[97m",
  brightYellow: "\x1b[93m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  yellow: "\x1b[33m",
};

function isBackOrCancel(val: string): boolean {
  const v = val.trim().toLowerCase();
  return (
    v === "0" ||
    v === "r" ||
    v === "b" ||
    v === "back" ||
    v === "retour" ||
    v === "q" ||
    v === "quit" ||
    v === "exit" ||
    v === "annuler" ||
    v === "cancel"
  );
}

function isYes(val: string): boolean {
  const v = val.trim().toLowerCase();
  return (
    v === "o" ||
    v === "oui" ||
    v === "y" ||
    v === "yes" ||
    v === "1" ||
    v === "true"
  );
}

/**
 * Initialise de manière idempotente la table MaintenanceWindow et ses index.
 */
export async function initMaintenanceTable(sql: SqlClient): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "MaintenanceWindow" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(150) NOT NULL,
        "description" text DEFAULT '',
        "startAt" timestamp with time zone NOT NULL,
        "endAt" timestamp with time zone NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "accessCode" varchar(100) DEFAULT '' NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    await sql`
      ALTER TABLE "MaintenanceWindow"
        ADD COLUMN IF NOT EXISTS "accessCode" varchar(100) DEFAULT '' NOT NULL;
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "MaintenanceWindow_active_range_idx"
        ON "MaintenanceWindow" ("isActive", "startAt", "endAt");
    `;
  } catch (error: any) {
    console.error(
      "❌ Note lors de l'initialisation de MaintenanceWindow :",
      error?.message || error
    );
  }
}

/**
 * Analyse une saisie de date/heure (ex: "14:30" pour aujourd'hui, ou "2026-11-15 14:30").
 */
function parseDateTimeInput(
  input: string,
  referenceDate: Date = new Date()
): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Format "HH:mm" ou "HH:mm:ss"
  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10);
    const minutes = Number.parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? Number.parseInt(timeMatch[3], 10) : 0;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    const d = new Date(referenceDate);
    d.setHours(hours, minutes, seconds, 0);
    // Si l'heure est déjà passée aujourd'hui, on passe au lendemain
    if (d.getTime() < referenceDate.getTime() - 60_000) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  // Format relatif "+15m", "+30m", "+2h", "30m", "1h"
  const relMatch = trimmed.match(
    /^\+?(\d+)\s*(m|min|h|heure|heures|j|jour|jours)?$/i
  );
  if (relMatch) {
    const amount = Number.parseInt(relMatch[1], 10);
    const unit = (relMatch[2] || "m").toLowerCase();
    const d = new Date(referenceDate);
    if (unit.startsWith("h")) {
      d.setHours(d.getHours() + amount);
    } else if (unit.startsWith("j")) {
      d.setDate(d.getDate() + amount);
    } else {
      d.setMinutes(d.getMinutes() + amount);
    }
    return d;
  }

  // Tentative Date standard ISO / FR ("YYYY-MM-DD HH:mm" ou "DD/MM/YYYY HH:mm")
  const frMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s+(\d{1,2}):(\d{2})$/
  );
  if (frMatch) {
    const day = Number.parseInt(frMatch[1], 10);
    const month = Number.parseInt(frMatch[2], 10) - 1;
    const year = Number.parseInt(frMatch[3], 10);
    const hours = Number.parseInt(frMatch[4], 10);
    const minutes = Number.parseInt(frMatch[5], 10);
    return new Date(year, month, day, hours, minutes, 0);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(start: Date, end: Date): string {
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function badgeMaintenanceStatus(
  isActive: boolean,
  startAt: Date,
  endAt: Date
): string {
  const now = new Date();
  if (!isActive) {
    return `${c.dim}🔴 Interrompue${c.reset}`;
  }
  if (now.getTime() < startAt.getTime()) {
    return `${c.brightYellow}⏳ Planifiée${c.reset}`;
  }
  if (now.getTime() >= startAt.getTime() && now.getTime() < endAt.getTime()) {
    return `${c.bgRed}${c.brightWhite} 🚨 EN COURS ${c.reset}`;
  }
  return `${c.brightGreen}🏁 Terminée${c.reset}`;
}

export async function handleStartMaintenanceNow(
  sql: SqlClient,
  rl: readline.Interface
) {
  console.log(
    `\n${c.bold}🚀 LANCER UNE PÉRIODE DE MAINTENANCE IMMÉDIATE${c.reset}`
  );
  console.log(
    `${c.dim}(Le site sera verrouillé pour TOUS les utilisateurs dès validation)${c.reset}\n`
  );

  // 1. Nom
  const nameInput = (
    await rl.question(
      ` 🏷️  Nom de la maintenance (défaut: "Mise à niveau mAI v2.5") : `
    )
  ).trim();
  if (isBackOrCancel(nameInput)) {
    console.log(`\n${c.dim}↩️  Opération annulée.${c.reset}`);
    return;
  }
  const name = nameInput || "Mise à niveau mAI v2.5";

  // 2. Description
  const descInput = (
    await rl.question(
      ` 📝 Description détaillée (facultatif, ex: "Mise à niveau de l'infrastructure...") : `
    )
  ).trim();
  if (isBackOrCancel(descInput)) {
    console.log(`\n${c.dim}↩️  Opération annulée.${c.reset}`);
    return;
  }
  const description =
    descInput ||
    "Nos serveurs font actuellement l'objet d'une opération de maintenance planifiée afin d'améliorer la fiabilité, la sécurité et les performances de vos services mAI.";

  // 3. Durée estimée / Heure de retour
  console.log("\n⏱️  Choisissez la durée estimée de la maintenance :");
  console.log("  [1] 15 minutes");
  console.log("  [2] 30 minutes (défaut)");
  console.log("  [3] 1 heure");
  console.log("  [4] 2 heures");
  console.log("  [5] 4 heures");
  console.log("  [6] Heure précise (ex: 14:30 ou 2026-11-15 16:00)");

  const choiceDur = (
    await rl.question(" 👉 Votre choix [1-6] (défaut: 2 - 30m) : ")
  ).trim();
  if (isBackOrCancel(choiceDur)) {
    console.log(`\n${c.dim}↩️  Opération annulée.${c.reset}`);
    return;
  }

  const startDate = new Date();
  let endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  if (choiceDur === "1") {
    endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
  } else if (choiceDur === "3") {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  } else if (choiceDur === "4") {
    endDate = new Date(startDate.getTime() + 120 * 60 * 1000);
  } else if (choiceDur === "5") {
    endDate = new Date(startDate.getTime() + 240 * 60 * 1000);
  } else if (choiceDur === "6") {
    const rawTime = (
      await rl.question(
        ` ⏰ Entrez l'heure ou la date de fin (ex: "15:30", "+45m", "2026-11-15 16:00") : `
      )
    ).trim();
    if (isBackOrCancel(rawTime)) {
      console.log(`\n${c.dim}↩️  Opération annulée.${c.reset}`);
      return;
    }
    const parsed = parseDateTimeInput(rawTime, startDate);
    if (!parsed || parsed.getTime() <= startDate.getTime()) {
      console.log(
        ` ${c.red}✖️  Date/heure de fin invalide ou déjà écoulée.${c.reset}`
      );
      return;
    }
    endDate = parsed;
  }

  // 4. Code d'accès / Bypass (un code = une maintenance)
  const suggestedCode = generateMaintenanceAccessCode();
  const codeInput = (
    await rl.question(
      `\n 🔑 Code d'accès / bypass (défaut: "${suggestedCode}") : `
    )
  ).trim();
  if (isBackOrCancel(codeInput)) {
    console.log(`\n${c.dim}↩️  Opération annulée.${c.reset}`);
    return;
  }
  const accessCode = (codeInput || suggestedCode).toUpperCase();

  // Confirmation
  console.log(
    `\n${c.bgYellow}${c.bold} ⚠️  RÉCAPITULATIF DU VERROUILLAGE SYSTÈME : ${c.reset}`
  );
  console.log(`  • Nom           : ${c.bold}${name}${c.reset}`);
  console.log(`  • Description   : ${description}`);
  console.log(
    `  • Début         : ${startDate.toLocaleString("fr-FR")} (IMMÉDIAT)`
  );
  console.log(
    `  • Fin estimée   : ${c.brightGreen}${endDate.toLocaleString("fr-FR")}${c.reset}`
  );
  console.log(`  • Durée prévue  : ${formatDuration(startDate, endDate)}`);
  console.log(
    `  • Code d'accès  : ${c.brightGreen}${c.bold}${accessCode}${c.reset} (déverrouillage /maintenance)`
  );
  console.log(
    `  • Impact        : ${c.brightRed}${c.bold}ACCÈS AU SITE ET APIS TOTALEMENT BLOQUÉ${c.reset}`
  );

  const confirm = (
    await rl.question(
      "\n❓ Confirmer le lancement IMMÉDIAT de cette maintenance ? (o/N) : "
    )
  ).trim();

  if (!isYes(confirm)) {
    console.log(`\n${c.dim}↩️  Lancement de la maintenance annulé.${c.reset}`);
    return;
  }

  try {
    const rows = (await sql`
      INSERT INTO "MaintenanceWindow" ("name", "description", "startAt", "endAt", "isActive", "accessCode")
      VALUES (${name}, ${description}, ${startDate.toISOString()}, ${endDate.toISOString()}, true, ${accessCode})
      RETURNING *;
    `) as unknown as any[];

    clearMaintenanceCache();

    console.log(
      `\n${c.bgRed}${c.brightWhite}${c.bold} 🚨 LE SITE EST DÉSORMAIS EN MAINTENANCE VERROUILLÉE ! 🔒 ${c.reset}`
    );
    console.log(
      ` ${c.brightGreen}✅ Fenêtre active ID : ${rows[0]?.id}${c.reset}`
    );
    console.log(
      ` ${c.brightGreen}🔑 Code d'accès (Bypass) : ${c.bold}${accessCode}${c.reset}`
    );
    console.log(
      ` ${c.dim}Les utilisateurs sont redirigés vers /maintenance. Le code ci-dessus permet de déverrouiller l'accès.${c.reset}\n`
    );
  } catch (error: any) {
    console.error(
      "❌ Erreur lors du lancement de la maintenance :",
      error?.message || error
    );
  }
}

export async function handleScheduleMaintenance(
  sql: SqlClient,
  rl: readline.Interface
) {
  console.log(
    `\n${c.bold}📅 PLANIFIER UNE PÉRIODE DE MAINTENANCE DIFFÉRÉE${c.reset}`
  );
  console.log(`${c.dim}(💡 Tapez 'r' à tout moment pour annuler)${c.reset}\n`);

  const nameInput = (await rl.question(" 🏷️  Nom de la maintenance : ")).trim();
  if (!nameInput || isBackOrCancel(nameInput)) {
    console.log(`\n${c.dim}↩️  Planification annulée.${c.reset}`);
    return;
  }

  const descInput = (await rl.question(" 📝 Description détaillée : ")).trim();
  if (isBackOrCancel(descInput)) {
    console.log(`\n${c.dim}↩️  Planification annulée.${c.reset}`);
    return;
  }

  const startInput = (
    await rl.question(
      ` ⏰ Date & Heure de DÉBUT (ex: "18:00", "2026-11-16 23:00", "+2h") : `
    )
  ).trim();
  if (!startInput || isBackOrCancel(startInput)) {
    console.log(`\n${c.dim}↩️  Planification annulée.${c.reset}`);
    return;
  }

  const startDate = parseDateTimeInput(startInput);
  if (!startDate) {
    console.log(` ${c.red}✖️  Date de début invalide.${c.reset}`);
    return;
  }

  const endInput = (
    await rl.question(
      ` 🏁 Date & Heure de FIN (ex: "20:00", "2026-11-17 01:00", "+3h") : `
    )
  ).trim();
  if (!endInput || isBackOrCancel(endInput)) {
    console.log(`\n${c.dim}↩️  Planification annulée.${c.reset}`);
    return;
  }

  const endDate = parseDateTimeInput(endInput, startDate);
  if (!endDate || endDate.getTime() <= startDate.getTime()) {
    console.log(
      ` ${c.red}✖️  Date de fin invalide ou antérieure au début.${c.reset}`
    );
    return;
  }

  const suggestedCode = generateMaintenanceAccessCode();
  const codePrompt = (
    await rl.question(
      `\n 🔑 Code d'accès / bypass (défaut: "${suggestedCode}") : `
    )
  ).trim();
  if (isBackOrCancel(codePrompt)) {
    console.log(`\n${c.dim}↩️  Planification annulée.${c.reset}`);
    return;
  }
  const accessCode = (codePrompt || suggestedCode).toUpperCase();

  console.log(`\n${c.bold}📋 RÉCAPITULATIF DE LA PLANIFICATION :${c.reset}`);
  console.log(`  • Nom           : ${nameInput}`);
  console.log(`  • Description   : ${descInput || "(par défaut)"}`);
  console.log(`  • Début prévu   : ${startDate.toLocaleString("fr-FR")}`);
  console.log(`  • Fin prévue    : ${endDate.toLocaleString("fr-FR")}`);
  console.log(`  • Durée prévue  : ${formatDuration(startDate, endDate)}`);
  console.log(
    `  • Code d'accès  : ${c.brightGreen}${c.bold}${accessCode}${c.reset} (déverrouillage /maintenance)`
  );

  const confirm = (
    await rl.question(
      `\n❓ Confirmer l'enregistrement de cette planification ? (o/N) : `
    )
  ).trim();

  if (!isYes(confirm)) {
    console.log(`\n${c.dim}↩️  Planification annulée.${c.reset}`);
    return;
  }

  try {
    await sql`
      INSERT INTO "MaintenanceWindow" ("name", "description", "startAt", "endAt", "isActive", "accessCode")
      VALUES (${nameInput}, ${descInput || "Maintenance planifiée"}, ${startDate.toISOString()}, ${endDate.toISOString()}, true, ${accessCode});
    `;
    clearMaintenanceCache();
    console.log(
      `\n${c.brightGreen}✅ Période de maintenance planifiée avec succès ! 📅${c.reset}`
    );
    console.log(
      ` ${c.brightGreen}🔑 Code d'accès (Bypass) : ${c.bold}${accessCode}${c.reset}\n`
    );
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la planification :",
      error?.message || error
    );
  }
}

export async function handleListMaintenances(sql: SqlClient) {
  console.log(
    `\n${c.bold}📋 HISTORIQUE DES PÉRIODES DE MAINTENANCE mAI${c.reset}`
  );

  try {
    const rows = (await sql`
      SELECT "id", "name", "description", "startAt", "endAt", "isActive", "accessCode", "createdAt"
      FROM "MaintenanceWindow"
      ORDER BY "startAt" DESC
      LIMIT 15;
    `) as unknown as any[];

    if (!rows || rows.length === 0) {
      console.log(
        `\n ${c.dim}ℹ️  Aucune période de maintenance enregistrée.${c.reset}\n`
      );
      return;
    }

    console.log(`${"═".repeat(128)}`);
    console.log(
      `║ ${"STATUT".padEnd(20)} ║ ${"NOM".padEnd(24)} ║ ${"DÉBUT".padEnd(16)} ║ ${"FIN".padEnd(
        16
      )} ║ ${"CODE ACCÈS".padEnd(18)} ║ ${"DURÉE".padEnd(10)} ║ ${"ID".padEnd(8)} ║`
    );
    console.log("═".repeat(128));

    for (const r of rows) {
      const start = new Date(r.startAt);
      const end = new Date(r.endAt);
      const statusBadge = badgeMaintenanceStatus(r.isActive, start, end);
      const name = String(r.name).slice(0, 24).padEnd(24);
      const startStr = start
        .toLocaleDateString("fr-FR", {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
        })
        .padEnd(16);
      const endStr = end
        .toLocaleDateString("fr-FR", {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
        })
        .padEnd(16);
      const codeStr = String(r.accessCode || "-")
        .slice(0, 18)
        .padEnd(18);
      const dur = formatDuration(start, end).padEnd(10);
      const id = String(r.id).slice(0, 8).padEnd(8);

      console.log(
        `║ ${statusBadge.padEnd(29)} ║ ${name} ║ ${startStr} ║ ${endStr} ║ ${codeStr} ║ ${dur} ║ ${id} ║`
      );
    }
    console.log(`${"═".repeat(128)}\n`);
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la récupération des maintenances :",
      error?.message || error
    );
  }
}

export async function handleStopMaintenance(
  sql: SqlClient,
  rl: readline.Interface
) {
  console.log(
    `\n${c.bold}🛑 ARRÊTER IMMÉDIATEMENT LA MAINTENANCE EN COURS${c.reset}`
  );

  try {
    const rows = (await sql`
      SELECT "id", "name", "startAt", "endAt"
      FROM "MaintenanceWindow"
      WHERE "isActive" = true AND "startAt" <= NOW() AND "endAt" > NOW()
      ORDER BY "endAt" DESC;
    `) as unknown as any[];

    if (!rows || rows.length === 0) {
      console.log(
        `\n ${c.brightGreen}🟢 Aucune maintenance n'est active actuellement. Le site est opérationnel.${c.reset}\n`
      );
      return;
    }

    const current = rows[0];
    console.log(
      `\n⚠️  Maintenance active détectée : ${c.bold}${current.name}${c.reset} (prévue jusqu'à ${new Date(current.endAt).toLocaleTimeString("fr-FR")})`
    );

    const confirm = (
      await rl.question(
        `\n❓ Confirmer l'ARRÊT IMMÉDIAT de la maintenance et la réouverture du site ? (o/N) : `
      )
    ).trim();

    if (!isYes(confirm)) {
      console.log(
        `\n${c.dim}↩️  Action annulée. Le site reste en maintenance.${c.reset}\n`
      );
      return;
    }

    await sql`
      UPDATE "MaintenanceWindow"
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE "isActive" = true AND "endAt" > NOW();
    `;

    clearMaintenanceCache();

    console.log(
      `\n${c.bgGreen}${c.bold}${c.brightWhite} ✨ LA MAINTENANCE EST ARRÊTÉE ! LE SITE EST DE NOUVEAU EN LIGNE ! 🎉 ${c.reset}\n`
    );
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de l'arrêt de la maintenance :",
      error?.message || error
    );
  }
}

export async function handleExtendOrEditMaintenance(
  sql: SqlClient,
  rl: readline.Interface
) {
  console.log(`\n${c.bold}⏱️  PROLONGER OU MODIFIER UNE MAINTENANCE${c.reset}`);

  try {
    const rows = (await sql`
      SELECT "id", "name", "description", "startAt", "endAt", "isActive", "accessCode"
      FROM "MaintenanceWindow"
      WHERE "isActive" = true AND "endAt" > NOW()
      ORDER BY "startAt" ASC;
    `) as unknown as any[];

    if (!rows || rows.length === 0) {
      console.log(
        `\n ${c.dim}ℹ️  Aucune maintenance active ou planifiée à modifier.${c.reset}\n`
      );
      return;
    }

    const current = rows[0];
    const isRunning = new Date(current.startAt).getTime() <= Date.now();
    console.log(
      `\n${isRunning ? "🚨 Maintenance en cours" : "⏳ Maintenance planifiée"} : ${c.bold}${current.name}${c.reset}`
    );
    console.log(
      ` Fin actuelle : ${new Date(current.endAt).toLocaleString("fr-FR")}`
    );
    console.log(
      ` 🔑 Code d'accès actuel : ${current.accessCode ? `${c.brightGreen}${c.bold}${current.accessCode}${c.reset}` : `${c.dim}(aucun)${c.reset}`}`
    );

    console.log("\nQue souhaitez-vous faire ?");
    console.log("  [1] ➕ Prolonger de 15 minutes");
    console.log("  [2] ➕ Prolonger de 30 minutes");
    console.log("  [3] ➕ Prolonger de 1 heure");
    console.log("  [4] ✏️  Définir une nouvelle date/heure de fin");
    console.log("  [5] 📝 Modifier le nom ou la description");
    console.log("  [6] 🔑 Modifier ou régénérer le code d'accès");
    console.log("  [0] ↩️  Annuler");

    const choice = (await rl.question(" 👉 Votre choix [0-6] : ")).trim();
    if (choice === "0" || isBackOrCancel(choice)) {
      console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
      return;
    }

    let newEnd = new Date(current.endAt);
    let newName = current.name;
    let newDesc = current.description;
    let newAccessCode = current.accessCode || "";

    if (choice === "1") {
      newEnd = new Date(newEnd.getTime() + 15 * 60 * 1000);
    } else if (choice === "2") {
      newEnd = new Date(newEnd.getTime() + 30 * 60 * 1000);
    } else if (choice === "3") {
      newEnd = new Date(newEnd.getTime() + 60 * 60 * 1000);
    } else if (choice === "4") {
      const endIn = (
        await rl.question(
          " ⏰ Nouvelle heure de fin (ex: '16:30' ou '+45m') : "
        )
      ).trim();
      const parsed = parseDateTimeInput(endIn, new Date());
      if (!parsed) {
        console.log(` ${c.red}✖️  Heure invalide.${c.reset}`);
        return;
      }
      newEnd = parsed;
    } else if (choice === "5") {
      const nameIn = (
        await rl.question(" 🏷️  Nouveau nom (laisser vide pour conserver) : ")
      ).trim();
      if (nameIn) newName = nameIn;
      const descIn = (
        await rl.question(
          " 📝 Nouvelle description (laisser vide pour conserver) : "
        )
      ).trim();
      if (descIn) newDesc = descIn;
    } else if (choice === "6") {
      const suggested = generateMaintenanceAccessCode();
      const codeIn = (
        await rl.question(
          ` 🔑 Nouveau code d'accès (défaut: "${suggested}", actuel: "${current.accessCode || "aucun"}") : `
        )
      ).trim();
      newAccessCode = (codeIn || suggested).toUpperCase();
    }

    await sql`
      UPDATE "MaintenanceWindow"
      SET "endAt" = ${newEnd.toISOString()},
          "name" = ${newName},
          "description" = ${newDesc},
          "accessCode" = ${newAccessCode},
          "updatedAt" = NOW()
      WHERE "id" = ${current.id};
    `;

    clearMaintenanceCache();

    console.log(
      `\n${c.brightGreen}✅ Maintenance mise à jour avec succès !${c.reset}`
    );
    console.log(`  • Nouvelle fin  : ${newEnd.toLocaleString("fr-FR")}`);
    console.log(
      `  • Code d'accès  : ${c.brightGreen}${c.bold}${newAccessCode}${c.reset}\n`
    );
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la modification :",
      error?.message || error
    );
  }
}

export async function handleDeleteMaintenance(
  sql: SqlClient,
  rl: readline.Interface
) {
  console.log(`\n${c.bold}🗑️  SUPPRIMER UNE PÉRIODE DE MAINTENANCE${c.reset}`);
  const search = (
    await rl.question(
      " 🔍 Entrez l'ID (ou les premiers caractères de l'UUID) : "
    )
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Suppression annulée.${c.reset}`);
    return;
  }

  try {
    const rows = (await sql`
      SELECT "id", "name", "startAt"
      FROM "MaintenanceWindow"
      WHERE "id"::text ILIKE ${`${search}%`}
      LIMIT 1;
    `) as unknown as any[];

    if (!rows || rows.length === 0) {
      console.log(
        ` ${c.red}✖️  Aucune maintenance trouvée pour « ${search} ».${c.reset}`
      );
      return;
    }

    const item = rows[0];
    const confirm = (
      await rl.question(
        ` ⚠️  Supprimer définitivement "${item.name}" (${item.id}) ? (o/N) : `
      )
    ).trim();

    if (isYes(confirm)) {
      await sql`DELETE FROM "MaintenanceWindow" WHERE "id" = ${item.id};`;
      clearMaintenanceCache();
      console.log(`\n${c.brightGreen}🗑️  Maintenance supprimée.${c.reset}\n`);
    } else {
      console.log(`\n${c.dim}↩️  Suppression annulée.${c.reset}`);
    }
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la suppression :",
      error?.message || error
    );
  }
}

/**
 * Menu principal interactif du gestionnaire de maintenance.
 */
export async function runMaintenanceManager(
  sql: SqlClient,
  parentRl?: readline.Interface
) {
  await initMaintenanceTable(sql);
  const rl =
    parentRl ??
    (await import("node:readline/promises")).createInterface({
      input: process.stdin,
      output: process.stdout,
    });

  console.log("\n=======================================================");
  console.log(" 🛠️  GESTIONNAIRE DES PÉRIODES DE MAINTENANCE mAI");
  console.log("=======================================================");

  let running = true;
  while (running) {
    console.log(`\n${c.bold}--- MENU MAINTENANCE & VERROUILLAGE ---${c.reset}`);
    console.log(
      "  [1] 🚀 Lancer une maintenance IMMÉDIATEMENT       (raccourci: 'now' ou '1')"
    );
    console.log(
      "  [2] 📅 Planifier une maintenance différée          (raccourci: 'plan' ou '2')"
    );
    console.log(
      "  [3] 📋 Consulter les maintenances et l'historique  (raccourci: 'l' ou '3')"
    );
    console.log(
      "  [4] 🛑 Arrêter IMMÉDIATEMENT la maintenance        (raccourci: 'stop' ou '4')"
    );
    console.log(
      "  [5] ⏱️  Prolonger ou modifier une maintenance      (raccourci: 'm' ou '5')"
    );
    console.log(
      "  [6] 🗑️  Supprimer une maintenance de l'historique   (raccourci: 'd' ou '6')"
    );
    console.log(
      "  [0] ↩️  Retour au menu principal                   (raccourci: 'r', 'q', 'exit')"
    );

    const rawChoice = (
      await rl.question(`\n ${c.brightYellow}👉 Votre choix [0-6] : ${c.reset}`)
    ).trim();
    const choice = rawChoice.toLowerCase();

    if (choice === "1" || choice === "now") {
      await handleStartMaintenanceNow(sql, rl);
    } else if (choice === "2" || choice === "plan") {
      await handleScheduleMaintenance(sql, rl);
    } else if (choice === "3" || choice === "l" || choice === "list") {
      await handleListMaintenances(sql);
    } else if (choice === "4" || choice === "stop") {
      await handleStopMaintenance(sql, rl);
    } else if (choice === "5" || choice === "m" || choice === "extend") {
      await handleExtendOrEditMaintenance(sql, rl);
    } else if (choice === "6" || choice === "d" || choice === "del") {
      await handleDeleteMaintenance(sql, rl);
    } else if (choice === "0" || isBackOrCancel(choice)) {
      running = false;
      console.log(`\n${c.dim}↩️  Retour au menu principal.${c.reset}`);
    } else {
      console.log(` ${c.red}⚠️  Option invalide.${c.reset}`);
    }
  }

  if (!parentRl) {
    rl.close();
  }
}
