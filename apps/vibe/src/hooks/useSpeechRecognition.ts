/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SPEECH RECOGNITION HOOK (src/hooks/useSpeechRecognition.ts)
 * Browser-native Web Speech API speech-to-text audio transcription
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHookOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
}

export function useSpeechRecognition(options: SpeechRecognitionHookOptions = {}) {
  const { language = 'fr-FR', continuous = false, onResult } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(() =>
    typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  // Le callback vient des consommateurs (lambda recréée à chaque rendu) : le
  // garder dans une ref évite de recréer/abandonner le recognizer à chaque rendu.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript + ' ';
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const updated = (prev + ' ' + currentFinal).trim();
            onResultRef.current?.(updated);
            return updated;
          });
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('[SpeechRecognition] Erreur:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Erreur micro: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [language, continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('La reconnaissance vocale n’est pas prise en charge sur ce navigateur.');
      return;
    }
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
