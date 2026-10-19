-- Migration 0047 : persona PUBLIÉE d'un Wakie et provenance d'un clone.
-- Additive et idempotente : sûre à rejouer sur une base déjà migrée.
--
-- POURQUOI UNE COLONNE DISTINCTE PLUTÔT QUE RÉUTILISER `instructions`
--
-- `instructions` est le prompt privé du propriétaire. Dès qu'un Wakie devient
-- public — annuaire, @mention, fiche consultée par un autre compte — ce texte
-- ne doit JAMAIS sortir : la persona publiée est un texte séparé, écrit
-- volontairement par le propriétaire, et c'est la SEULE chose que l'annuaire,
-- les mentions et le clonage exposent. Défaut vide : aucun Wakie existant ne
-- change de visibilité ni de comportement sans geste explicite.
--
-- `clonedFromWakieId` conserve la provenance d'un clone : attribution visible
-- dans l'interface (« Cloné de @pseudo ») et trace de ce qui a été copié.
-- `SET NULL` : supprimer l'original ne supprime ni n'invalide jamais le clone,
-- qui appartient à un autre compte.

ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "publicPersona" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "clonedFromWakieId" uuid REFERENCES "WakiesWakie"("id") ON DELETE SET NULL;
