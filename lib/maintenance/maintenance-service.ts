import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { generateMaintenanceAccessCode } from "./maintenance-bypass";
import type {
  CreateMaintenanceInput,
  MaintenancePhase,
  MaintenanceRecord,
  MaintenanceStatusResponse,
} from "./types";

let cachedMaintenance: {
  value: MaintenanceRecord | null;
  expiresAt: number;
} | null = null;
/**
 * Le cache était de 5 s : le proxy interrogeait Neon en quasi-permanence dès
 * qu'il y avait du trafic, ce qui empêchait le compute de s'endormir. Une
 * minute réduit ce bruit d'un facteur 12 sans rendre une maintenance
 * d'urgence invisible plus longtemps qu'une minute sur les instances qui ne
 * l'ont pas créée (celle qui la crée vide son cache immédiatement).
 */
const CACHE_TTL_MS = 60_000;

let cachedClient: NeonQueryFunction<false, false> | null = null;

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return null;
  }
  // Un client par requête créait un pool éphémère à chaque appel du proxy.
  cachedClient ??= neon<false, false>(dbUrl);
  return cachedClient;
}

/**
 * Invalide le cache en mémoire (appelé après création, modification ou arrêt de maintenance).
 */
export function clearMaintenanceCache(): void {
  cachedMaintenance = null;
}

/**
 * Détermine la phase d'une maintenance en fonction de ses dates et de son statut actif.
 */
export function resolveMaintenancePhase(
  record: {
    isActive: boolean;
    startAt: string | Date;
    endAt: string | Date;
  },
  now: Date = new Date()
): MaintenancePhase {
  if (!record.isActive) {
    return "cancelled";
  }
  const start = new Date(record.startAt).getTime();
  const end = new Date(record.endAt).getTime();
  const current = now.getTime();

  if (current < start) {
    return "scheduled";
  }
  if (current >= start && current < end) {
    return "in_progress";
  }
  return "completed";
}

/**
 * Récupère la maintenance active en cours (isActive=true et startAt <= NOW() < endAt).
 * Utilise un cache mémoire d'une minute pour ne pas réveiller Neon à chaque requête.
 */
export async function getActiveMaintenance(
  forceRefresh = false
): Promise<MaintenanceRecord | null> {
  const nowMs = Date.now();
  if (
    !forceRefresh &&
    cachedMaintenance &&
    nowMs < cachedMaintenance.expiresAt
  ) {
    return cachedMaintenance.value;
  }

  const sql = getDbClient();
  if (!sql) {
    return null;
  }

  try {
    const rows = (await sql`
      SELECT 
        "id",
        "name",
        "description",
        "startAt",
        "endAt",
        "isActive",
        "accessCode",
        "createdAt",
        "updatedAt"
      FROM "MaintenanceWindow"
      WHERE "isActive" = true
        AND "startAt" <= NOW()
        AND "endAt" > NOW()
      ORDER BY "endAt" DESC
      LIMIT 1;
    `) as unknown as any[];

    if (!rows || rows.length === 0) {
      cachedMaintenance = {
        expiresAt: nowMs + CACHE_TTL_MS,
        value: null,
      };
      return null;
    }

    const row = rows[0];
    const record: MaintenanceRecord = {
      accessCode: String(row.accessCode || ""),
      createdAt: new Date(row.createdAt).toISOString(),
      description: String(row.description || ""),
      endAt: new Date(row.endAt).toISOString(),
      id: String(row.id),
      isActive: Boolean(row.isActive),
      name: String(row.name),
      startAt: new Date(row.startAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };

    cachedMaintenance = {
      expiresAt: Math.min(nowMs + CACHE_TTL_MS, new Date(row.endAt).getTime()),
      value: record,
    };
    return record;
  } catch {
    // Si la table n'existe pas encore ou erreur transitoire Neon, on ne bloque pas le site
    return null;
  }
}

/**
 * Récupère le statut complet pour l'API /api/maintenance/status.
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatusResponse> {
  const active = await getActiveMaintenance();
  const now = new Date();

  if (!active) {
    return {
      currentMaintenance: null,
      isUnderMaintenance: false,
      serverTime: now.toISOString(),
    };
  }

  const phase = resolveMaintenancePhase(active, now);
  return {
    currentMaintenance: {
      description: active.description,
      endAt: active.endAt,
      id: active.id,
      name: active.name,
      phase,
      startAt: active.startAt,
    },
    isUnderMaintenance: phase === "in_progress",
    serverTime: now.toISOString(),
  };
}

/**
 * Crée une nouvelle fenêtre de maintenance.
 */
export async function createMaintenanceWindow(
  input: CreateMaintenanceInput
): Promise<MaintenanceRecord | null> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("DATABASE_URL est manquant.");
  }

  const startAt = input.startAt ?? new Date();
  const endAt = input.endAt;
  const description = input.description ?? "";
  const accessCode =
    input.accessCode?.trim().toUpperCase() || generateMaintenanceAccessCode();

  const rows = (await sql`
    INSERT INTO "MaintenanceWindow" ("name", "description", "startAt", "endAt", "isActive", "accessCode")
    VALUES (${input.name}, ${description}, ${startAt.toISOString()}, ${endAt.toISOString()}, true, ${accessCode})
    RETURNING "id", "name", "description", "startAt", "endAt", "isActive", "accessCode", "createdAt", "updatedAt";
  `) as unknown as any[];

  clearMaintenanceCache();

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    accessCode: String(row.accessCode || ""),
    createdAt: new Date(row.createdAt).toISOString(),
    description: String(row.description || ""),
    endAt: new Date(row.endAt).toISOString(),
    id: String(row.id),
    isActive: Boolean(row.isActive),
    name: String(row.name),
    startAt: new Date(row.startAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/**
 * Arrête prématurément toutes les maintenances actives en cours.
 */
export async function stopCurrentMaintenance(): Promise<number> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("DATABASE_URL est manquant.");
  }

  const res = (await sql`
    UPDATE "MaintenanceWindow"
    SET "isActive" = false, "updatedAt" = NOW()
    WHERE "isActive" = true AND "endAt" > NOW()
    RETURNING "id";
  `) as unknown as any[];

  clearMaintenanceCache();
  return res.length;
}

/**
 * Prolonge la maintenance en cours de N minutes.
 */
export async function extendCurrentMaintenance(
  additionalMinutes: number
): Promise<MaintenanceRecord | null> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("DATABASE_URL est manquant.");
  }

  const active = await getActiveMaintenance(true);
  if (!active) {
    return null;
  }

  const newEnd = new Date(
    new Date(active.endAt).getTime() + additionalMinutes * 60 * 1000
  );

  const rows = (await sql`
    UPDATE "MaintenanceWindow"
    SET "endAt" = ${newEnd.toISOString()}, "updatedAt" = NOW()
    WHERE "id" = ${active.id}
    RETURNING "id", "name", "description", "startAt", "endAt", "isActive", "accessCode", "createdAt", "updatedAt";
  `) as unknown as any[];

  clearMaintenanceCache();

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    accessCode: String(row.accessCode || ""),
    createdAt: new Date(row.createdAt).toISOString(),
    description: String(row.description || ""),
    endAt: new Date(row.endAt).toISOString(),
    id: String(row.id),
    isActive: Boolean(row.isActive),
    name: String(row.name),
    startAt: new Date(row.startAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
