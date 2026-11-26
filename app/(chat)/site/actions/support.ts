"use server";

import { neon } from "@neondatabase/serverless";
import {
  ADMIN_EMAIL,
  getAllowedStatusTransitions,
  isAdminUser,
  SUPPORT_ATTACHMENT_LIMITS,
  type SupportAttachment,
  type SupportDashboardResult,
  type SupportDashboardStats,
  type SupportMessage,
  type SupportTicket,
  type SupportTicketDetailsResult,
  type SupportTicketStatus,
  type SupportTicketsListResult,
} from "@/app/(chat)/site/actions/support-utils";
import type { SupportStatsResult } from "@/components/site/support/stats/stats-types";
import { getMaiUser } from "@/lib/auth/session";
import { dbReady, getRawClient } from "@/lib/db/queries/connection";
import {
  type SupportTicketEmailPayload,
  sendSupportTicketCreatedEmail,
  sendSupportTicketUpdateEmail,
} from "@/lib/site/email";
import { getSessionIdentity } from "@/lib/site/session-auth";

type SupportSql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, any>[]>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  low: "Faible",
  medium: "Normale",
  urgent: "Critique / Urgent",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#f97316",
  low: "#3b82f6",
  medium: "#10b981",
  urgent: "#ef4444",
};

async function getSql(): Promise<SupportSql> {
  await dbReady();
  const raw = getRawClient();
  if (raw) {
    return raw as unknown as SupportSql;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("La variable d'environnement DATABASE_URL est manquante.");
  }
  return neon(databaseUrl) as unknown as SupportSql;
}

function parseCount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeAvgResolutionHours(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 10) / 10;
}

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://m-ai.fr";
}

// Helpers mapping colonnes → objets
function mapTicketRow(r: any): SupportTicket {
  return {
    archived_at: r.archived_at ? new Date(r.archived_at).toISOString() : null,
    category: r.category,
    created_at: new Date(r.created_at).toISOString(),
    description: r.description,
    id: r.id,
    is_archived: !!r.is_archived,
    message_count:
      r.message_count === undefined || r.message_count === null
        ? undefined
        : Number.parseInt(String(r.message_count), 10),
    metadata: r.metadata,
    priority: r.priority,
    project: r.project,
    resolved_at: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
    status: r.status,
    ticket_number: r.ticket_number,
    title: r.title,
    updated_at: new Date(r.updated_at).toISOString(),
    user_email: r.user_email,
    user_id: r.user_id,
    user_name: r.user_name,
    user_tier: r.user_tier || "Free",
  };
}

function mapMessageRow(m: any): SupportMessage {
  return {
    action_type: m.action_type,
    created_at: new Date(m.created_at).toISOString(),
    id: m.id,
    is_ai_generated: !!m.is_ai_generated,
    is_edited: !!m.is_edited,
    message: m.message,
    sender_email: m.sender_email,
    sender_id: m.sender_id,
    sender_name: m.sender_name,
    sender_role: m.sender_role,
    ticket_id: m.ticket_id,
  };
}

function mapAttachmentRow(a: any): SupportAttachment {
  return {
    created_at: new Date(a.created_at).toISOString(),
    file_key: a.file_key,
    file_name: a.file_name,
    file_size: Number.parseInt(a.file_size, 10),
    file_url: a.file_url,
    id: a.id,
    message_id: a.message_id,
    mime_type: a.mime_type,
    ticket_id: a.ticket_id,
    uploader_email: a.uploader_email,
    uploader_id: a.uploader_id,
    uploader_role: a.uploader_role,
  };
}

type SupportSessionUser = {
  id: string;
  email: string;
  name: string;
  tier: string;
  isAdmin: boolean;
};

const AUTH_REQUIRED = {
  error: "Authentification requise.",
  success: false as const,
};

/**
 * Identité serveur : utilise le cache session `getMaiUser()` pour éviter un aller-retour SQL `users`,
 * avec repli sécurisé sur `users` uniquement si le profil complet n'est pas en cache.
 */
async function resolveSupportUserFast(): Promise<SupportSessionUser | null> {
  const maiUser = await getMaiUser();
  if (maiUser?.id && maiUser.email) {
    const email = maiUser.email.trim().toLowerCase();
    return {
      email,
      id: String(maiUser.id),
      isAdmin: isAdminUser(email),
      name: String(maiUser.username || email || "Utilisateur"),
      tier: String(maiUser.tier || "Free"),
    };
  }
  const identity = await getSessionIdentity();
  if (!identity) return null;
  const sql = await getSql();
  const rows = await sql`
    SELECT id, email, username, tier FROM users WHERE id::text = ${identity.userId}::text LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  const email = String(r.email || "")
    .trim()
    .toLowerCase();
  return {
    email,
    id: String(r.id),
    isAdmin: isAdminUser(email),
    name: String(r.username || email || "Utilisateur"),
    tier: String(r.tier || "Free"),
  };
}

function mapDashboardTicketRow(r: Record<string, any>): SupportTicket {
  return mapTicketRow({
    ...r,
    description: "",
    metadata: {},
  });
}

async function computeTicketAggregations(
  sql: SupportSql,
  me: SupportSessionUser
): Promise<SupportDashboardStats> {
  const rows = me.isAdmin
    ? await sql`
        SELECT
          COUNT(*) FILTER (WHERE is_archived = FALSE)::int AS total,
          COUNT(*)::int AS total_with_archived,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'open')::int AS open_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'in_progress')::int AS in_progress_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'reopened')::int AS reopened_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'waiting_user')::int AS waiting_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'resolved')::int AS resolved_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'closed')::int AS closed_count,
          COUNT(*) FILTER (WHERE is_archived = TRUE)::int AS archived_count,
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
            FILTER (WHERE resolved_at IS NOT NULL) AS avg_hours
        FROM support_tickets
      `
    : await sql`
        SELECT
          COUNT(*) FILTER (WHERE is_archived = FALSE)::int AS total,
          COUNT(*)::int AS total_with_archived,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'open')::int AS open_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'in_progress')::int AS in_progress_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'reopened')::int AS reopened_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'waiting_user')::int AS waiting_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'resolved')::int AS resolved_count,
          COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'closed')::int AS closed_count,
          COUNT(*) FILTER (WHERE is_archived = TRUE)::int AS archived_count,
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
            FILTER (WHERE resolved_at IS NOT NULL) AS avg_hours
        FROM support_tickets
        WHERE (user_id = ${me.id} OR user_id = ${me.email} OR user_email = ${me.email})
      `;

  const agg = rows[0] ?? {};
  const total = parseCount(agg.total);
  const totalWithArchived = parseCount(agg.total_with_archived);
  const open = parseCount(agg.open_count);
  const inProgress = parseCount(agg.in_progress_count);
  const reopened = parseCount(agg.reopened_count);
  const waiting = parseCount(agg.waiting_count);
  const resolved = parseCount(agg.resolved_count);
  const closed = parseCount(agg.closed_count);
  const archived = parseCount(agg.archived_count);
  const resolutionRate =
    total > 0 ? Math.round(((resolved + closed) / total) * 100) : null;
  const avgResolutionHours = computeAvgResolutionHours(agg.avg_hours);

  return {
    archived,
    avgResolutionHours,
    closed,
    inProgress,
    open,
    reopened,
    resolutionRate,
    resolved,
    total,
    totalWithArchived,
    waiting,
  };
}

function isTicketOwner(
  ticket: { user_id?: any; user_email?: any },
  me: SupportSessionUser
): boolean {
  const storedId = String(ticket.user_id || "");
  const storedEmail = String(ticket.user_email || "")
    .trim()
    .toLowerCase();
  return (
    storedId === me.id || storedId === me.email || storedEmail === me.email
  );
}

/**
 * Crée un nouveau ticket de support et alerte l'administrateur
 */
export async function createSupportTicket(data: {
  title: string;
  description: string;
  category: string;
  project: string;
  priority: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, any>;
  attachmentIds?: string[]; // ids de support_ticket_attachments pré-uploadés (optionnel)
}) {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();

    if (!data.title?.trim() || !data.description?.trim()) {
      return {
        error: "Le titre et la description sont requis.",
        success: false,
      };
    }
    if (data.title.trim().length < 3 || data.title.trim().length > 120) {
      return {
        error: "Le titre doit contenir entre 3 et 120 caractères.",
        success: false,
      };
    }

    // 1. Insertion du ticket
    const result = await sql`
      INSERT INTO support_tickets (
        user_id,
        user_email,
        user_name,
        user_tier,
        title,
        description,
        category,
        project,
        priority,
        status,
        metadata
      ) VALUES (
        ${me.id},
        ${me.email},
        ${me.name},
        ${me.tier},
        ${data.title.trim()},
        ${data.description.trim()},
        ${data.category || "Autre"},
        ${data.project || "mAI Web"},
        ${data.priority || "medium"},
        'open',
        ${JSON.stringify(data.metadata || {})}::jsonb
      )
      RETURNING *
    `;

    const ticket = result[0] as SupportTicket;

    // 2. Création du premier message d'historique
    const msgRes = await sql`
      INSERT INTO support_ticket_messages (
        ticket_id,
        sender_id,
        sender_email,
        sender_name,
        sender_role,
        message,
        action_type
      ) VALUES (
        ${ticket.id},
        ${me.id},
        ${me.email},
        ${me.name},
        'user',
        ${data.description.trim()},
        'created'
      )
      RETURNING id
    `;
    const createdMsgId = msgRes[0]?.id;

    // 2b. Lier les attachments pré-uploadés (si fournis) au message créé
    if (data.attachmentIds && data.attachmentIds.length > 0 && createdMsgId) {
      for (const attId of data.attachmentIds.slice(
        0,
        SUPPORT_ATTACHMENT_LIMITS.MAX_FILES_PER_ROLE_PER_TICKET
      )) {
        try {
          await sql`
            UPDATE support_ticket_attachments
            SET message_id = ${createdMsgId}::uuid
            WHERE id = ${attId}::uuid AND ticket_id IS NULL
              AND (uploader_id = ${me.id} OR uploader_id = ${me.email} OR uploader_email = ${me.email})
          `;
          // fallback si ticket_id était déjà set en attente (upload via /api/support/upload sans ticket)
          await sql`
            UPDATE support_ticket_attachments
            SET ticket_id = ${ticket.id}::uuid, message_id = ${createdMsgId}::uuid
            WHERE id = ${attId}::uuid AND (ticket_id = ${ticket.id}::uuid OR ticket_id IS NULL)
              AND (uploader_id = ${me.id} OR uploader_id = ${me.email} OR uploader_email = ${me.email})
          `;
        } catch {}
      }
      // Aussi gérer cas où attachments ont été uploadés avec ticket_id déjà connu (via pending id)
      // Alternative : l'API upload crée avec ticket_id = ticket.id si fourni
    }

    // 3. Envoi du mail admin
    try {
      const emailPayload: SupportTicketEmailPayload = {
        category: ticket.category,
        created_at: ticket.created_at,
        description: ticket.description,
        id: ticket.id,
        priority: ticket.priority,
        project: ticket.project,
        status: ticket.status,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        user_email: ticket.user_email,
        user_id: ticket.user_id,
        user_name: ticket.user_name,
        user_tier: ticket.user_tier,
      };

      await sendSupportTicketCreatedEmail({
        appUrl: getAppUrl(),
        ticket: emailPayload,
      });
    } catch (mailErr) {
      console.error("[SUPPORT EMAIL ERROR]", mailErr);
    }

    return {
      success: true,
      ticket: mapTicketRow(ticket),
    };
  } catch (error: any) {
    console.error("Erreur lors de la création du ticket:", error);
    return {
      error:
        error?.message ||
        "Une erreur est survenue lors de la création du ticket.",
      success: false,
    };
  }
}

/**
 * Récupère les tickets d'un utilisateur (ou tous pour l'admin)
 * - is_archived filtré par défaut (archived masqué sauf status=archived)
 */
export async function getSupportDashboardData(): Promise<SupportDashboardResult> {
  try {
    const me = await resolveSupportUserFast();
    if (!me) {
      return {
        activeCount: 0,
        activeTickets: [],
        authenticated: false,
        historyTickets: [],
        isAdmin: false,
        stats: null,
        success: true,
      };
    }
    const sql = await getSql();

    const [stats, activeRows, historyRows] = await Promise.all([
      computeTicketAggregations(sql, me),
      me.isAdmin
        ? sql`
            SELECT
              id, ticket_number, user_id, user_email, user_name, user_tier,
              title, category, project, priority, status, is_archived,
              created_at, updated_at, resolved_at, archived_at
            FROM support_tickets
            WHERE is_archived = FALSE
              AND status IN ('open', 'in_progress', 'waiting_user', 'reopened')
            ORDER BY updated_at DESC
            LIMIT 6
          `
        : sql`
            SELECT
              id, ticket_number, user_id, user_email, user_name, user_tier,
              title, category, project, priority, status, is_archived,
              created_at, updated_at, resolved_at, archived_at
            FROM support_tickets
            WHERE (user_id = ${me.id} OR user_id = ${me.email} OR user_email = ${me.email})
              AND is_archived = FALSE
              AND status IN ('open', 'in_progress', 'waiting_user', 'reopened')
            ORDER BY updated_at DESC
            LIMIT 6
          `,
      me.isAdmin
        ? sql`
            SELECT
              id, ticket_number, user_id, user_email, user_name, user_tier,
              title, category, project, priority, status, is_archived,
              created_at, updated_at, resolved_at, archived_at
            FROM support_tickets
            WHERE is_archived = FALSE
              AND status NOT IN ('open', 'in_progress', 'waiting_user', 'reopened')
            ORDER BY updated_at DESC
            LIMIT 8
          `
        : sql`
            SELECT
              id, ticket_number, user_id, user_email, user_name, user_tier,
              title, category, project, priority, status, is_archived,
              created_at, updated_at, resolved_at, archived_at
            FROM support_tickets
            WHERE (user_id = ${me.id} OR user_id = ${me.email} OR user_email = ${me.email})
              AND is_archived = FALSE
              AND status NOT IN ('open', 'in_progress', 'waiting_user', 'reopened')
            ORDER BY updated_at DESC
            LIMIT 8
          `,
    ]);

    return {
      activeCount:
        stats.open + stats.inProgress + stats.reopened + stats.waiting,
      activeTickets: activeRows.map(mapDashboardTicketRow),
      authenticated: true,
      historyTickets: historyRows.map(mapDashboardTicketRow),
      isAdmin: me.isAdmin,
      stats,
      success: true,
    };
  } catch (error: any) {
    console.error("Erreur lors du chargement du dashboard support:", error);
    return {
      activeCount: 0,
      activeTickets: [],
      authenticated: true,
      error:
        error?.message ||
        "Impossible de charger le centre de support pour le moment.",
      historyTickets: [],
      isAdmin: false,
      stats: null,
      success: false,
    };
  }
}

export async function getTicketsList({
  status,
  project,
  priority,
  search,
}: {
  status?: string;
  project?: string;
  priority?: string;
  search?: string;
}): Promise<SupportTicketsListResult> {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return { ...AUTH_REQUIRED, tickets: [] };
    const sql = await getSql();
    const isAdmin = me.isAdmin;

    const effectiveStatus = status || "all";
    const isArchived = effectiveStatus === "archived";
    const hasStatus = !isArchived && effectiveStatus !== "all";
    const statusValue = hasStatus ? effectiveStatus : "";
    const hasProject = Boolean(project && project !== "all");
    const projectValue = hasProject && project ? project : "";
    const hasPriority = Boolean(priority && priority !== "all");
    const priorityValue = hasPriority && priority ? priority : "";
    const trimmedSearch = (search || "").trim();
    const hasSearch = trimmedSearch.length > 0;
    const searchLike = `%${trimmedSearch}%`;

    const rows = isAdmin
      ? await sql`
          SELECT
            t.*,
            COALESCE(mc.cnt, 0) AS message_count
          FROM support_tickets t
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS cnt
            FROM support_ticket_messages m
            WHERE m.ticket_id = t.id
          ) mc ON TRUE
          WHERE t.is_archived = ${isArchived}
            AND (${!hasStatus}::boolean OR t.status = ${statusValue})
            AND (${!hasProject}::boolean OR t.project = ${projectValue})
            AND (${!hasPriority}::boolean OR t.priority = ${priorityValue})
            AND (
              ${!hasSearch}::boolean
              OR t.title ILIKE ${searchLike}
              OR t.user_name ILIKE ${searchLike}
              OR t.user_email ILIKE ${searchLike}
              OR t.ticket_number::text = ${trimmedSearch}
            )
          ORDER BY t.updated_at DESC
        `
      : await sql`
          SELECT
            t.*,
            COALESCE(mc.cnt, 0) AS message_count
          FROM support_tickets t
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS cnt
            FROM support_ticket_messages m
            WHERE m.ticket_id = t.id
          ) mc ON TRUE
          WHERE (t.user_id = ${me.id} OR t.user_id = ${me.email} OR t.user_email = ${me.email})
            AND t.is_archived = ${isArchived}
            AND (${!hasStatus}::boolean OR t.status = ${statusValue})
            AND (${!hasProject}::boolean OR t.project = ${projectValue})
            AND (${!hasPriority}::boolean OR t.priority = ${priorityValue})
            AND (
              ${!hasSearch}::boolean
              OR t.title ILIKE ${searchLike}
              OR t.ticket_number::text = ${trimmedSearch}
            )
          ORDER BY t.updated_at DESC
        `;

    return {
      isAdmin,
      success: true,
      tickets: rows.map((r) => mapTicketRow(r)),
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des tickets:", error);
    return {
      error: error?.message || "Impossible de récupérer les tickets.",
      success: false,
      tickets: [],
    };
  }
}

/**
 * Récupère le détail d'un ticket, messages et pièces jointes
 */
export async function getTicketDetails(
  ticketId: string
): Promise<SupportTicketDetailsResult> {
  try {
    if (!UUID_REGEX.test(ticketId)) {
      return { error: "Ticket introuvable.", success: false };
    }
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();
    const isAdmin = me.isAdmin;

    const ticketRows = await sql`
      SELECT * FROM support_tickets WHERE id = ${ticketId}::uuid LIMIT 1
    `;

    if (ticketRows.length === 0) {
      return { error: "Ticket introuvable.", success: false };
    }

    const r = ticketRows[0];

    // Vérif sécurité : seul admin ou owner (fail-closed)
    if (!isAdmin && !isTicketOwner(r, me)) {
      return {
        error: "Vous n'avez pas l'autorisation d'accéder à ce ticket.",
        success: false,
      };
    }

    const [messagesRows, attachmentsRows] = await Promise.all([
      sql`
        SELECT * FROM support_ticket_messages
        WHERE ticket_id = ${ticketId}::uuid
        ORDER BY created_at ASC
      `,
      sql`
        SELECT * FROM support_ticket_attachments
        WHERE ticket_id = ${ticketId}::uuid
        ORDER BY created_at ASC
      `.catch(() => [] as Record<string, any>[]),
    ]);

    const ticket: SupportTicket = mapTicketRow(r);
    const messages: SupportMessage[] = messagesRows.map((m) =>
      mapMessageRow(m)
    );
    const attachments: SupportAttachment[] = attachmentsRows.map((a) =>
      mapAttachmentRow(a)
    );

    // Attacher les fichiers à leurs messages pour affichage timeline
    const attachmentsByMessage = new Map<string, SupportAttachment[]>();
    for (const a of attachments) {
      const mid = a.message_id || "__ticket__";
      const bucket = attachmentsByMessage.get(mid);
      if (bucket) {
        bucket.push(a);
      } else {
        attachmentsByMessage.set(mid, [a]);
      }
    }
    const messagesWithAttachments: SupportMessage[] = messages.map((m) => ({
      ...m,
      attachments: attachmentsByMessage.get(m.id) || [],
    }));

    return {
      attachments,
      isAdmin,
      messages: messagesWithAttachments,
      success: true,
      ticket,
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération du ticket:", error);
    return {
      error: error?.message || "Impossible de charger le ticket.",
      success: false,
    };
  }
}

/**
 * Ajoute une réponse ou met à jour le statut d'un ticket
 * Gère 'reopened' : seule transition autorisée depuis resolved/closed, reset resolved_at
 * Gère flag IA et liaison des attachments
 */
export async function addTicketResponse({
  ticketId,
  message,
  newStatus,
  isAiGenerated,
  attachmentIds,
}: {
  ticketId: string;
  message: string;
  newStatus?: SupportTicketStatus;
  isAiGenerated?: boolean;
  attachmentIds?: string[];
}) {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();
    const isAdmin = me.isAdmin;
    const role = isAdmin ? "admin" : "user";
    const senderId = me.id;
    const senderEmail = me.email;
    const senderName = me.name;

    // 1. Récupérer ticket actuel
    const ticketRows = await sql`
      SELECT * FROM support_tickets WHERE id = ${ticketId}::uuid LIMIT 1
    `;
    if (ticketRows.length === 0) {
      return { error: "Ticket introuvable.", success: false };
    }
    const ticket = ticketRows[0] as SupportTicket;
    const currentStatus = ticket.status as SupportTicketStatus;

    // Vérif sécurité : seul admin ou owner (fail-closed)
    if (!isAdmin && !isTicketOwner(ticket, me)) {
      return {
        error: "Vous n'avez pas l'autorisation d'intervenir sur ce ticket.",
        success: false,
      };
    }

    const trimmedMsg = message.trim();
    const hasAttachments = !!(attachmentIds && attachmentIds.length > 0);
    if (!trimmedMsg && !newStatus && !hasAttachments) {
      return {
        error: "Veuillez fournir un message, un fichier ou un nouveau statut.",
        success: false,
      };
    }

    // 2. Validation transition statut : si terminal, seul reopened autorisé
    if (newStatus && newStatus !== currentStatus) {
      const allowed = getAllowedStatusTransitions(currentStatus);
      if (!allowed.includes(newStatus as SupportTicketStatus)) {
        return {
          error:
            currentStatus === "resolved" || currentStatus === "closed"
              ? "Ce ticket est fermé. Seule l'option 'Réouvert' est disponible."
              : `Transition de statut non autorisée : ${currentStatus} → ${newStatus}`,
          success: false,
        };
      }
      // Seul admin ou owner peut rouvrir → autoriser les deux (spec: User + Admin)
      // pas de restriction supplémentaire
    }

    // 3. Vérif quota fichiers : 5 par rôle par ticket
    if (hasAttachments) {
      try {
        const countRows = await sql`
          SELECT COUNT(*) as cnt FROM support_ticket_attachments
          WHERE ticket_id = ${ticketId}::uuid AND uploader_role = ${role}
        `;
        const existingCount = Number.parseInt(countRows[0]?.cnt || "0", 10);
        if (
          existingCount + (attachmentIds?.length || 0) >
          SUPPORT_ATTACHMENT_LIMITS.MAX_FILES_PER_ROLE_PER_TICKET
        ) {
          return {
            error: `Limite atteinte : ${SUPPORT_ATTACHMENT_LIMITS.MAX_FILES_PER_ROLE_PER_TICKET} fichiers maximum par ${role === "admin" ? "administrateur" : "utilisateur"} pour cette conversation. Vous avez déjà ${existingCount} fichier(s).`,
            success: false,
          };
        }
      } catch {}
    }

    // 4. Insérer le message si présent (ou si attachments seuls, créer message vide avec attachments)
    let newMessageId: string | null = null;
    if (trimmedMsg || hasAttachments) {
      const isAi = !!(isAdmin && isAiGenerated);
      const msgType = trimmedMsg ? "message" : "message";
      const msgText = trimmedMsg || (hasAttachments ? "Fichiers joints" : "");
      const inserted = await sql`
        INSERT INTO support_ticket_messages (
          ticket_id,
          sender_id,
          sender_email,
          sender_name,
          sender_role,
          message,
          action_type,
          is_ai_generated
        ) VALUES (
          ${ticketId}::uuid,
          ${senderId},
          ${senderEmail},
          ${senderName},
          ${role},
          ${msgText},
          ${msgType},
          ${isAi}
        )
        RETURNING id
      `;
      newMessageId = inserted[0]?.id || null;

      // Lier attachments au nouveau message
      if (newMessageId && attachmentIds && attachmentIds.length > 0) {
        for (const attId of attachmentIds) {
          try {
            await sql`
              UPDATE support_ticket_attachments
              SET message_id = ${newMessageId}::uuid, ticket_id = ${ticketId}::uuid
              WHERE id = ${attId}::uuid
                AND (uploader_id = ${me.id} OR uploader_id = ${me.email} OR uploader_email = ${me.email})
            `;
          } catch {}
        }
      }
    }

    // 5. Mettre à jour le statut si spécifié
    let statusToApply: SupportTicketStatus =
      (newStatus as SupportTicketStatus) ||
      (currentStatus as SupportTicketStatus);
    // Si admin répond sans changer statut et ticket est open → passe en in_progress automatiquement (sauf si déjà terminal/archived)
    if (!newStatus && trimmedMsg && isAdmin && currentStatus === "open") {
      statusToApply = "in_progress";
    }

    if (statusToApply !== currentStatus) {
      const isResolvedNow =
        statusToApply === "resolved" || statusToApply === "closed";
      const isReopenedNow = statusToApply === "reopened";
      const isArchivedNow = statusToApply === "archived";

      if (isReopenedNow) {
        await sql`
          UPDATE support_tickets
          SET 
            status = ${statusToApply},
            updated_at = NOW(),
            resolved_at = NULL,
            is_archived = FALSE,
            archived_at = NULL
          WHERE id = ${ticketId}::uuid
        `;
      } else if (isArchivedNow) {
        await sql`
          UPDATE support_tickets
          SET 
            status = 'archived',
            is_archived = TRUE,
            archived_at = NOW(),
            updated_at = NOW()
          WHERE id = ${ticketId}::uuid
        `;
      } else if (isResolvedNow) {
        await sql`
          UPDATE support_tickets
          SET 
            status = ${statusToApply},
            updated_at = NOW(),
            resolved_at = NOW(),
            is_archived = FALSE
          WHERE id = ${ticketId}::uuid
        `;
      } else {
        await sql`
          UPDATE support_tickets
          SET 
            status = ${statusToApply},
            updated_at = NOW(),
            is_archived = FALSE,
            archived_at = NULL
          WHERE id = ${ticketId}::uuid
        `;
      }

      // Message système status_change
      const statusLabels: Record<string, string> = {
        archived: "Archivé",
        closed: "Fermé",
        in_progress: "En cours de traitement",
        open: "Ouvert",
        reopened: "Réouvert",
        resolved: "Résolu",
        waiting_user: "En attente de l'utilisateur",
      };

      await sql`
        INSERT INTO support_ticket_messages (
          ticket_id,
          sender_id,
          sender_email,
          sender_name,
          sender_role,
          message,
          action_type
        ) VALUES (
          ${ticketId}::uuid,
          ${senderId},
          ${senderEmail},
          ${senderName},
          'system',
          ${`Statut mis à jour : ${statusLabels[statusToApply] || statusToApply}`},
          'status_change'
        )
      `;
    } else if (trimmedMsg || hasAttachments) {
      // même si statut inchangé mais message envoyé, toucher updated_at pour anti-purge 365j
      await sql`UPDATE support_tickets SET updated_at = NOW() WHERE id = ${ticketId}::uuid`;
    }

    // 6. Emails
    try {
      const emailPayload: SupportTicketEmailPayload = {
        category: ticket.category,
        description: ticket.description,
        id: ticket.id,
        isAiGenerated: !!(isAdmin && isAiGenerated),
        priority: ticket.priority,
        project: ticket.project,
        status: statusToApply,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        user_email: ticket.user_email,
        user_id: ticket.user_id,
        user_name: ticket.user_name,
      };

      if (isAdmin) {
        await sendSupportTicketUpdateEmail({
          appUrl: getAppUrl(),
          authorRole: "admin",
          isAiGenerated: !!isAiGenerated,
          message:
            trimmedMsg ||
            (hasAttachments
              ? "De nouveaux fichiers ont été joints à votre ticket."
              : `Le statut de votre demande est désormais : ${statusToApply}`),
          newStatus:
            statusToApply === currentStatus ? undefined : statusToApply,
          recipientEmail: ticket.user_email,
          recipientName: ticket.user_name,
          ticket: emailPayload,
        });
      } else {
        await sendSupportTicketUpdateEmail({
          appUrl: getAppUrl(),
          authorRole: "user",
          message:
            trimmedMsg ||
            (hasAttachments
              ? "L'utilisateur a joint de nouveaux fichiers."
              : `L'utilisateur a actualisé le statut en : ${statusToApply}`),
          newStatus:
            statusToApply === currentStatus ? undefined : statusToApply,
          recipientEmail: ADMIN_EMAIL,
          recipientName: "mAI",
          ticket: emailPayload,
        });
      }
    } catch (err) {
      console.error("[SUPPORT NOTIFICATION EMAIL ERROR]", err);
    }

    return { messageId: newMessageId, success: true };
  } catch (error: any) {
    console.error("Erreur lors de l'ajout de la réponse:", error);
    return {
      error:
        error?.message ||
        "Une erreur est survenue lors de l'envoi de la réponse.",
      success: false,
    };
  }
}

/**
 * Renomme un ticket (titre) — owner ou admin uniquement
 */
export async function updateTicketTitle({
  ticketId,
  newTitle,
}: {
  ticketId: string;
  newTitle: string;
}) {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();
    const trimmed = newTitle.trim();
    if (trimmed.length < 3 || trimmed.length > 120) {
      return {
        error: "Le titre doit contenir entre 3 et 120 caractères.",
        success: false,
      };
    }
    const rows =
      await sql`SELECT * FROM support_tickets WHERE id = ${ticketId}::uuid LIMIT 1`;
    if (rows.length === 0)
      return { error: "Ticket introuvable.", success: false };
    const ticket = rows[0];
    const isAdmin = me.isAdmin;
    if (!isAdmin && !isTicketOwner(ticket, me)) {
      return { error: "Non autorisé à renommer ce ticket.", success: false };
    }
    if (ticket.title === trimmed) return { success: true };

    await sql`UPDATE support_tickets SET title = ${trimmed}, updated_at = NOW() WHERE id = ${ticketId}::uuid`;
    await sql`
      INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_email, sender_name, sender_role, message, action_type)
      VALUES (${ticketId}::uuid, ${me.id}, ${me.email}, ${me.name}, ${isAdmin ? "admin" : "user"}, ${`Titre renommé : "${trimmed}"`}, 'title_change')
    `;
    return { success: true };
  } catch (error: any) {
    console.error("Erreur rename ticket:", error);
    return {
      error: error?.message || "Impossible de renommer le ticket.",
      success: false,
    };
  }
}

/**
 * Archive / Désarchive un ticket
 */
export async function archiveTicket({
  ticketId,
  archive,
}: {
  ticketId: string;
  archive: boolean;
}) {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();
    const rows =
      await sql`SELECT * FROM support_tickets WHERE id = ${ticketId}::uuid LIMIT 1`;
    if (rows.length === 0)
      return { error: "Ticket introuvable.", success: false };
    const ticket = rows[0];
    const isAdmin = me.isAdmin;
    if (!isAdmin && !isTicketOwner(ticket, me)) {
      return { error: "Non autorisé à archiver ce ticket.", success: false };
    }

    if (archive) {
      await sql`
        UPDATE support_tickets
        SET status='archived', is_archived=TRUE, archived_at=NOW(), updated_at=NOW()
        WHERE id = ${ticketId}::uuid
      `;
      await sql`
        INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_email, sender_name, sender_role, message, action_type)
        VALUES (${ticketId}::uuid, ${me.id}, ${me.email}, ${me.name}, ${isAdmin ? "admin" : "user"}, 'Ticket archivé', 'archived')
      `;
    } else {
      await sql`
        UPDATE support_tickets
        SET status='open', is_archived=FALSE, archived_at=NULL, updated_at=NOW()
        WHERE id = ${ticketId}::uuid
      `;
      await sql`
        INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_email, sender_name, sender_role, message, action_type)
        VALUES (${ticketId}::uuid, ${me.id}, ${me.email}, ${me.name}, ${isAdmin ? "admin" : "user"}, 'Ticket désarchivé', 'unarchived')
      `;
    }
    return { success: true };
  } catch (error: any) {
    console.error("Erreur archive ticket:", error);
    return {
      error: error?.message || "Impossible d'archiver le ticket.",
      success: false,
    };
  }
}

/**
 * Suppression définitive (hard delete) — owner ou admin
 * Supprime le ticket, ses messages et attachments (CASCADE). Le cron purge Z1 séparément pour les tickets purgés auto.
 */
export async function deleteTicket({ ticketId }: { ticketId: string }) {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();
    const rows =
      await sql`SELECT * FROM support_tickets WHERE id = ${ticketId}::uuid LIMIT 1`;
    if (rows.length === 0)
      return { error: "Ticket introuvable.", success: false };
    const ticket = rows[0];
    const isAdmin = me.isAdmin;
    if (!isAdmin && !isTicketOwner(ticket, me)) {
      return { error: "Non autorisé à supprimer ce ticket.", success: false };
    }

    // Récupérer les clés Z1 pour éventuelle suppression côté API (le cron s'en chargera sinon)
    let fileKeys: string[] = [];
    try {
      const attRows =
        await sql`SELECT file_key, file_url FROM support_ticket_attachments WHERE ticket_id = ${ticketId}::uuid`;
      fileKeys = attRows
        .map((r: any) => r.file_key || r.file_url)
        .filter(Boolean);
    } catch {}

    await sql`DELETE FROM support_tickets WHERE id = ${ticketId}::uuid`;

    return { purgedFileKeys: fileKeys, success: true };
  } catch (error: any) {
    console.error("Erreur delete ticket:", error);
    return {
      error: error?.message || "Impossible de supprimer le ticket.",
      success: false,
    };
  }
}

/**
 * Purge cron : supprime les tickets inactifs depuis 365 jours (365*24h)
 * Appelée par /api/cron/purge-support
 */
export async function purgeInactiveTickets(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const sql = await getSql();
    const res = await sql`SELECT purge_inactive_support_tickets() as deleted`;
    const deletedCount = Number.parseInt(res[0]?.deleted || "0", 10);
    return { deletedCount, success: true };
  } catch (error: any) {
    console.error("Erreur purge tickets:", error);
    return { error: error?.message, success: false };
  }
}

/**
 * Récupère les statistiques complètes de support pour le dashboard
 */
export async function getSupportStats(): Promise<SupportStatsResult> {
  try {
    const me = await resolveSupportUserFast();
    if (!me) return AUTH_REQUIRED;
    const sql = await getSql();
    const isAdmin = me.isAdmin;

    const [agg, breakdownRows, timelineRows] = await Promise.all([
      computeTicketAggregations(sql, me),
      isAdmin
        ? sql`
            SELECT
              GROUPING(project)::int AS g_project,
              GROUPING(priority)::int AS g_priority,
              GROUPING(category)::int AS g_category,
              project,
              priority,
              category,
              COUNT(*)::int AS count
            FROM support_tickets
            WHERE is_archived = FALSE
            GROUP BY GROUPING SETS ((project), (priority), (category))
          `
        : sql`
            SELECT
              GROUPING(project)::int AS g_project,
              GROUPING(priority)::int AS g_priority,
              GROUPING(category)::int AS g_category,
              project,
              priority,
              category,
              COUNT(*)::int AS count
            FROM support_tickets
            WHERE (user_id = ${me.id} OR user_id = ${me.email} OR user_email = ${me.email})
              AND is_archived = FALSE
            GROUP BY GROUPING SETS ((project), (priority), (category))
          `,
      isAdmin
        ? sql`
            SELECT
              TO_CHAR(DATE(created_at), 'DD/MM') AS date_label,
              COUNT(*)::int AS total_created,
              COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::int AS total_resolved
            FROM support_tickets
            WHERE created_at >= NOW() - INTERVAL '14 days'
            GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'DD/MM')
            ORDER BY DATE(created_at) ASC
          `
        : sql`
            SELECT
              TO_CHAR(DATE(created_at), 'DD/MM') AS date_label,
              COUNT(*)::int AS total_created,
              COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::int AS total_resolved
            FROM support_tickets
            WHERE (user_id = ${me.id} OR user_id = ${me.email} OR user_email = ${me.email})
              AND created_at >= NOW() - INTERVAL '14 days'
            GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'DD/MM')
            ORDER BY DATE(created_at) ASC
          `,
    ]);

    const byProject: { name: string; value: number }[] = [];
    const byPriority: {
      color: string;
      key: string;
      name: string;
      value: number;
    }[] = [];
    const byCategory: { name: string; value: number }[] = [];

    for (const r of breakdownRows) {
      const value = parseCount(r.count);
      if (parseCount(r.g_project) === 0 && r.project !== null) {
        byProject.push({ name: String(r.project), value });
      } else if (parseCount(r.g_priority) === 0 && r.priority !== null) {
        const key = String(r.priority);
        byPriority.push({
          color: PRIORITY_COLORS[key] || "#8b5cf6",
          key,
          name: PRIORITY_LABELS[key] || key,
          value,
        });
      } else if (parseCount(r.g_category) === 0 && r.category !== null) {
        byCategory.push({ name: String(r.category), value });
      }
    }

    byProject.sort((a, b) => b.value - a.value);
    byCategory.sort((a, b) => b.value - a.value);

    const timeline = timelineRows.map((r) => ({
      crees: parseCount(r.total_created),
      date: String(r.date_label ?? ""),
      resolus: parseCount(r.total_resolved),
    }));

    return {
      isAdmin,
      stats: {
        archived: agg.archived,
        avgResolutionHours: agg.avgResolutionHours,
        byCategory,
        byPriority,
        byProject,
        closed: agg.closed,
        inProgress: agg.inProgress,
        open: agg.open,
        reopened: agg.reopened,
        resolutionRate: agg.resolutionRate,
        resolved: agg.resolved,
        timeline,
        total: agg.total,
        totalWithArchived: agg.totalWithArchived,
        waiting: agg.waiting,
      },
      success: true,
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des stats support:", error);
    return {
      error: error?.message || "Impossible de charger les statistiques.",
      success: false,
    };
  }
}

/**
 * Récupère les attachments d'un ticket (helper pour upload limit)
 */
export async function getTicketAttachments(ticketId: string) {
  try {
    if (!UUID_REGEX.test(ticketId)) {
      return { attachments: [], error: "Ticket introuvable.", success: false };
    }
    const me = await resolveSupportUserFast();
    if (!me) return { ...AUTH_REQUIRED, attachments: [] };
    const sql = await getSql();
    const ticketRows =
      await sql`SELECT user_id, user_email FROM support_tickets WHERE id = ${ticketId}::uuid LIMIT 1`;
    if (ticketRows.length === 0)
      return { attachments: [], error: "Ticket introuvable.", success: false };
    if (!me.isAdmin && !isTicketOwner(ticketRows[0], me)) {
      return { attachments: [], error: "Non autorisé.", success: false };
    }
    const rows =
      await sql`SELECT * FROM support_ticket_attachments WHERE ticket_id = ${ticketId}::uuid ORDER BY created_at ASC`;
    return { attachments: rows.map(mapAttachmentRow), success: true };
  } catch (e: any) {
    return { attachments: [], error: e?.message, success: false };
  }
}
