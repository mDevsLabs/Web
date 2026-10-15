import { useCallback } from "react";
import { getAtMentionRange } from "../composerAtMention";
import { textBeforeCaretForAt } from "../composerRichDom";
import type { TFunction } from "../i18n";
import {
  type AtComposerSlot,
  useComposerAtMention,
} from "../useComposerAtMention";
import { useComposerSkillInvoke } from "../useComposerSkillInvoke";
import { useComposerSlashCommand } from "../useComposerSlashCommand";

type GetSegmentsSetter = Parameters<typeof useComposerAtMention>[0];
type ComposerRichSurface = Parameters<typeof useComposerAtMention>[1];
type AtMentionOptions = Parameters<typeof useComposerAtMention>[2];
type SkillInvokeOptions = Parameters<typeof useComposerSkillInvoke>[2];
type SlashCommandOptions = Parameters<typeof useComposerSlashCommand>[2];

export interface UseComposerInteractionsParams {
  getComposerSegmentsSetter: GetSegmentsSetter;
  composerRichSurface: ComposerRichSurface;
  currentThreadTitle: string;
  editorSidebarSelectedRel: string | null;
  atFileIndexReadyTick: number;
  gitChangedPaths: string[];
  layoutMode: AtMentionOptions["layoutMode"];
  onAtMentionFileChipPreview?: (relPath: string) => void;
  onFileChipPreview?: (relPath: string) => void;
  searchFiles: AtMentionOptions["searchFiles"];
  workspaceOpen: boolean;
  composerPlusSkills: SkillInvokeOptions["skills"];
  t: TFunction;
  userCommands: SlashCommandOptions["userCommands"];
}

export function useComposerInteractions({
  getComposerSegmentsSetter,
  composerRichSurface,
  currentThreadTitle,
  editorSidebarSelectedRel,
  atFileIndexReadyTick,
  gitChangedPaths,
  layoutMode,
  onAtMentionFileChipPreview,
  onFileChipPreview,
  searchFiles,
  workspaceOpen,
  composerPlusSkills,
  t,
  userCommands,
}: UseComposerInteractionsParams) {
  const atMention = useComposerAtMention(
    getComposerSegmentsSetter,
    composerRichSurface,
    {
      currentThreadTitle,
      editorPreviewFile: editorSidebarSelectedRel ?? undefined,
      fileIndexReadyTick: atFileIndexReadyTick,
      gitChangedPaths,
      layoutMode,
      onFileChipPreview:
        onAtMentionFileChipPreview ?? onFileChipPreview ?? (() => {}),
      searchFiles,
      workspaceOpen,
    }
  );

  const skillInvoke = useComposerSkillInvoke(
    getComposerSegmentsSetter,
    composerRichSurface,
    {
      skills: composerPlusSkills,
    }
  );

  const slashCommand = useComposerSlashCommand(
    getComposerSegmentsSetter,
    composerRichSurface,
    {
      t,
      userCommands,
    }
  );

  const syncComposerOverlays = useCallback(
    (root: HTMLElement, slot: AtComposerSlot) => {
      const slice = textBeforeCaretForAt(root);
      const caret = slice.length;
      if (getAtMentionRange(slice, caret)) {
        skillInvoke.closeSkillMenu();
        slashCommand.closeSlashMenu();
        atMention.syncAtFromRich(root, slot);
        return;
      }
      atMention.syncAtFromRich(root, slot);
      skillInvoke.syncSkillFromRich(root, slot);
      slashCommand.syncSlashFromRich(root, slot);
    },
    [
      atMention.syncAtFromRich,
      skillInvoke.closeSkillMenu,
      skillInvoke.syncSkillFromRich,
      slashCommand.closeSlashMenu,
      slashCommand.syncSlashFromRich,
    ]
  );

  return {
    atMention,
    skillInvoke,
    slashCommand,
    syncComposerOverlays,
  };
}
