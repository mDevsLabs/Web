"use client";

import { Loader2Icon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProjectIcon } from "@/components/chat/project-icon";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/lib/api/client-error";

// Rejoindre un projet partagé via lien ou code. AUCUNE donnée privée n'est
// servie sur cette page : l'API de join ne renvoie que le rôle et l'id projet
// après authentification, et un utilisateur non connecté est redirigé vers la
// page d'authentification avec retour ici.
export default function ProjectJoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;
  const [isJoining, setIsJoining] = useState(false);
  const [notAuthenticated, setNotAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // La session est requise : on la vérifie via une route existante légère.
    fetch("/api/user/me", { method: "GET" })
      .then((res) => {
        if (cancelled) {
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setNotAuthenticated(true);
        }
        setIsChecking(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch("/api/projects/join", {
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(extractApiErrorMessage(data) || "Impossible de rejoindre ce projet.");
        return;
      }
      if (data.projectId) {
        toast.success(
          data.alreadyMember
            ? "Vous êtes déjà membre de ce projet."
            : "Vous avez rejoint le projet !"
        );
        router.push(`/projects/${data.projectId}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 mt-16 rounded-xl border text-center flex flex-col items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UsersIcon className="size-6" />
        </span>
        <h1 className="text-lg font-bold">Connexion requise</h1>
        <p className="text-sm text-muted-foreground">
          Vous devez être connecté pour rejoindre un projet partagé. Le lien ne
          divulgue aucune information du projet.
        </p>
        <Button asChild>
          <Link href={`/login?next=/projects/join/${code}`}>Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-16 rounded-xl border text-center flex flex-col items-center gap-4">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UsersIcon className="size-6" />
      </span>
      <h1 className="text-lg font-bold">Rejoindre un projet partagé</h1>
      <p className="text-sm text-muted-foreground">
        Vous avez été invité à rejoindre un espace de travail. En acceptant,
        vous pourrez consulter les conversations partagées, ajouter les vôtres
        et contribuer des fichiers.
      </p>
      <Button
        className="w-full"
        disabled={isJoining}
        onClick={handleJoin}
        size="lg"
      >
        {isJoining ? (
          <Loader2Icon className="size-4 mr-2 animate-spin" />
        ) : (
          <UsersIcon className="size-4 mr-2" />
        )}
        Rejoindre le projet
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Une invitation expirée, révoquée ou épuisée sera refusée.
      </p>
    </div>
  );
}
