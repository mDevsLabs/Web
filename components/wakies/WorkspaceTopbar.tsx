"use client";

import { MonitorIcon } from "@mdevs/icons/devices/monitor";
import { PauseIcon } from "@mdevs/icons/media/pause";
import { PlayIcon } from "@mdevs/icons/media/play";
import { Button } from "@mdevs/ui/primitives/button";
import type React from "react";
import { Mascot } from "@/components/wakies/Mascot";
import type { Dialog } from "@/components/wakies/WorkspaceDialog";
import type { WakiesSection } from "@/components/wakies/WorkspaceNavigation";
import type { State, Wakie, WorkspaceState } from "@/lib/wakies/shared/types";

export interface WorkspaceTopbarProps {
  configured: boolean;
  onTogglePause: () => void;
  pane: boolean;
  setDialog: (d: Dialog | undefined) => void;
  setPane: (val: boolean) => void;
  spaceId: string;
  state: State;
  view: WakiesSection;
  wakie: Wakie;
  workspace: WorkspaceState;
}

export const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({
  view,
  wakie,
  state,
  workspace,
  spaceId,
  configured,
  pane,
  setPane,
  setDialog,
  onTogglePause,
}) => (
  <header className="topbar">
    {view === "chat" ? (
      <Button
        aria-label={`Personnaliser ${wakie.name}`}
        className="muse-persona"
        onClick={() => setDialog({ spaceId, type: "wakie", wakie })}
        type="button"
        variant="ghost"
      >
        <Mascot
          avatar={wakie.avatar}
          identity={wakie.id}
          name={wakie.name}
          small
        />
        <strong>{wakie.name}</strong>
        <small>{state.settings.paused ? "En pause" : "À votre écoute"}</small>
      </Button>
    ) : (
      <div className="muse-page-title">
        <span>WAKIES</span>
        <h1>
          {view === "today"
            ? "Aujourd’hui"
            : view === "tasks"
              ? "Activité"
              : view === "ideas"
                ? "Idées"
                : view === "goals"
                  ? "Objectifs"
                  : view === "memories"
                    ? "Mémoires"
                    : view === "profil"
                      ? "Mon profil"
                      : view === "amis"
                        ? "Amis"
                        : "Espaces"}
        </h1>
      </div>
    )}
    <div className="breadcrumbs">
      <span>
        {view === "space"
          ? workspace.spaces.find((space) => space.id === spaceId)?.name
          : "Wakies"}
      </span>
      <span>/</span>
      <strong>
        {view === "chat"
          ? wakie.name
          : view === "tasks"
            ? "Activité"
            : view === "space"
              ? "Pages"
              : view === "profil"
                ? "Mon profil"
                : "Mémoires"}
      </strong>
    </div>
    <div className="top-actions">
      <span className="mode-badge">
        {configured ? "HÉBERGÉ PAR MAI" : "CONFIGURATION REQUISE"}
      </span>
      <Button
        aria-label={
          state.settings.paused
            ? "Reprendre tous les Wakies"
            : "Mettre tous les Wakies en pause"
        }
        className="pause-button"
        onClick={onTogglePause}
        variant="outline"
      >
        {state.settings.paused ? (
          <PlayIcon size={14} />
        ) : (
          <PauseIcon size={14} />
        )}
        <span>{state.settings.paused ? "Reprendre" : "Pause"}</span>
      </Button>
      <Button
        aria-expanded={pane}
        aria-label={pane ? "Masquer l’ordinateur" : "Afficher l’ordinateur"}
        className="icon-button"
        onClick={() => setPane(!pane)}
        variant="ghost"
      >
        <MonitorIcon size={18} />
      </Button>
    </div>
  </header>
);
