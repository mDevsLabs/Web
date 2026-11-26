-- Migration 0090: index de performance pour le portail d'assistance (/site/support).
-- Les tables support sont créées hors Drizzle (migrate-support-tables.js),
-- chaque index est donc conditionné par l'existence réelle de sa table.

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public."support_tickets"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_email"
      ON "support_tickets" ("user_email");
    CREATE INDEX IF NOT EXISTS "idx_support_tickets_archived_updated_at"
      ON "support_tickets" ("is_archived", "updated_at" DESC);
    CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_id_updated_at"
      ON "support_tickets" ("user_id", "updated_at" DESC);
    CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_email_updated_at"
      ON "support_tickets" ("user_email", "updated_at" DESC);
  END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public."support_ticket_messages"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "idx_support_messages_ticket_id_created_at"
      ON "support_ticket_messages" ("ticket_id", "created_at" ASC);
  END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public."support_ticket_attachments"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "idx_support_attachments_ticket_id_created_at"
      ON "support_ticket_attachments" ("ticket_id", "created_at" ASC);
  END IF;
END
$$;
