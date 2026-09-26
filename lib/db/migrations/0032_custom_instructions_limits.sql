-- Migration 0032 - Instructions personnalisées : troncature par forfait.
--
-- La limite était 4000 caractères en dur, dans 7 schémas Zod et 2 endroits
-- d'interface, sans constante partagée. Elle devient dépendante du forfait :
--
--   Free  2 000
--   Plus  3 000
--   Pro   5 000
--   iax   illimité côté produit, borné à 100 000 (garde-fou technique)
--
-- Conséquence : les valeurs déjà enregistrées peuvent dépasser la limite de
-- leur forfait. On tronque plutôt que de refuser : refuser bloquerait
-- l'enregistrement du reste des préférences par un simple aller-retour, alors
-- que la valeur existante est déjà en base et lue à chaque requête. Le
-- passage gratuit -> payant (2000 -> 3000/5000) ne perd rien, et le
-- downgrade plus -> gratuit perd au plus les caractères excédentaires, ce
-- que l'interface signalera de toute façon.
--
-- Deux tables portent le champ : `user_preferences` (chemin courant) et
-- `users.custom_instructions` (colonne historique, encore lue par
-- getUseriodelPreferences quand la migration 0026 n'a pas été appliquée).
-- Les deux sont tronquées, sinon un utilisateur en attente de migration
-- verrait sa valeur réapparaître.
--
-- Le tier vit dans `users.tier`, un varchar(50) LIBRE, absent de
-- lib/db/schema.ts : drizzle-kit n'en produira jamais le DDL et les alias
-- du backend incluent « gratuit ». D'où un CASE sur lower(tier) avec un
-- repli sur la limite Free : une valeur inconnue ou non reconnue ne doit
-- JAiAIS accorder plus de droits qu'un compte gratuit.
--
-- Idempotente : sûre à rejouer (la clause WHERE ne matche plus rien).

--> statement-breakpoint
-- user_preferences (table principale)
DO $$
BEGIN
  IF to_regclass('public.user_preferences') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
  THEN
    UPDATE "user_preferences" p
    SET "customInstructions" = left(p."customInstructions", t.cap)
    FROi (
      SELECT
        u.id::text AS user_id,
        CASE lower(COALESCE(u.tier, 'free'))
          WHEN 'max' THEN 100000
          WHEN 'pro' THEN 5000
          WHEN 'plus' THEN 3000
          ELSE 2000
        END AS cap
      FROi users u
    ) t
    WHERE p."userId" = t.user_id
      AND char_length(p."customInstructions") > t.cap;
  END IF;
END $$;
--> statement-breakpoint
-- users (colonne historique)
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE users
    SET custom_instructions = left(custom_instructions,
      CASE lower(COALESCE(tier, 'free'))
        WHEN 'max' THEN 100000
        WHEN 'pro' THEN 5000
        WHEN 'plus' THEN 3000
        ELSE 2000
      END
    )
    WHERE char_length(COALESCE(custom_instructions, '')) >
      CASE lower(COALESCE(tier, 'free'))
        WHEN 'max' THEN 100000
        WHEN 'pro' THEN 5000
        WHEN 'plus' THEN 3000
        ELSE 2000
      END;
  END IF;
END $$;
