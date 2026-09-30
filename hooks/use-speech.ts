"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTO_DICTATION_LANGUAGE,
  normalizeDictationLanguage,
} from "@/lib/i18n/languages";

export type SpeechRecognitionOptions = {
  /**
   * Locale de reconnaissance vocale (BCP-47). `null` ou `AUTO_DICTATION_LANGUAGE`
   * = langue du navigateur.
   *
   * Elle est lue par RÉFÉRENCE, pas par closure : `recognition` ne doit pas
   * être reconstruit quand la préférence arrive de la base. Le reconstruire
   * interromprait une dictée en cours et, pire, ferait perdre le `onend` du
   * navigateur en cours de route.
   */
  language?: string | null;
};

/** Locale effective : la préférence si elle est explicite, le navigateur sinon. */
function resolveLanguage(preference: string | null | undefined): string {
  const normalized = normalizeDictationLanguage(preference);
  if (normalized !== AUTO_DICTATION_LANGUAGE) {
    return normalized;
  }
  return navigator.language || "fr-FR";
}

export function useSpeechRecognition(
  onTranscript: (text: string, isFinal: boolean) => void,
  options?: SpeechRecognitionOptions
) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // La langue vit dans une ref : la changer ne doit pas reconstruire
  // l'objet SpeechRecognition, seulement réécrire `rec.lang` au prochain start.
  const languageRef = useRef<string | null>(options?.language ?? null);
  languageRef.current = options?.language ?? null;

  // `onTranscript` change à chaque rendu de l'appelant : on le lit par ref pour
  // que le handler natif ne soit jamais périmé, et que l'effet ne dépende que
  // du constructeur, disponible une fois pour toutes.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    setIsSupported(!!SR);
    if (!SR) {
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = resolveLanguage(languageRef.current);
    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      if (final) {
        onTranscriptRef.current(final, true);
      } else if (interim) {
        onTranscriptRef.current(interim, false);
      }
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      return;
    }
    try {
      // Réappliquée à chaque démarrage : c'est ce second point qui écrasait
      // le réglage. Les deux lignes étaient en dur avant, l'une à la création,
      // l'autre ici — il suffisait d'en garder une.
      rec.lang = resolveLanguage(languageRef.current);
      rec.start();
      setIsListening(true);
    } catch {
      /* déjà démarré */
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      return;
    }
    try {
      rec.stop();
      setIsListening(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return { isListening, isSupported, start, stop, toggle };
}

export function speakText(text: string, lang?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || navigator.language || "fr-FR";
  u.rate = 1;
  // Try to pick a matching voice
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) =>
    v.lang
      .toLowerCase()
      .startsWith((u.lang.split("-")[0] || "fr").toLowerCase())
  );
  if (match) {
    u.voice = match;
  }
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
