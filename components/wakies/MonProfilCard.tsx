"use client";

/**
 * Carte « Mon profil » : profil Vibe de l'utilisateur, lu en lecture seule.
 *
 * Vibe fait foi : cette carte affiche et renvoie vers Vibe pour modifier.
 * Les Wakies consultent le même endpoint côté serveur pour mieux connaître
 * l'utilisateur (`GET /api/wakies/me/profile`).
 */

import { Button } from "@mdevs/ui/primitives/button";
import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";

type MonProfil = {
  avatarUrl: string | null;
  bio: string;
  displayName: string;
  username: string;
};

export function MonProfilCard() {
  const [profil, setProfil] = useState<MonProfil | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    void api<MonProfil>("/me/profile")
      .then(setProfil)
      .catch(() => setErreur("Profil indisponible pour l'instant."));
  }, []);

  if (erreur) return <p className="muted">{erreur}</p>;
  if (!profil) return <p className="muted">Chargement de votre profil…</p>;
  return (
    <article className="memory-card">
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
      <a className="text-button" href="/vibe">
        <Button type="button" variant="outline">
          Modifier dans Vibe
        </Button>
      </a>
    </article>
  );
}
