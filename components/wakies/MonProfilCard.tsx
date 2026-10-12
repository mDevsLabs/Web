"use client";

/**
 * Carte « Mon profil » : profil Vibe de l'utilisateur, lu en lecture seule.
 *
 * Vibe fait foi : cette carte affiche et renvoie vers Vibe pour modifier.
 * Les Wakies consultent le même endpoint côté serveur pour mieux connaître
 * l'utilisateur (`GET /api/wakies/me/profile`).
 */

import { Button } from "@mdevs/ui/primitives/button";
import Link from "next/link";
import { useId } from "react";
import useSWR from "swr";
import { api } from "@/components/wakies/api";

type MonProfil = {
  avatarUrl: string | null;
  bio: string;
  displayName: string;
  username: string;
};

export function MonProfilCard() {
  const instance = useId();
  const {
    data: profil,
    error: erreur,
    isLoading,
    mutate,
  } = useSWR<MonProfil>(
    ["wakies-my-profile", instance],
    () => api("/me/profile"),
    { revalidateOnFocus: true }
  );
  return (
    <article className="memory-card">
      {erreur ? (
        <div className="sidebar-error" role="alert">
          <p>
            {erreur instanceof Error
              ? erreur.message
              : "Profil indisponible pour l’instant."}
          </p>
          <Button
            disabled={isLoading}
            onClick={() => void mutate().catch(() => {})}
            variant="outline"
          >
            Recharger mon profil
          </Button>
        </div>
      ) : null}
      {isLoading ? (
        <p className="muted" role="status">
          Chargement de votre profil…
        </p>
      ) : null}
      {profil ? (
        <div className="wakies-account-profile">
          {profil.avatarUrl ? (
            <img
              alt=""
              className="wakies-account-avatar"
              src={profil.avatarUrl}
            />
          ) : null}
          <div>
            <strong>{profil.displayName || profil.username}</strong>
            <small> @{profil.username}</small>
            <p className="muted">
              {profil.bio ||
                "Ajoutez une bio dans Vibe : vos Wakies vous connaîtront mieux."}
            </p>
            <small>
              Synchronisé depuis Vibe · modifiable dans Vibe uniquement.
            </small>
          </div>
        </div>
      ) : null}
      <Link
        className="md-button md-button-outline md-button-md wakies-profile-link"
        href="/vibe"
      >
        Modifier dans Vibe
      </Link>
    </article>
  );
}
