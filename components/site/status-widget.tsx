"use client";

/**
 * Pastille d'état des services, posée sur tout le site vitrine.
 *
 * Elle consultait `https://mai.instatus.com/summary.json` directement depuis le
 * navigateur. Cette origine n'est pas dans `connect-src` (`next.config.ts`) : la
 * requête échouait donc systématiquement, et le `.catch(() => {})` laissait la
 * pastille sur sa valeur d'initialisation `"UP"` — le site affichait
 * « Opérationnel » en permanence, y compris pendant un incident. Un widget de
 * statut qui ne peut pas se taire est pire qu'un widget absent : il détruit la
 * seule information qu'on lui demande de porter.
 *
 * Elle consomme désormais le proxy serveur `/api/site/v1/status`, qui a déjà un
 * délai, un cache de soixante secondes et un repli explicite `UNKNOWN`, et le
 * vocabulaire de `SupportServiceStatus` pour que les deux affichages disent les
 * mêmes mots du même état.
 */

import { useEffect, useState } from "react";
import Link from "@/components/site/router";
import {
  isAbortError,
  isStatusResponse,
  STATUS_PRESENTATION,
} from "@/components/site/support/support-status-presentation";
import type { SupportStatusResponse as SupportStatusPayload } from "@/components/site/support/support-status-types";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";

type Etat = "chargement" | "inconnu" | "prêt";

export function StatusWidget() {
  const [status, setStatus] = useState<SupportStatusPayload | null>(null);
  const [etat, setEtat] = useState<Etat>("chargement");
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setBannerOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener("mai:cookie-banner", handler);
    return () => window.removeEventListener("mai:cookie-banner", handler);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const lire = async () => {
      try {
        const response = await fetch(SITE_API_ROUTES.status, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Le service de statut a répondu ${response.status}.`);
        }
        const payload: unknown = await response.json();
        if (!isStatusResponse(payload)) {
          throw new Error("Réponse de statut invalide.");
        }
        setStatus(payload);
        setEtat("prêt");
      } catch (reason: unknown) {
        if (isAbortError(reason)) {
          return;
        }
        // Une panne n'est jamais une confirmation : la pastille passe à
        // « État indisponible », elle ne conserve pas ce qu'elle croyait savoir.
        setStatus(null);
        setEtat("inconnu");
      }
    };
    void lire();
    return () => controller.abort();
  }, []);

  // Évite le chevauchement avec le bandeau cookies (pleine largeur, en bas)
  if (bannerOpen) return null;

  if (etat === "chargement") {
    return (
      <span
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-50 flex items-center gap-2 max-w-[calc(100vw-2rem)] bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-full px-3 py-1.5"
        role="status"
      >
        <span className="shrink-0 w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 truncate">
          Vérification de l'état…
        </span>
      </span>
    );
  }

  const presentation =
    etat === "inconnu" || !status
      ? STATUS_PRESENTATION.UNKNOWN
      : STATUS_PRESENTATION[status.page.status];
  // Une réponse servie depuis le cache après une indisponibilité, ou un repli,
  // n'est pas un état frais : le titre le dit à l'utilisateur, qui peut ouvrir
  // la page de statut pour vérifier la source.
  const titre = status
    ? status.stale || status.source !== "instatus"
      ? `${presentation.description} Dernière observation connue : ${status.updatedAt}.`
      : presentation.description
    : "Le statut des services n'a pas pu être vérifié.";

  return (
    <Link
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-50 flex items-center gap-2 max-w-[calc(100vw-2rem)] bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-full px-3 py-1.5 hover:scale-105 transition-transform duration-200"
      href="https://mai.instatus.com/"
      rel="noopener noreferrer"
      target="_blank"
      title={titre}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 w-2 h-2 rounded-full ${presentation.dot}`}
      />
      <span className={`text-xs font-bold truncate ${presentation.text}`}>
        {presentation.label}
      </span>
    </Link>
  );
}
