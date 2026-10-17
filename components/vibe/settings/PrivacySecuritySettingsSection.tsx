/**
 * ============================================================================
 * VIBE — SÉCURITÉ & CONFIDENTIALITÉ (components/vibe/settings/PrivacySecuritySettingsSection.tsx)
 * Section Paramètres : 2FA, permissions DM, traduction DM, mentions, co-auteurs, coche bleue.
 * ============================================================================
 */

import { ShieldIcon as Shield } from "@mdevs/icons";
import type React from "react";
import { TRANSLATION_LANGUAGES } from "@/lib/vibe/services/api";

export interface PrivacySecuritySettingsSectionProps {
  allowDms: "everyone" | "following" | "nobody";
  allowMentions: "everyone" | "following" | "nobody";
  canHideVerifiedBadge: boolean;
  collabAutoAccept: boolean;
  dmAutoTranslate: boolean;
  dmTranslateLang: string;
  hideVerifiedBadge: boolean;
  setAllowDms: (val: "everyone" | "following" | "nobody") => void;
  setAllowMentions: (val: "everyone" | "following" | "nobody") => void;
  setCollabAutoAccept: (val: boolean) => void;
  setDmAutoTranslate: (val: boolean) => void;
  setDmTranslateLang: (val: string) => void;
  setHideVerifiedBadge: (val: boolean) => void;
}

export const PrivacySecuritySettingsSection: React.FC<
  PrivacySecuritySettingsSectionProps
> = ({
  allowDms,
  setAllowDms,
  dmAutoTranslate,
  setDmAutoTranslate,
  dmTranslateLang,
  setDmTranslateLang,
  allowMentions,
  setAllowMentions,
  collabAutoAccept,
  setCollabAutoAccept,
  canHideVerifiedBadge,
  hideVerifiedBadge,
  setHideVerifiedBadge,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Shield className="w-4 h-4 text-white" />
        <span>Sécurité &amp; Confidentialité</span>
      </div>

      <div className="space-y-4 text-xs">
        {/* 2FA — Actif et obligatoire */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-xs">
                Double authentification (2FA)
              </span>
              <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-full font-bold">
                ACTIF
              </span>
            </div>
            <p className="text-zinc-500 text-[11px] mt-0.5">
              La 2FA est activée sur votre compte et obligatoire sur Vibe.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-zinc-900">
          <label className="text-zinc-400 font-mono uppercase text-[11px]">
            Qui peut vous envoyer des messages privés (DM)
          </label>
          <select
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
            onChange={(e) => setAllowDms(e.target.value as any)}
            value={allowDms}
          >
            <option value="everyone">Tout le monde</option>
            <option value="following">Mes abonnements uniquement</option>
            <option value="nobody">Personne (DMs désactivés)</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-900">
          <div>
            <span className="font-semibold text-white">
              Traduction automatique des messages
            </span>
            <p className="text-zinc-500 text-[11px]">
              Traduit automatiquement les messages privés reçus dans la langue
              choisie.
            </p>
          </div>
          <input
            checked={dmAutoTranslate}
            className="w-4 h-4 accent-white cursor-pointer shrink-0"
            onChange={(e) => setDmAutoTranslate(e.target.checked)}
            type="checkbox"
          />
        </div>
        {dmAutoTranslate && (
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-mono uppercase text-[11px]">
              Langue de la traduction automatique
            </label>
            <select
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
              onChange={(e) => setDmTranslateLang(e.target.value)}
              value={dmTranslateLang}
            >
              {TRANSLATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5 pt-2 border-t border-zinc-900">
          <label className="text-zinc-400 font-mono uppercase text-[11px]">
            Qui peut vous mentionner (@pseudo)
          </label>
          <select
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
            onChange={(e) => setAllowMentions(e.target.value as any)}
            value={allowMentions}
          >
            <option value="everyone">Tout le monde</option>
            <option value="following">Mes abonnements uniquement</option>
            <option value="nobody">Personne</option>
          </select>
        </div>

        {/* Co-auteurs : auto-acceptation des co-signatures (sans invitation) */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <div>
            <span className="font-semibold text-white">
              Co-auteurs sans invitation
            </span>
            <p className="text-zinc-500 text-[11px]">
              Quand quelqu'un vous désigne co-auteur d'une publication, la
              co-signature est acceptée automatiquement (simple notification,
              aucune validation).
            </p>
          </div>
          <input
            checked={collabAutoAccept}
            className="w-4 h-4 accent-white cursor-pointer"
            onChange={(e) => setCollabAutoAccept(e.target.checked)}
            type="checkbox"
          />
        </div>

        {canHideVerifiedBadge && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
            <div>
              <span className="font-semibold text-white">
                Masquer la coche bleue
              </span>
              <p className="text-zinc-500 text-[11px]">
                Retire le badge vérifié de votre profil public, même avec un
                abonnement Plus, Pro ou Max.
              </p>
            </div>
            <input
              checked={hideVerifiedBadge}
              className="w-4 h-4 accent-white cursor-pointer"
              onChange={(e) => setHideVerifiedBadge(e.target.checked)}
              type="checkbox"
            />
          </div>
        )}
      </div>
    </div>
  );
};
