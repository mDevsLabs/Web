"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition(
  onTranscript: (text: string, isFinal: boolean) => void
) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

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
    rec.lang = navigator.language || "fr-FR";
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
        onTranscript(final, true);
      } else if (interim) {
        onTranscript(interim, false);
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
  }, [onTranscript]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      return;
    }
    try {
      rec.lang = navigator.language || "fr-FR";
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
