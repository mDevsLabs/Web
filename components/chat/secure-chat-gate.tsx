"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeChatPinInput } from "@/lib/chat/pin-rules";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { LockIcon } from "./icons";

// Écran affiché à la place du chat tant que la conversation n'est pas
// déverrouillée. Le propriétaire ET le visiteur passent par ici : le cookie de
// déverrouillage est un cookie de session, donc une nouvelle session navigateur
// redemande le PIN.
export function SecureChatGate({
  chatId,
  isOwner,
  onUnlocked,
}: {
  chatId: string;
  isOwner: boolean;
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Le code PIN doit contenir 4 à 6 chiffres.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.chatUnlock(chatId), {
        body: JSON.stringify({ pin }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const retryAfter = body?.details?.retryAfterSeconds;
        setError(
          typeof body?.message === "string"
            ? `${body.message}${typeof retryAfter === "number" ? ` (${retryAfter} s)` : ""}`
            : "Impossible de déverrouiller la conversation."
        );
        return;
      }
      onUnlocked();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6">
      <div className="surface-card w-full max-w-md space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
            <LockIcon size={22} />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Conversation sécurisée</h1>
            <p className="text-sm text-muted-foreground">
              Saisissez le code PIN pour consulter cette conversation.
            </p>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="secure-chat-pin">Code PIN</Label>
            <Input
              autoComplete="current-password"
              autoFocus
              id="secure-chat-pin"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setPin(sanitizeChatPinInput(event.target.value))
              }
              placeholder="••••"
              type="password"
              value={pin}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? "Déverrouillage…" : "Déverrouiller"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isOwner
            ? "PIN oublié ? Ouvrez le menu ⋯ de la conversation dans la barre latérale pour le réinitialiser par e-mail."
            : "Demandez le code PIN à la personne qui a partagé cette conversation."}
        </p>
      </div>
    </div>
  );
}
