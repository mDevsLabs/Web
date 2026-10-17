export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed"
  | "reopened"
  | "archived";

export type SupportPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicket {
  archived_at?: string | null;
  attachments?: SupportAttachment[];
  category: string;
  created_at: string;
  description: string;
  id: string;
  is_archived?: boolean;
  message_count?: number;
  metadata?: any;
  priority: SupportPriority;
  project: string;
  resolved_at: string | null;
  status: SupportTicketStatus;
  ticket_number: number;
  title: string;
  updated_at: string;
  user_email: string;
  user_id: string;
  user_name: string;
  user_tier: string;
}

export interface SupportMessage {
  action_type:
    | "message"
    | "status_change"
    | "priority_change"
    | "created"
    | "title_change"
    | "archived"
    | "unarchived"
    | "deleted";
  attachments?: SupportAttachment[];
  created_at: string;
  id: string;
  is_ai_generated?: boolean;
  is_edited?: boolean;
  message: string;
  sender_email: string;
  sender_id: string;
  sender_name: string;
  sender_role: "user" | "admin" | "system";
  ticket_id: string;
}

export interface SupportAttachment {
  created_at: string;
  file_key: string;
  file_name: string;
  file_size: number;
  file_url: string;
  id: string;
  message_id?: string | null;
  mime_type: string;
  ticket_id: string;
  uploader_email?: string;
  uploader_id: string;
  uploader_role: "user" | "admin";
}

export const ADMIN_EMAIL = "mathias.tss2012@gmail.com";

// Limites fichiers support (Z1 Storage)
export const SUPPORT_ATTACHMENT_LIMITS = {
  ALLOWED_EXTS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".txt",
    ".md",
  ] as const,
  ALLOWED_MIMES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "text/plain",
    "text/markdown",
  ] as const,
  MAX_FILE_SIZE: 8 * 1024 * 1024, // 8 Mo
  MAX_FILES_PER_ROLE_PER_TICKET: 5, // 5 user + 5 admin par conversation
} as const;

export function isAllowedSupportMime(mime: string, fileName?: string): boolean {
  const normalized = (mime || "").trim().toLowerCase();
  const allowedMimes =
    SUPPORT_ATTACHMENT_LIMITS.ALLOWED_MIMES as readonly string[];
  if (allowedMimes.includes(normalized)) return true;
  // Certains navigateurs envoient application/octet-stream (ou rien) pour du texte : vérifier l'extension
  if (!normalized || normalized === "application/octet-stream") {
    if (fileName) {
      const ext = "." + (fileName.split(".").pop() || "").toLowerCase();
      return (
        SUPPORT_ATTACHMENT_LIMITS.ALLOWED_EXTS as readonly string[]
      ).includes(ext);
    }
  }
  return false;
}

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  archived: "Archivé",
  closed: "Fermé",
  in_progress: "En cours de traitement",
  open: "Ouvert",
  reopened: "Réouvert",
  resolved: "Résolu",
  waiting_user: "En attente de l'utilisateur",
};

// Statuts terminaux : seule transition autorisée = reopened
export function isTerminalStatus(status: string): boolean {
  return status === "resolved" || status === "closed";
}

export function getAllowedStatusTransitions(
  currentStatus: SupportTicketStatus
): SupportTicketStatus[] {
  if (isTerminalStatus(currentStatus)) {
    return ["reopened"];
  }
  if (currentStatus === "reopened") {
    // après réouverture, retour cycle normal
    return [
      "open",
      "in_progress",
      "waiting_user",
      "resolved",
      "closed",
      "archived",
    ];
  }
  if (currentStatus === "archived") {
    return ["open", "reopened"]; // désarchiver
  }
  return [
    "open",
    "in_progress",
    "waiting_user",
    "resolved",
    "closed",
    "reopened",
    "archived",
  ];
}
