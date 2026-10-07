"use client";

import {
  ChevronDown,
  Maximize2,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/wakies/Mascot";
import type { useVoice } from "@/components/wakies/useVoice";
import type { Wakie } from "@/lib/wakies/shared/types";

export function CallView({
  wakie,
  voice,
}: {
  wakie: Wakie;
  voice: ReturnType<typeof useVoice>;
}) {
  const [minimized, setMinimized] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (voice.status !== "active") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [voice.status]);
  if (voice.status === "idle") return null;
  const seconds = voice.startedAt
    ? Math.max(0, Math.floor((now - voice.startedAt) / 1000))
    : 0;
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const label =
    voice.status === "connecting"
      ? "Connexion…"
      : voice.status === "ending"
        ? "Enregistrement de l’appel…"
        : voice.muted
          ? "Micro coupé"
          : voice.phase === "speaking"
            ? `${wakie.name} parle`
            : voice.phase === "thinking"
              ? "En cours de réflexion…"
              : "À l’écoute";
  return (
    <section
      aria-label={`Appel vocal avec ${wakie.name}`}
      className={`call-view ${minimized ? "minimized" : ""}`}
    >
      <div className="call-heading">
        <span>
          <span className="call-live-dot" /> Appel vocal
        </span>
        <button
          aria-label={
            minimized
              ? "Agrandir la vue de l’appel"
              : "Réduire la vue de l’appel"
          }
          className="call-minimize"
          onClick={() => setMinimized(!minimized)}
        >
          {minimized ? <Maximize2 size={18} /> : <ChevronDown size={20} />}
        </button>
      </div>
      <div className={`call-persona ${voice.phase}`}>
        <Mascot identity={wakie.id} name={wakie.name} />
        <h2>{wakie.name}</h2>
        <span aria-label="Durée de l’appel" className="call-timer">
          {duration}
        </span>
        <p role="status">{label}</p>
      </div>
      {!minimized && (
        <div aria-live="polite" className="call-caption">
          {voice.userCaption && (
            <p className="call-user-caption">
              <small>Vous</small>
              {voice.userCaption}
            </p>
          )}
          <p>
            <small>{wakie.name}</small>
            {voice.caption ||
              "Parlez naturellement. Votre Wakie est là avec vous."}
          </p>
        </div>
      )}
      {voice.error && (
        <p className="call-warning" role="alert">
          {voice.error}
        </p>
      )}
      <div className="call-controls">
        <button
          aria-label={
            voice.speakerMuted
              ? "Activer le son de l’appel"
              : "Couper le son de l’appel"
          }
          aria-pressed={voice.speakerMuted}
          disabled={voice.status !== "active"}
          onClick={voice.toggleSpeaker}
        >
          <span>{voice.speakerMuted ? <VolumeX /> : <Volume2 />}</span>
          <small>Haut-parleur</small>
        </button>
        <button
          aria-label="Raccrocher"
          className="call-end"
          disabled={voice.status === "ending"}
          onClick={() => void voice.end()}
        >
          <span>
            <PhoneOff />
          </span>
          <small>Fin</small>
        </button>
        <button
          aria-label={voice.muted ? "Réactiver le micro" : "Couper le micro"}
          aria-pressed={voice.muted}
          disabled={voice.status !== "active"}
          onClick={voice.toggleMute}
        >
          <span>{voice.muted ? <MicOff /> : <Mic />}</span>
          <small>{voice.muted ? "Réactiver" : "Couper"}</small>
        </button>
      </div>
      {!minimized && (
        <p className="call-footer">
          Le texte et la voix partagent cette conversation
        </p>
      )}
    </section>
  );
}
