"use client";
// Les panneaux restent montés pour préserver les saisies et générations.
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AudioWorkspace } from "@/components/creation/audio-workspace";
import { ImageWorkspace } from "@/components/creation/image-workspace";
import { PillSwitcher } from "@/components/ui/pill-switcher";
import { pagePath } from "@/lib/client/api-endpoints";
import { type CreationMode, isCreationMode } from "@/lib/creation/mode";
export function CreationWorkspace({
  defaultMode,
}: {
  defaultMode: CreationMode;
}) {
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const mode = isCreationMode(requestedMode) ? requestedMode : defaultMode;
  const audioPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== "audio") {
      for (const player of audioPanelRef.current?.querySelectorAll("audio") ??
        []) {
        player.pause();
      }
    }
  }, [mode]);
  const changeMode = (nextMode: CreationMode) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("mode", nextMode);
    // Next synchronise useSearchParams avec History sans requête serveur.
    window.history.replaceState(null, "", `${pagePath("/creation")}?${query}`);
  };
  const modeSwitcher = (
    <PillSwitcher
      activeId={mode}
      ariaLabel="Choisir entre Image et Audio"
      items={[
        { id: "image", label: "Image" },
        { id: "audio", label: "Audio" },
      ]}
      layoutId="creation-mode-pill"
      onSelect={changeMode}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={mode === "image" ? "flex min-h-0 flex-1" : "hidden"}>
        <ImageWorkspace modeSwitcher={modeSwitcher} />
      </div>
      <div
        className={mode === "audio" ? "flex min-h-0 flex-1" : "hidden"}
        ref={audioPanelRef}
      >
        <AudioWorkspace modeSwitcher={modeSwitcher} />
      </div>
    </div>
  );
}
