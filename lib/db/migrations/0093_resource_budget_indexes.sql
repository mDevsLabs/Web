-- Migration 0093: index de lecture pour la résolution de session et la cloche.
-- La résolution de session filtre `users` par LOWER(email) / LOWER(username) :
-- sans index d'expression, chaque instance froide paie un seq scan. La cloche
-- trie par (userId, createdAt DESC) : l'index simple sur userId ne suffit pas
-- à éviter le tri. Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('"users"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "users_lower_email_idx"
      ON "users" (LOWER("email"));
    CREATE INDEX IF NOT EXISTS "users_lower_username_idx"
      ON "users" (LOWER("username"));
  END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('"Notification"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
      ON "Notification" ("userId", "createdAt" DESC);
  END IF;
END
$$;

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('token_blacklist') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "token_blacklist_token_idx"
      ON token_blacklist (token);
  END IF;
END
$$;
