"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeChatPinInput } from "@/lib/chat/pin-rules";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

type ChatWithSecurity = Chat & { isSecure?: boolean };
type View = "form" | "remove" | "reset";

function PinField({
  autoComplete = "new-password",
  id,
  label,
  onChange,
  value,
}: {
  autoComplete?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        id={id}
        inputMode="numeric"
        maxLength={6}
        onChange={(event) => onChange(sanitizeChatPinInput(event.target.value))}
        placeholder="••••"
        type="password"
        value={value}
      />
    </div>
  );
}

export function SecureConversationDialog({
  chat,
  onOpenChange,
  onSaved,
}: {
  chat: ChatWithSecurity | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { mutate } = useSWRConfig();
  const { data: freshChat } = useSWR(
    chat ? apiEndpoints.chatById(chat.id) : null,
    fetcher
  );
  const [view, setView] = useState<View>("form");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [code, setCode] = useState("");
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const open = Boolean(chat);
  const isSecure = Boolean(freshChat?.isSecure ?? chat?.isSecure);

  useEffect(() => {
    if (!open) {
      return;
    }
    setView("form");
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
    setCode("");
    setResetEmail(null);
    setError(null);
    setSubmitting(false);
    setSendingCode(false);
    setCooldown(0);
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!chat) {
    return null;
  }

  const invalidate = async () => {
    await Promise.all([
      mutate(apiEndpoints.chatById(chat.id)),
      mutate(apiEndpoints.messagesForChat(chat.id)),
    ]);
    onSaved();
  };

  const errorMessage = async (response: Response) => {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message
        : "Une erreur est survenue. Veuillez réessayer.";
    const retryAfter = body?.details?.retryAfterSeconds;
    return typeof retryAfter === "number"
      ? `${message} (${retryAfter} s)`
      : message;
  };

  const validationError = () => {
    if (!/^\d{4,6}$/.test(pin)) {
      return "Le code PIN doit contenir 4 à 6 chiffres.";
    }
    if (pin !== confirmPin) {
      return "Les deux codes PIN ne correspondent pas.";
    }
    if (isSecure && !/^\d{4,6}$/.test(currentPin)) {
      return "Saisissez le code PIN actuel.";
    }
    return null;
  };

  const handleSave = async () => {
    setError(null);
    const invalid = validationError();
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.chatPin(chat.id), {
        body: JSON.stringify(
          isSecure ? { confirmPin, currentPin, pin } : { confirmPin, pin }
        ),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }

      await invalidate();
      if (isSecure) {
        toast.success("Code PIN modifié.");
      } else {
        const shareUrl = `${window.location.origin}${apiEndpoints.chatPath(chat.id)}`;
        navigator.clipboard.writeText(shareUrl).then(
          () =>
            toast.success("Conversation sécurisée : lien de partage copié."),
          () => toast.success("Conversation sécurisée.")
        );
      }
      onOpenChange(false);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    if (!/^\d{4,6}$/.test(currentPin)) {
      setError("Saisissez le code PIN actuel.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.chatPin(chat.id), {
        body: JSON.stringify({ currentPin }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }

      await invalidate();
      toast.success("Protection retirée : la conversation reste publique.");
      onOpenChange(false);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetCode = async () => {
    setError(null);
    setSendingCode(true);
    try {
      const response = await fetch(apiEndpoints.chatPinReset(chat.id), {
        method: "POST",
      });
      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }
      const payload = await response.json().catch(() => ({}));
      setResetEmail(
        typeof payload.email === "string" ? payload.email : "votre compte"
      );
      setCooldown(60);
      toast.success("Code de réinitialisation envoyé.");
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Saisissez le code à 6 chiffres reçu par e-mail.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Le nouveau code PIN doit contenir 4 à 6 chiffres.");
      return;
    }
    if (pin !== confirmPin) {
      setError("Les deux codes PIN ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.chatPinReset(chat.id), {
        body: JSON.stringify({ code, confirmPin, pin }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }

      await invalidate();
      toast.success("Code PIN réinitialisé.");
      onOpenChange(false);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    view === "remove"
      ? "Retirer la protection"
      : view === "reset"
        ? "Réinitialiser le code PIN"
        : isSecure
          ? "Code PIN de la conversation"
          : "Sécuriser la conversation";

  const description =
    view === "remove"
      ? "Le code actuel est requis. La conversation redeviendra lisible par toute personne connectée disposant du lien."
      : view === "reset"
        ? "Un code à 6 chiffres est envoyé à l'adresse e-mail de votre compte. Il expire dans 10 minutes."
        : isSecure
          ? "Modifiez le code PIN de cette conversation. Le code actuel est requis."
          : "Choisissez un code de 4 à 6 chiffres. Il sera demandé à chaque ouverture de cette conversation, y compris par vous.";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {view === "form" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            {isSecure ? (
              <PinField
                autoComplete="current-password"
                id="chat-pin-current"
                label="Code PIN actuel"
                onChange={setCurrentPin}
                value={currentPin}
              />
            ) : null}
            <PinField
              id="chat-pin-new"
              label={isSecure ? "Nouveau code PIN" : "Code PIN"}
              onChange={setPin}
              value={pin}
            />
            <PinField
              id="chat-pin-confirm"
              label="Confirmer le code PIN"
              onChange={setConfirmPin}
              value={confirmPin}
            />

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {isSecure ? (
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                <button
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => {
                    setError(null);
                    setView("reset");
                  }}
                  type="button"
                >
                  PIN oublié ?
                </button>
                <span aria-hidden="true" className="text-muted-foreground">
                  ·
                </span>
                <button
                  className="text-destructive underline-offset-4 hover:underline"
                  onClick={() => {
                    setError(null);
                    setView("remove");
                  }}
                  type="button"
                >
                  Retirer la protection
                </button>
              </div>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button disabled={submitting} type="submit">
                {submitting
                  ? "Enregistrement…"
                  : isSecure
                    ? "Enregistrer"
                    : "Sécuriser"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}

        {view === "remove" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleRemove();
            }}
          >
            <PinField
              autoComplete="current-password"
              id="chat-pin-remove"
              label="Code PIN actuel"
              onChange={setCurrentPin}
              value={currentPin}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                onClick={() => {
                  setError(null);
                  setView("form");
                }}
                type="button"
                variant="outline"
              >
                Retour
              </Button>
              <Button disabled={submitting} type="submit" variant="destructive">
                {submitting ? "Retrait…" : "Retirer la protection"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}

        {view === "reset" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleReset();
            }}
          >
            <div className="space-y-2">
              <Button
                disabled={sendingCode || cooldown > 0}
                onClick={handleSendResetCode}
                type="button"
                variant="outline"
              >
                {sendingCode
                  ? "Envoi…"
                  : cooldown > 0
                    ? `Renvoyer le code (${cooldown} s)`
                    : "Recevoir un code par e-mail"}
              </Button>
              {resetEmail ? (
                <p className="text-xs text-muted-foreground">
                  Code envoyé à {resetEmail}.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chat-pin-reset-code">Code reçu par e-mail</Label>
              <Input
                autoComplete="one-time-code"
                id="chat-pin-reset-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                value={code}
              />
            </div>
            <PinField
              id="chat-pin-reset-new"
              label="Nouveau code PIN"
              onChange={setPin}
              value={pin}
            />
            <PinField
              id="chat-pin-reset-confirm"
              label="Confirmer le code PIN"
              onChange={setConfirmPin}
              value={confirmPin}
            />

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                onClick={() => {
                  setError(null);
                  setView("form");
                }}
                type="button"
                variant="outline"
              >
                Retour
              </Button>
              <Button disabled={submitting} type="submit">
                {submitting ? "Réinitialisation…" : "Réinitialiser"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
