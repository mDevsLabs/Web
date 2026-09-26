"use client";

import { BellIcon, BellOffIcon, CheckIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Demande de permission notifications au chargement de l'application.
 *
 * Pourquoi une modale et pas la cloche ?
 * ---------------------------------------
 * La cloche (components/chat/notification-bell.tsx) demandait la permission
 * au premier clic. C'est trop tard : l'utilisateur ne découvre les
 * notifications qu'après avoir cliqué ailleurs, et une grande partie ne
 * le fait jamais. La demande arrive donc au chargement, une seule fois.
 *
 * Trois règles/non-régressions :
 *
 * 1. Jamais pendant le tutoriel d'accueil. `OnboardingTutorial` monte un
 *    overlay spotlight en z-[60]/z-[70] : deux modales superposées
 *    rendraient le tutoriel inutilisable. On attend donc que l'onboarding
 *    soit terminé, puis un délai de grâce (le temps que la page se pose).
 *
 * 2. Jamais si la permission est déjà accordée ou déjà refusée. Dans les
 *    deux cas on marque l'invite comme vue sans rien demander : un refus
 *    navigateur est définitif, et insister est hostile.
 *
 * 3. « Fermer » est un refus explicite et silencieux. Il n'active rien du
 *    tout — ni la permission navigateur, ni les préférences en base. Seule
 *    l'acceptation active les deux.
 *
 * La persistance est en localStorage (et non en base) : c'est une décision
 * d'affichage par appareil, pas une préférence de compte. La convention de
 * clé reprend hooks/use-onboarding.ts.
 */

const DISMISSED_KEY = "mai_notif_prompt_dismissed";
const ONBOARDING_COMPLETED_KEY = "mai_onboarding_completed";
const ONBOARDING_PENDING_KEY = "mai_onboarding_pending";

/** Délai de grâce après la fin de l'onboarding, le temps que la page se pose. */
const GRACE_DELAY_MS = 1200;

/** Permet à l'onglet Paramètres de réafficher l'invite à la demande. */
const REOPEN_EVENT = "mai-notif-prompt-reopen";

export function reopenNotificationPrompt() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DISMISSED_KEY);
  window.dispatchEvent(new CustomEvent(REOPEN_EVENT));
}

export function NotificationPermissionGate() {
  // `isMounted` évite toute divergence d'hydratation : le composant rend
  // null côté serveur, comme components/agent/agent-upgrade-dialog.tsx.
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  const dismissForever = useCallback(() => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);

    if (window.localStorage.getItem(DISMISSED_KEY) === "1") {
      return;
    }

    // Permission déjà tranchée par le navigateur : rien à demander.
    if (
      !("Notification" in window) ||
      window.Notification.permission !== "default"
    ) {
      window.localStorage.setItem(DISMISSED_KEY, "1");
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) {
        return;
      }
      // L'onboarding prime : s'il est armé ou en cours, on repasse plus tard.
      const onboardingArmed =
        window.localStorage.getItem(ONBOARDING_PENDING_KEY) === "1" &&
        window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== "1";
      if (onboardingArmed) {
        timer = setTimeout(schedule, 2000);
        return;
      }
      timer = setTimeout(() => {
        if (!cancelled) {
          setOpen(true);
        }
      }, GRACE_DELAY_MS);
    };

    schedule();

    const handleReopen = () => {
      if (window.localStorage.getItem(DISMISSED_KEY) === "1") {
        return;
      }
      if (!("Notification" in window)) {
        return;
      }
      if (window.Notification.permission !== "default") {
        return;
      }
      setOpen(true);
    };
    window.addEventListener(REOPEN_EVENT, handleReopen);

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener(REOPEN_EVENT, handleReopen);
    };
  }, []);

  const handleEnable = useCallback(async () => {
    setIsEnabling(true);
    try {
      const permission = await window.Notification.requestPermission();

      if (permission === "granted") {
        // La permission navigateur ne suffit pas : sans cette ligne, la
        // table Notification reste vide car createNotification() renvoie
        // null tant que prefs.enabled est false (défaut en base).
        const res = await fetch("/api/notifications/preferences", {
          body: JSON.stringify({ enabled: true, news: true }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Préférences non enregistrées");
        }
        toast.success("Notifications activées", {
          description: "Vous serez prévenu des réponses, projets et tâches.",
        });
      } else {
        toast.info("Notifications refusées", {
          description:
            "Vous pouvez les réactiver à tout moment dans les réglages du navigateur.",
        });
      }
      // Refus ou accord : on ne reposera plus la question.
      window.localStorage.setItem(DISMISSED_KEY, "1");
      setOpen(false);
    } catch {
      toast.error("Impossible d'activer les notifications");
    } finally {
      setIsEnabling(false);
    }
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Dialog onOpenChange={(next) => !next && dismissForever()} open={open}>
      <DialogContent
        className="max-w-md"
        data-testid="notification-permission-gate"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <BellIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base">
                Restez informé de l'activité de mAI
              </DialogTitle>
              <DialogDescription className="text-xs">
                Une seule demande, à la première ouverture
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ul className="flex flex-col gap-2.5 py-1 text-xs leading-relaxed text-muted-foreground">
          {[
            "Une réponse de l'IA est prête quand vous n'êtes pas devant l'écran.",
            "Un agent a terminé sa tâche, ou attend une décision de votre part.",
            "Une tâche planifiée a abouti, ou votre quota approche de sa limite.",
          ].map((item) => (
            <li className="flex items-start gap-2" key={item}>
              <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Les notifications restent dans l'application. Vous pouvez les régler
          ou les désactiver à tout moment depuis Paramètres → Notifications,
          ainsi que dans les réglages de votre navigateur.
        </p>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            data-testid="notification-permission-dismiss"
            onClick={dismissForever}
            type="button"
            variant="ghost"
          >
            <BellOffIcon className="size-4" />
            Fermer — ne plus afficher
          </Button>
          <Button
            data-testid="notification-permission-accept"
            disabled={isEnabling}
            onClick={handleEnable}
            type="button"
          >
            <BellIcon className="size-4" />
            {isEnabling ? "Activation…" : "Activer les notifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
