"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import {
  FolderArchiveIcon,
  GlobeIcon,
  ImageIcon,
  PaperclipIcon,
  PlusIcon,
  Volume2Icon,
} from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useActiveChat as useActiveChatForTools } from "@/hooks/use-active-chat";
import type { ToolId } from "@/lib/ai/tools/config";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useModelCapabilities } from "./use-model-capabilities";

// Menu « + » du chat : uniquement les actions de composition (fichiers, image,
// audio, recherche Web). Les plugins et compétences se sélectionnent désormais
// exclusivement via la mention @ dans le champ de saisie.
function PurePlusMenuButton({
  fileInputRef,
  status,
  selectedModelId,
  onOpenCloudPicker,
  supportsTools = true,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
  onOpenCloudPicker: () => void;
  supportsTools?: boolean;
}) {
  const {
    hasFileOrImage,
    hasStrictCaps: hasStrictCapsBtn,
    isVisionLoading,
  } = useModelCapabilities(selectedModelId);

  const { pendingTools, togglePendingTool, isGhostMode } =
    useActiveChatForTools();
  const [open, setOpen] = useState(false);

  const handleDeviceUploadClick = () => {
    if (!hasFileOrImage && hasStrictCapsBtn && !isVisionLoading) {
      toast.error(
        "Ce modèle ne prend pas en charge l'importation de fichiers."
      );
      return;
    }
    if (isVisionLoading) {
      toast.info("Chargement des capacités du modèle...");
      return;
    }
    fileInputRef.current?.click();
    setOpen(false);
  };

  const handleCloudImportClick = () => {
    if (!hasFileOrImage && hasStrictCapsBtn && !isVisionLoading) {
      toast.error(
        "Ce modèle ne prend pas en charge l'importation de fichiers."
      );
      return;
    }
    if (isVisionLoading) {
      toast.info("Chargement des capacités du modèle...");
      return;
    }
    onOpenCloudPicker();
    setOpen(false);
  };

  const toggleToolExclusive = (toolId: ToolId, label: string) => {
    if (!supportsTools) {
      toast.warning("Ce modèle ne prend pas en charge les outils (tools).");
      return;
    }
    const isCurrentlyEnabled = pendingTools.includes(toolId);
    togglePendingTool(toolId);
    toast.success(
      isCurrentlyEnabled
        ? `${label} désactivé`
        : `${label} activé pour le prochain message`
    );
    setOpen(false);
  };

  const isImageActive = pendingTools.includes("imageGenerate" as ToolId);
  const isAudioActive = pendingTools.includes("audioGenerate" as ToolId);
  const isWebActive = pendingTools.includes("webSearch" as ToolId);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-9 w-9 sm:h-8 sm:w-8 rounded-full border border-border/40 p-1.5 transition-colors hover:bg-muted text-foreground cursor-pointer shrink-0 relative",
            pendingTools.length > 0 &&
              "bg-primary/10 border-primary/30 text-primary"
          )}
          data-testid="plus-menu-button"
          disabled={status !== "ready" && status !== "error"}
          title="Ajouter des options"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          {pendingTools.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-primary rounded-full ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[240px] sm:w-[260px] p-1.5 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl flex flex-col gap-0.5 z-50"
        side="top"
        sideOffset={10}
      >
        {/* Ajouter des photos et fichiers */}
        <button
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors w-full cursor-pointer",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted/70 text-foreground"
              : "opacity-45 cursor-not-allowed bg-muted/30"
          )}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          onClick={handleDeviceUploadClick}
          type="button"
        >
          <PaperclipIcon className="size-4 shrink-0 text-foreground/80" />
          <span className="text-[13px] font-medium text-foreground truncate flex-1">
            Photos et fichiers
          </span>
          {(isVisionLoading || (!hasFileOrImage && hasStrictCapsBtn)) && (
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              {isVisionLoading ? "…" : "Non supporté"}
            </span>
          )}
        </button>

        {/* Ajouter depuis la bibliothèque */}
        <button
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors w-full cursor-pointer",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted/70 text-foreground"
              : "opacity-45 cursor-not-allowed bg-muted/30"
          )}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          onClick={handleCloudImportClick}
          type="button"
        >
          <FolderArchiveIcon className="size-4 shrink-0 text-foreground/80" />
          <span className="text-[13px] font-medium text-foreground truncate flex-1">
            Bibliothèque
          </span>
          {(isVisionLoading || (!hasFileOrImage && hasStrictCapsBtn)) && (
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              {isVisionLoading ? "…" : "Non supporté"}
            </span>
          )}
        </button>

        {/* Créer une image */}
        <button
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors w-full cursor-pointer",
            isGhostMode || !supportsTools
              ? "opacity-50 cursor-not-allowed bg-muted/20"
              : isImageActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
          )}
          disabled={isGhostMode || !supportsTools}
          onClick={() => {
            if (isGhostMode) {
              toast.error(
                "La génération d'image est indisponible en Mode fantôme"
              );
              return;
            }
            if (!supportsTools) {
              toast.warning(
                "La génération d'image nécessite un modèle avec support des outils."
              );
              return;
            }
            toggleToolExclusive("imageGenerate", "Création d'image");
          }}
          type="button"
        >
          <ImageIcon className="size-4 shrink-0 text-cyan-500" />
          <span className="text-[13px] font-medium truncate flex-1">
            Créer une image
          </span>
          {isGhostMode ? (
            <span className="text-[9px] bg-purple-500/20 text-purple-400 font-semibold px-1.5 py-0.5 rounded-full shrink-0">
              FANTÔME
            </span>
          ) : supportsTools ? (
            isImageActive ? (
              <span className="text-[9px] bg-primary text-primary-foreground font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                ACTIF
              </span>
            ) : null
          ) : (
            <span className="text-[9px] bg-destructive/15 text-destructive font-semibold px-1.5 py-0.5 rounded-full shrink-0">
              SANS TOOLS
            </span>
          )}
        </button>

        {/* Créer un audio ou son */}
        <button
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors w-full cursor-pointer",
            isGhostMode || !supportsTools
              ? "opacity-50 cursor-not-allowed bg-muted/20"
              : isAudioActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
          )}
          disabled={isGhostMode || !supportsTools}
          onClick={() => {
            if (isGhostMode) {
              toast.error(
                "La génération audio est indisponible en Mode fantôme"
              );
              return;
            }
            if (!supportsTools) {
              toast.warning(
                "La génération audio nécessite un modèle avec support des outils."
              );
              return;
            }
            toggleToolExclusive("audioGenerate", "Génération audio");
          }}
          type="button"
        >
          <Volume2Icon className="size-4 shrink-0 text-emerald-500" />
          <span className="text-[13px] font-medium truncate flex-1">
            Créer un audio
          </span>
          {isGhostMode ? (
            <span className="text-[9px] bg-purple-500/20 text-purple-400 font-semibold px-1.5 py-0.5 rounded-full shrink-0">
              FANTÔME
            </span>
          ) : supportsTools ? (
            isAudioActive ? (
              <span className="text-[9px] bg-primary text-primary-foreground font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                ACTIF
              </span>
            ) : null
          ) : (
            <span className="text-[9px] bg-destructive/15 text-destructive font-semibold px-1.5 py-0.5 rounded-full shrink-0">
              SANS TOOLS
            </span>
          )}
        </button>

        {/* Recherche sur le Web */}
        <button
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors w-full cursor-pointer",
            supportsTools
              ? isWebActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
              : "opacity-50 cursor-not-allowed bg-muted/20"
          )}
          disabled={!supportsTools}
          onClick={() => {
            if (!supportsTools) {
              toast.warning(
                "La recherche Web nécessite un modèle avec support des outils."
              );
              return;
            }
            toggleToolExclusive("webSearch", "Recherche sur le Web");
          }}
          type="button"
        >
          <GlobeIcon className="size-4 shrink-0 text-sky-500" />
          <span className="text-[13px] font-medium truncate flex-1">
            Recherche sur le Web
          </span>
          {supportsTools ? (
            isWebActive ? (
              <span className="text-[9px] bg-primary text-primary-foreground font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                ACTIF
              </span>
            ) : null
          ) : (
            <span className="text-[9px] bg-destructive/15 text-destructive font-semibold px-1.5 py-0.5 rounded-full shrink-0">
              SANS TOOLS
            </span>
          )}
        </button>
      </PopoverContent>
    </Popover>
  );
}

export const PlusMenuButton = memo(PurePlusMenuButton);
