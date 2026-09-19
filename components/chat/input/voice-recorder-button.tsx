"use client";

import { MicIcon, MicOffIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech";

export interface VoiceRecorderButtonProps {
  input: string;
  setInput: (value: string | ((prev: string) => string)) => void;
}

export function VoiceRecorderButton({
  input,
  setInput,
}: VoiceRecorderButtonProps) {
  const speechBaseRef = useRef<string>("");

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
  } = useSpeechRecognition(handleSpeechTranscript);

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
      className={`h-9 w-9 sm:h-8 sm:w-8 rounded-full p-1.5 border ${
        isListening
          ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse"
          : "border-border/40 hover:bg-muted text-foreground"
      } ${isSpeechSupported ? "" : "opacity-40"}`}
      onClick={handleMicClick}
      title={isListening ? "Arrêter la dictée" : "Dictée vocale"}
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
