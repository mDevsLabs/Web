"use client";

import { MicIcon, MicOffIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { AUTO_DICTATION_LANGUAGE } from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

export interface VoiceRecorderButtonProps {
  input: string;
  setInput: (value: string | ((prev: string) => string)) => void;
}

export function VoiceRecorderButton({
  input,
  setInput,
}: VoiceRecorderButtonProps) {
  const speechBaseRef = useRef<string>("");

  // Langue de dictée choisie dans les paramètres. Elle n'est lue qu'au montage
  // puis à chaque démarrage de la dictée : changer le réglage ne doit pas
  // couper une dictée en cours, seulement la prochaine.
  const { data: prefs } = useSWR<{ defaultDictationLanguage?: string }>(
    "/api/user/preferences",
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );
  const dictationLanguage =
    prefs?.defaultDictationLanguage ?? AUTO_DICTATION_LANGUAGE;

  const handleSpeechTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      const base = speechBaseRef.current;
      const next = base ? `${base} ${text}` : text;
      if (isFinal) {
        speechBaseRef.current = next;
      }
      setInput(next);
    },
    [setInput]
  );

  const {
    isListening,
    isSupported: isSpeechSupported,
    toggle: toggleListening,
  } = useSpeechRecognition(handleSpeechTranscript, {
    language: dictationLanguage,
  });

  const handleMicClick = useCallback(() => {
    if (!isSpeechSupported) {
      toast.error("Reconnaissance vocale non supportée par ce navigateur.");
      return;
    }
    if (!isListening) {
      speechBaseRef.current = input;
    }
    toggleListening();
  }, [isListening, isSpeechSupported, input, toggleListening]);

  return (
    <Button
      className={cn(
        "h-9 w-9 rounded-full border p-1.5 sm:h-8 sm:w-8",
        isListening
          ? "animate-pulse border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border/40 text-foreground hover:bg-muted",
        !isSpeechSupported && "opacity-40"
      )}
      data-testid="voice-recorder"
      onClick={handleMicClick}
      title={
        isListening
          ? "Arrêter la dictée"
          : dictationLanguage === AUTO_DICTATION_LANGUAGE
            ? "Dictée vocale (langue du navigateur)"
            : "Dictée vocale"
      }
      type="button"
      variant="ghost"
    >
      {isListening ? (
        <MicOffIcon className="size-4" />
      ) : (
        <MicIcon className="size-4" />
      )}
    </Button>
  );
}
