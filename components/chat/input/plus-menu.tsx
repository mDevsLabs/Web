"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import {
  CpuIcon,
  FolderArchiveIcon,
  GlobeIcon,
  ImageIcon,
  PaperclipIcon,
  PlusIcon,
  SparklesIcon,
  TrophyIcon,
  Volume2Icon,
} from "lucide-react";
import Link from "next/link";
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

function PurePlusMenuButton({
  fileInputRef,
  status,
  selectedModelId,
  onOpenCloudPicker,
  onOpenQuizConfig,
  supportsTools = true,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
  onOpenCloudPicker: () => void;
  onOpenQuizConfig: () => void;
  supportsTools?: boolean;
}) {
  const {
    hasFileOrImage,
    hasStrictCaps: hasStrictCapsBtn,
    isVisionLoading,
  } = useModelCapabilities(selectedModelId);

  const { pendingTools, togglePendingTool, isGhostMode, activeSkill } =
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
  const isMcpActive = pendingTools.some(
    (t) => (t as string) === "mcp" || (t as string).startsWith("mcp:")
  );

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
          title="Ajouter des options & outils"
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
        className="w-[320px] sm:w-[480px] p-2 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl flex flex-col gap-1 z-50"
        side="top"
        sideOffset={10}
      >
        {/* Option 1: Ajouter des photos et fichiers */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted/70 text-foreground"
              : "opacity-45 cursor-not-allowed bg-muted/30"
          )}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          onClick={handleDeviceUploadClick}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-foreground/80 shrink-0">
            <PaperclipIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <span className="text-[13.5px] font-semibold text-foreground truncate">
              Ajouter des photos et fichiers
            </span>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isVisionLoading
                ? "Vérification..."
                : hasFileOrImage || !hasStrictCapsBtn
                  ? "Importer depuis l’ordinateur"
                  : "Non supporté"}
            </span>
          </div>
        </button>

        {/* Option 2: Ajouter depuis la bibliothèque */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted/70 text-foreground"
              : "opacity-45 cursor-not-allowed bg-muted/30"
          )}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          onClick={handleCloudImportClick}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-foreground/80 shrink-0">
            <FolderArchiveIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <span className="text-[13.5px] font-semibold text-foreground truncate">
              Ajouter depuis la bibliothèque
            </span>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              Parcourez et recherchez vos fichiers
            </span>
          </div>
        </button>

        {/* Option 3: Créer une image */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
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
          <div className="flex size-7 items-center justify-center rounded-lg text-cyan-500 shrink-0">
            <ImageIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Créer une image
              </span>
              {isGhostMode ? (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 font-medium px-1.5 py-0.5 rounded-full">
                  INDISPONIBLE EN FANTÔME
                </span>
              ) : supportsTools ? (
                isImageActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isGhostMode
                ? "Indisponible dans ce mode"
                : supportsTools
                  ? "Transformez vos idées en images"
                  : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>

        {/* Option 4: Créer un audio ou son */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
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
          <div className="flex size-7 items-center justify-center rounded-lg text-emerald-500 shrink-0">
            <Volume2Icon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Créer un audio ou son
              </span>
              {isGhostMode ? (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 font-medium px-1.5 py-0.5 rounded-full">
                  INDISPONIBLE EN FANTÔME
                </span>
              ) : supportsTools ? (
                isAudioActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isGhostMode
                ? "Indisponible dans ce mode"
                : supportsTools
                  ? "Synthèse vocale et audio IA"
                  : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>

        {/* Option 5: Recherche sur le Web */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
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
          <div className="flex size-7 items-center justify-center rounded-lg text-sky-500 shrink-0">
            <GlobeIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Recherche sur le Web
              </span>
              {supportsTools ? (
                isWebActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {supportsTools
                ? "Trouvez des infos en temps réel"
                : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>

        {/* Option Quizzly : Disponible même en mode fantôme */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer hover:bg-muted/70 text-foreground"
          )}
          onClick={() => {
            onOpenQuizConfig();
            setOpen(false);
          }}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-amber-500 shrink-0">
            <TrophyIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Quizzly — Quiz interactif
              </span>
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              1 à 50 questions avec score
            </span>
          </div>
        </button>

        {/* Option 6: Compétences (Skills) */}
        {supportsTools ? (
          <Link
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
              activeSkill
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
            )}
            href="/skills"
            onClick={() => setOpen(false)}
          >
            <div className="flex size-7 items-center justify-center rounded-lg text-primary shrink-0">
              <SparklesIcon className="size-4" />
            </div>
            <div className="flex items-center justify-between w-full min-w-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold truncate">
                  Compétences (Skills)
                </span>
                {activeSkill && (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                    {activeSkill.name}
                  </span>
                )}
              </div>
              <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
                Gérer et configurer
              </span>
            </div>
          </Link>
        ) : (
          <button
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-not-allowed opacity-50 bg-muted/20"
            onClick={() => {
              toast.warning(
                "Les compétences (skills) nécessitent un modèle supportant les outils."
              );
            }}
            type="button"
          >
            <div className="flex size-7 items-center justify-center rounded-lg text-muted-foreground shrink-0">
              <SparklesIcon className="size-4" />
            </div>
            <div className="flex items-center justify-between w-full min-w-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold truncate">
                  Compétences (Skills)
                </span>
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
                Non supporté par ce modèle
              </span>
            </div>
          </button>
        )}

        {/* Option 7: Serveurs & Outils MCP */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            supportsTools
              ? isMcpActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
              : "opacity-50 cursor-not-allowed bg-muted/20"
          )}
          disabled={!supportsTools}
          onClick={() => {
            if (!supportsTools) {
              toast.warning(
                "Les serveurs et outils MCP nécessitent un modèle avec support des outils."
              );
              return;
            }
            toggleToolExclusive("mcp" as any, "Outils MCP");
          }}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
            <CpuIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Outils & Serveurs MCP
              </span>
              {supportsTools ? (
                isMcpActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {supportsTools
                ? "Connecter bases & APIs"
                : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>
      </PopoverContent>
    </Popover>
  );
}

export const PlusMenuButton = memo(PurePlusMenuButton);
