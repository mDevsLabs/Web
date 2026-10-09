"use client";

import { CheckIcon, LanguagesIcon, Loader2Icon, Volume2Icon } from "@mdevs/icons";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import { speakText } from "@/hooks/use-speech";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import {
  DEFAULT_TRANSLATION_TARGET,
  TRANSLATION_TARGETS,
  translationTargetLabel,
} from "@/lib/i18n/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// Traduction d'une réponse de l'IA.
//
// L'état vit ici, dans la barre d'actions du message, et non dans un contexte
// global : une traduction affichée doit disparaître avec le message qu'elle
// traduit, et `MessageActions` est déjà mémoïsé par `message.id` — le changer
// remonte le composant et purge donc l'affichage sans watcher à écrire.

export type MessageTranslationState = {
  /** Code cible effectivement traduit. */
  code: string;
  detectedLanguage: string;
  isPending: boolean;
  provider: string;
  /** Le message était déjà dans la langue cible : rien à traduire. */
  sameLanguage: boolean;
  text: string;
};

const EMPTY_STATE: MessageTranslationState = {
  code: "",
  detectedLanguage: "",
  isPending: false,
  provider: "",
  sameLanguage: false,
  text: "",
};

/** Langue cible mémorisée pour le prochain clic sur l'icône. */
function useDefaultTarget(): string {
  const { data } = useSWR<{ defaultTranslationLanguage?: string }>(
    "/api/user/preferences",
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );
  return data?.defaultTranslationLanguage || DEFAULT_TRANSLATION_TARGET;
}

export function useMessageTranslation(sourceText: string | undefined) {
  const [state, setState] = useState<MessageTranslationState>(EMPTY_STATE);
  const [lastTarget, setLastTarget] = useState<string | null>(null);
  const defaultTarget = useDefaultTarget();

  const translate = useCallback(
    async (target?: string) => {
      const code = target ?? state.code ?? lastTarget ?? defaultTarget;
      if (!sourceText?.trim()) {
        toast.error("Aucun texte à traduire.");
        return;
      }
      // Re-clic sur la langue déjà affichée = refermer le bloc, pas relancer un
      // appel réseau pour retrouver un résultat déjà connu.
      if (state.text && !state.isPending && state.code === code) {
        setState(EMPTY_STATE);
        return;
      }

      setLastTarget(code);
      setState((current) => ({ ...current, code, isPending: true }));

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/translate`,
          {
            body: JSON.stringify({ targetLang: code, text: sourceText }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            extractApiErrorMessage(data) ||
              "La traduction n'a pas pu être obtenue."
          );
        }
        setState({
          code: data.target_lang ?? code,
          detectedLanguage: data.detectedLanguage ?? "",
          isPending: false,
          provider: data.provider ?? "deepl",
          sameLanguage: Boolean(data.sameLanguage),
          text: String(data.translation ?? ""),
        });
      } catch (error) {
        setState(EMPTY_STATE);
        toast.error(
          error instanceof Error
            ? error.message
            : "La traduction n'a pas pu être obtenue."
        );
      }
    },
    [
      defaultTarget,
      lastTarget,
      sourceText,
      state.code,
      state.isPending,
      state.text,
    ]
  );

  return { defaultTarget, state, translate };
}

/** Icône + menu des cibles. Un clic direct traduit, la liste change la cible. */
export function MessageTranslateMenu({
  defaultTarget,
  isPending,
  onSelect,
}: {
  defaultTarget: string;
  isPending: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Traduire ce message"
          className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 disabled:opacity-50"
          data-testid="message-translate"
          disabled={isPending}
          title="Traduire ce message"
          type="button"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <LanguagesIcon className="size-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-56 overflow-y-auto"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Traduire en
        </DropdownMenuLabel>
        <DropdownMenuItem
          data-testid="message-translate-default"
          onClick={() => onSelect(defaultTarget)}
        >
          <span className="flex-1">
            {translationTargetLabel(defaultTarget)}
            <span className="ml-1 text-[11px] text-muted-foreground">
              (préf.)
            </span>
          </span>
          <CheckIcon className="size-4 text-info" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {TRANSLATION_TARGETS.filter(
          (entry) => entry.code !== defaultTarget
        ).map((entry) => (
          <DropdownMenuItem
            key={entry.code}
            onClick={() => onSelect(entry.code)}
          >
            {entry.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Bloc dépliable sous la réponse.
 *
 * Il n'y a pas de « voir l'original » : le bloc est placé SOUS le message, donc
 * l'original reste en permanence visible au-dessus. Un bouton pour le réafficher
 * serait un clic inutile.
 *
 * Le texte traduit est rendu en `whitespace-pre-wrap` et JAMAIS en markdown :
 * c'est la sortie d'un tiers (DeepL, ou un modèle au secours), et la faire
 * passer par un renderer markdown ouvrirait la porte à du HTML injecté dans
 * la conversation.
 */
export function MessageTranslationBlock({
  state,
}: {
  state: MessageTranslationState;
}) {
  const [, copyToClipboard] = useCopyToClipboard();
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!state.text) {
    return null;
  }

  const label = translationTargetLabel(state.code);

  return (
    <div
      className="mt-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm"
      data-testid="message-translation"
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <LanguagesIcon className="size-3.5 shrink-0" />
        <span className="font-medium">
          {state.sameLanguage
            ? `Déjà en ${label.toLowerCase()}`
            : `Traduit en ${label.toLowerCase()}`}
        </span>
        {state.provider === "mai" ? (
          <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-info ring-1 ring-info/20">
            mAI
          </span>
        ) : null}
        {state.sameLanguage ? (
          <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-warning ring-1 ring-warning/20">
            Rien à traduire
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label={isSpeaking ? "Arrêter la lecture" : "Écouter"}
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
            onClick={() => {
              if (isSpeaking) {
                setIsSpeaking(false);
                return;
              }
              setIsSpeaking(true);
              speakText(state.text, state.code);
              // Garde-fou : le TTS navigateur rend en silence et ne prévient
              // jamais la fin, l'icône resterait bloquée sur « Arrêter ».
              window.setTimeout(
                () => setIsSpeaking(false),
                Math.min(60_000, state.text.length * 60)
              );
            }}
            title={isSpeaking ? "Arrêter la lecture" : "Écouter la traduction"}
            type="button"
          >
            <Volume2Icon className="size-3.5" />
          </button>
          <button
            aria-label="Copier la traduction"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
            onClick={async () => {
              await copyToClipboard(state.text);
              toast.success("Traduction copiée !");
            }}
            title="Copier la traduction"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-3.5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <rect
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                width="13"
                x="8"
                y="8"
              />
              <path
                d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-foreground/90">{state.text}</div>
    </div>
  );
}
