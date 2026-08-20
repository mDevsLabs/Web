"use client";

import { FolderArchiveIcon, PanelLeftIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";
import { MAI_UPGRADE_URL } from "@/lib/constants";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-sidebar/80 backdrop-blur-md px-4 border-b border-border/40">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <Link
        className="flex size-7 items-center justify-center rounded-lg md:hidden overflow-hidden"
        href="/"
      >
        <Image src="/logo.png" alt="mAI" width={24} height={24} className="rounded-md" />
      </Link>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="hidden sm:inline-flex rounded-xl text-xs gap-1.5 h-8 border-border/60 hover:bg-muted"
        >
          <Link href="/library">
            <FolderArchiveIcon className="size-3.5" />
            <span>Bibliothèque</span>
          </Link>
        </Button>

        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex rounded-xl bg-foreground px-3 text-background hover:bg-foreground/90 text-xs gap-1.5 h-8 font-medium shadow-sm"
        >
          <Link
            href={MAI_UPGRADE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <SparklesIcon className="size-3.5 text-amber-400" />
            <span>Passer à mAI Pro</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
);
