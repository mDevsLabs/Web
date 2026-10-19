"use client";

/**
 * Cloche de notifications du rail Wakies.
 *
 * Le panneau reste dans le rail et n'est pas portalisé : sous `.wakies-root`,
 * un portail monté sur `document.body` perdrait le thème clair et toutes les
 * règles `wakies-host.css`, qui exigent ce contexte. C'est le même arbitrage
 * que `.wakies-search-results` et que le menu de documents.
 *
 * Le compteur de non-lus vient du serveur : le hook `useMessagingNotifications`
 * filtre déjà la sourdine et la conversation ouverte, l'interface ne recalcule
 * rien.
 */

import { BellIcon } from "@mdevs/icons/objects/bell";
import { Button } from "@mdevs/ui/primitives/button";
import { useEffect, useRef, useState } from "react";
import type { MessagingNotification } from "@/components/wakies/useMessagingNotifications";

export function WakiesNotificationBell({
  notifications,
  onAutoriser,
  onSelect,
  permission,
}: {
  notifications: MessagingNotification[];
  onAutoriser: () => void;
  /** Le parent pilote la navigation : une notification mène à son fil. */
  onSelect: (conversationId: string) => void;
  permission: NotificationPermission | "unsupported";
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const count = notifications.length;

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      className="rail-notifications"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }}
      ref={root}
    >
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          count ? `Notifications, ${count} à traiter` : "Notifications"
        }
        className="rail-bell"
        onClick={() => setOpen(!open)}
        ref={trigger}
        variant="ghost"
      >
        <BellIcon size={17} />
        {count > 0 && (
          <span aria-hidden="true" className="rail-unread">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>
      {open && (
        <div aria-label="Notifications" className="rail-panel" role="dialog">
          {permission === "default" ? (
            <Button onClick={onAutoriser} type="button" variant="outline">
              Autoriser les notifications du navigateur
            </Button>
          ) : null}
          {permission === "denied" ? (
            <p className="muted">
              Les notifications du navigateur sont bloquées. Vous pouvez les
              autoriser dans ses réglages.
            </p>
          ) : null}
          {count === 0 ? (
            <p className="muted">Aucune nouvelle réponse.</p>
          ) : (
            <ul>
              {notifications.map((item) => (
                <li key={item.id}>
                  <Button
                    className="wakies-notification-button"
                    onClick={() => {
                      setOpen(false);
                      trigger.current?.focus();
                      onSelect(item.conversationId);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <span className="muted wakies-notification-preview">
                        {item.preview || "Nouvelle réponse"}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
