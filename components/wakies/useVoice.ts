"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/components/wakies/api";
export function useVoice(
  conversationId: string,
  onSaved: () => void,
  anchorMessageId?: string
) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "active" | "ending"
  >("idle");
  const generation = useRef(0);
  const connecting = useRef(false);
  const ending = useRef(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [startedAt, setStartedAt] = useState<number>();
  const [phase, setPhase] = useState<"listening" | "speaking" | "thinking">(
    "listening"
  );
  const [caption, setCaption] = useState("");
  const [userCaption, setUserCaption] = useState("");
  const session = useRef<
    | {
        pc: RTCPeerConnection;
        stream: MediaStream;
        audio: HTMLAudioElement;
        id?: string;
        channel: RTCDataChannel;
        transcript: string[];
        timer?: ReturnType<typeof setTimeout>;
        cancelled: boolean;
      }
    | undefined
  >(undefined);
  const anchor = useRef(anchorMessageId);
  anchor.current = anchorMessageId;
  const closeMedia = useCallback(() => {
    const current = session.current;
    if (!current) return;
    current.cancelled = true;
    current.stream.getTracks().forEach((track) => track.stop());
    current.channel.close();
    current.pc.close();
    current.audio.pause();
    current.audio.srcObject = null;
    clearTimeout(current.timer);
  }, []);
  const end = useCallback(async () => {
    if (ending.current) return;
    generation.current++;
    connecting.current = false;
    const current = session.current;
    if (!current) {
      setStatus("idle");
      return;
    }
    // Silence the call immediately, while keeping the peer alive until the
    // provider confirms hangup through the server.
    current.cancelled = true;
    current.stream.getTracks().forEach((track) => {
      track.enabled = false;
    });
    current.audio.pause();
    clearTimeout(current.timer);
    ending.current = true;
    setStatus("ending");
    try {
      if (current.id)
        await api(`/voice/calls/${current.id}/end`, "POST", {
          anchorMessageId: anchor.current,
          transcript: current.transcript.join("\n").slice(0, 20_000),
        });
      onSaved();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "L’appel est terminé, mais son compte rendu n’a pas pu être enregistré."
      );
    } finally {
      closeMedia();
      session.current = undefined;
      ending.current = false;
      setStatus("idle");
    }
  }, [closeMedia, onSaved]);
  useEffect(
    () => () => {
      generation.current++;
      const current = session.current;
      closeMedia();
      if (current?.id && !ending.current)
        void fetch(`/api/voice/calls/${current.id}/end`, {
          body: JSON.stringify({
            anchorMessageId: anchor.current,
            transcript: current.transcript.join("\n").slice(0, 20_000),
          }),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          method: "POST",
        }).catch(() => {});
    },
    [closeMedia]
  );
  useEffect(() => {
    if (status !== "active" && status !== "connecting") return;
    const timer = setInterval(() => {
      const current = session.current;
      const id = current?.id;
      if (id)
        void api<{ endedAt: number | null }>(`/voice/calls/${id}`)
          .then((call) => {
            if (session.current === current && call.endedAt) void end();
          })
          .catch(() => {
            if (session.current !== current) return;
            setError("La connexion de contrôle de l’appel a été perdue.");
            void end();
          });
    }, 2000);
    return () => clearInterval(timer);
  }, [status, closeMedia, onSaved, end]);
  const start = async () => {
    if (session.current || connecting.current || ending.current) return;
    connecting.current = true;
    const attempt = ++generation.current;
    setStatus("connecting");
    setError("");
    setMuted(false);
    setSpeakerMuted(false);
    setStartedAt(undefined);
    setPhase("listening");
    setCaption("");
    setUserCaption("");
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (attempt !== generation.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const pc = new RTCPeerConnection();
      const audio = new Audio();
      audio.autoplay = true;
      const channel = pc.createDataChannel("oai-events");
      const current = {
        audio,
        cancelled: false,
        channel,
        id: undefined as string | undefined,
        pc,
        stream,
        timer: undefined as ReturnType<typeof setTimeout> | undefined,
        transcript: [] as string[],
      };
      session.current = current;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
      pc.ontrack = (event) => {
        if (current.cancelled) return;
        audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void audio.play().catch(() => {
          if (!current.cancelled)
            setError(
              "La lecture audio a été bloquée. Vérifiez les permissions audio de votre navigateur."
            );
        });
      };
      pc.onconnectionstatechange = () => {
        if (current.cancelled) return;
        if (pc.connectionState === "connected") {
          setStatus("active");
          setStartedAt((value) => value ?? Date.now());
          if (current.id)
            void api(`/voice/calls/${current.id}/active`, "POST", {}).catch(
              (e) => {
                if (!current.cancelled) setError(e.message);
              }
            );
        }
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setError("La connexion vocale a été interrompue.");
          void end();
        }
      };
      channel.onmessage = async (event) => {
        if (current.cancelled) return;
        let data: Record<string, unknown>;
        try {
          const parsed: unknown = JSON.parse(String(event.data));
          if (!parsed || typeof parsed !== "object") return;
          data = parsed as Record<string, unknown>;
        } catch {
          return;
        }
        if (data.type === "input_audio_buffer.speech_started") {
          setPhase("listening");
          setCaption("");
        }
        if (
          data.type === "response.output_audio_transcript.delta" &&
          typeof data.delta === "string"
        ) {
          setPhase("speaking");
          setCaption((text) => text + data.delta);
        }
        if (data.type === "output_audio_buffer.stopped") setPhase("listening");
        if (data.type === "response.created") {
          setCaption("");
          setPhase("thinking");
        }
        if (typeof data.transcript === "string") {
          if (
            data.type ===
            "conversation.item.input_audio_transcription.completed"
          ) {
            current.transcript.push(`You: ${data.transcript}`);
            setUserCaption(data.transcript);
          }
          if (data.type === "response.output_audio_transcript.done")
            current.transcript.push(`Wakie: ${data.transcript}`);
        }
        if (data.type === "error")
          setError(
            "Le fournisseur vocal a signalé une erreur de session. Terminez l’appel et réessayez."
          );
        if (
          data.type !== "response.function_call_arguments.done" ||
          data.name !== "ask_compute" ||
          typeof data.call_id !== "string" ||
          !current.id
        )
          return;
        let output: string;
        setPhase("thinking");
        try {
          const args: unknown = JSON.parse(String(data.arguments));
          if (
            !args ||
            typeof args !== "object" ||
            !("request" in args) ||
            typeof args.request !== "string"
          )
            throw new Error("Requête de calcul invalide.");
          const result = await api<{ text: string }>(
            `/voice/calls/${current.id}/compute`,
            "POST",
            {
              request: args.request,
              toolCallId: data.call_id,
              transcript: current.transcript.join("\n").slice(-12_000),
            }
          );
          output = result.text;
        } catch (e) {
          output = `Échec du calcul : ${e instanceof Error ? e.message : "Erreur inconnue"}`;
        }
        if (!current.cancelled && channel.readyState === "open") {
          channel.send(
            JSON.stringify({
              item: {
                call_id: data.call_id,
                output,
                type: "function_call_output",
              },
              type: "conversation.item.create",
            })
          );
          channel.send(JSON.stringify({ type: "response.create" }));
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await api<{ id: string; sdp: string }>(
        "/voice/calls",
        "POST",
        { conversationId, sdp: offer.sdp }
      );
      current.id = response.id;
      if (current.cancelled) {
        await api(`/voice/calls/${response.id}/end`, "POST", {
          transcript: "",
        });
        return;
      }
      await pc.setRemoteDescription({ sdp: response.sdp, type: "answer" });
      if (current.cancelled) return;
      current.timer = setTimeout(() => void end(), 15 * 60_000);
    } catch (e) {
      if (attempt !== generation.current) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }
      const current = session.current;
      const id = current?.id;
      if (id)
        void api(`/voice/calls/${id}/end`, "POST", {
          anchorMessageId: anchor.current,
          transcript: "",
        }).catch(() => {});
      stream?.getTracks().forEach((track) => track.stop());
      closeMedia();
      session.current = undefined;
      setStatus("idle");
      setError(
        e instanceof Error ? e.message : "Impossible de connecter l’appel."
      );
    } finally {
      if (attempt === generation.current) connecting.current = false;
    }
  };
  const toggleMute = () => {
    const next = !muted;
    session.current?.stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  };
  const toggleSpeaker = () => {
    const next = !speakerMuted;
    if (session.current) session.current.audio.muted = next;
    setSpeakerMuted(next);
  };
  return {
    caption,
    end,
    error,
    muted,
    phase,
    speakerMuted,
    start,
    startedAt,
    status,
    toggleMute,
    toggleSpeaker,
    userCaption,
  };
}
