import { tool } from "ai";
import { z } from "zod";
import type { MaiUser } from "@/lib/auth/session";
import { PROFILE_STATUS } from "./account-status";

export type ProfileChanges = {
  username?: { from: string; to: string };
  phone?: { from: string | null; to: string };
};

export type ProfileCurrent = { phone: string | null; username: string };

// Union complète : l'outil ne produit que les statuts « préparatoires », mais
// le statut final (submitted/cancelled) est renvoyé par la carte cliente via
// addToolOutput et doit être typé ici. Les échecs de validation serveur restent
// locaux à la carte (erreur inline + réessai) sans reprendre le flux.
export type UpdateAccountProfileOutput =
  | { status: "invalid"; error: string; current: ProfileCurrent }
  | { status: "no_change"; current: ProfileCurrent; message: string }
  | {
      status: "awaiting_user";
      current: ProfileCurrent;
      changes: ProfileChanges;
      message: string;
    }
  | {
      status: "submitted";
      success: true;
      current: ProfileCurrent;
      previous: ProfileCurrent;
      message: string;
    }
  | { status: "cancelled"; message: string };

function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s().-]/g, "").trim();
}

export const updateAccountProfileInput = z.object({
  phone: z
    .string()
    .min(6)
    .max(25)
    .optional()
    .describe(
      "Nouveau numéro de téléphone (6 à 25 caractères). Omettre si le téléphone ne change pas."
    ),
  reason: z
    .string()
    .max(200)
    .optional()
    .describe(
      "Raison courte de la demande, affichée dans la carte (ex: demande de l'utilisateur)."
    ),
  username: z
    .string()
    .min(2)
    .max(30)
    .optional()
    .describe(
      "Nouveau nom d'utilisateur (2 à 30 caractères : lettres minuscules, chiffres, _). Omettre si le nom d'utilisateur ne change pas."
    ),
});

export function updateAccountProfile({
  maiUser,
}: {
  maiUser: Pick<MaiUser, "username" | "phone">;
}) {
  return tool({
    description:
      "Prépare une modification du profil de l'utilisateur : nom d'utilisateur et/ou numéro de téléphone. N'appelle cet outil QUE si l'utilisateur demande explicitement de définir ou changer ces informations. L'outil ne modifie RIEN lui-même : il affiche une carte de confirmation où l'utilisateur saisit son propre mot de passe. Ne demande JAMAIS le mot de passe et n'affirme jamais que le changement est appliqué : attends le résultat (submitted ou cancelled) renvoyé par la carte. Une seule proposition à la fois : si une confirmation est déjà en attente, ne rappelle pas l'outil.",
    execute: async ({
      username,
      phone,
      reason: _reason,
    }): Promise<UpdateAccountProfileOutput> => {
      const current: ProfileCurrent = {
        phone: maiUser.phone || null,
        username: maiUser.username,
      };

      const nextUsername =
        username === undefined ? undefined : normalizeUsername(username);
      const nextPhone = phone === undefined ? undefined : normalizePhone(phone);

      if (nextUsername === undefined && nextPhone === undefined) {
        return {
          current,
          error:
            "Fournis au moins un champ à modifier (username ou phone) ou réponds directement à l'utilisateur.",
          status: PROFILE_STATUS.INVALID,
        };
      }

      if (nextUsername !== undefined && nextUsername.length < 2) {
        return {
          current,
          error:
            "Le nom d'utilisateur doit contenir au moins 2 caractères (lettres, chiffres, _).",
          status: PROFILE_STATUS.INVALID,
        };
      }

      if (nextPhone !== undefined && nextPhone.length < 6) {
        return {
          current,
          error:
            "Le numéro de téléphone est invalide (la suppression du numéro n'est pas prise en charge ici).",
          status: PROFILE_STATUS.INVALID,
        };
      }

      const changes: ProfileChanges = {};
      if (
        nextUsername !== undefined &&
        nextUsername !== normalizeUsername(current.username)
      ) {
        changes.username = { from: current.username, to: nextUsername };
      }
      if (
        nextPhone !== undefined &&
        nextPhone !== normalizePhone(current.phone || "")
      ) {
        changes.phone = { from: current.phone, to: nextPhone };
      }

      if (!(changes.username || changes.phone)) {
        return {
          current,
          message:
            "Aucune modification à appliquer : les valeurs proposées sont identiques aux valeurs actuelles.",
          status: PROFILE_STATUS.NO_CHANGE,
        };
      }

      return {
        changes,
        current,
        message:
          "Confirmation requise : l'utilisateur doit saisir son mot de passe dans la carte pour appliquer le changement.",
        status: PROFILE_STATUS.AWAITING,
      };
    },
    inputSchema: updateAccountProfileInput,
  });
}
