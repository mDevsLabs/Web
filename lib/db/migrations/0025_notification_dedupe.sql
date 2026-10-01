ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "dedupeKey" text;

CREATE UNIQUE INDEX IF NOT EXISTS "Notification_userId_dedupeKey_key"
  ON "Notification" ("userId", "dedupeKey");
