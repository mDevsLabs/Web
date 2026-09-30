"use client";

import { LogInIcon, LogOutIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/app/(auth)/actions";

// Sortie de secours affichée quand un cookie de session est présent mais
// qu'aucun utilisateur n'a pu être résolu (session expirée, révoquée, ou
// signée avec une clé différente de celle du backend — cas classique quand
// MAI_JWT_SECRET du .env local ne correspond pas au déploiement).
//
// Sans ce bloc, l'interface montre « Connectez-vous… » sans aucun moyen
// d'agir : le menu utilisateur (qui contient la déconnexion) n'est rendu que
// pour un utilisateur identifié, et /login reste redirigé vers / tant que le
// cookie existe. Le remède passe donc forcément par la suppression du cookie.
export function SessionRecovery() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const runLogout = async () => {
    setIsPending(true);
    try {
      await logoutAction();
    } catch {
      toast.error("Impossible de supprimer la session locale.");
      setIsPending(false);
    }
  };

  const handleReconnect = async () => {
    await runLogout();
    // La déconnexion precede la navigation : /login n'est accessible qu'une
    // fois le cookie effacé (le middleware le renvoie vers / sinon).
    router.push("/login");
    router.refresh();
  };

  const handleLogout = async () => {
    await runLogout();
    router.refresh();
  };

  return (
    <div
      className="surface-muted flex flex-col items-start gap-2 border-warning/30 bg-warning/10 p-3"
      data-testid="session-recovery"
    >
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-warning">
        <TriangleAlertIcon className="size-3.5 shrink-0" />
        <span>Session non reconnue</span>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Vos discussions sont inaccessibles : cette session n'est plus valide.
        Reconnectez-vous pour les retrouver.
      </p>
      <div className="flex w-full flex-col gap-1.5">
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-2 py-1.5 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          data-testid="session-recovery-reconnect"
          disabled={isPending}
          onClick={handleReconnect}
          type="button"
        >
          <LogInIcon className="size-3.5" />
          <span>Se reconnecter</span>
        </button>
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground disabled:opacity-60"
          data-testid="session-recovery-logout"
          disabled={isPending}
          onClick={handleLogout}
          type="button"
        >
          <LogOutIcon className="size-3.5" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
