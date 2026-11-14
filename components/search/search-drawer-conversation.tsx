"use client";

import {
  ArrowRightIcon,
  BookIcon,
  BotIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MessageCircleIcon,
  NewspaperIcon,
  PlayIcon,
  SendIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import {
  AnswerReasoning,
  SummarySources,
} from "@/components/search/search-summary-card";
import type { SummarySource } from "@/lib/search/summary-stream";

export type SummaryTarget = {
  url: string;
  title: string;
  snippet?: string;
  source?: string;
  type: "web" | "news" | "image" | "video";
};

export type DrawerMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  sources?: SummarySource[];
};

export type TargetConversationState = {
  isOpen: boolean;
  isLoading: boolean;
  target: SummaryTarget | null;
  messages: DrawerMessage[];
  modelId: string;
};

export interface SearchDrawerConversationProps {
  followupInput: string;
  hasCopiedDrawer: boolean;
  onClose: () => void;
  onCopyDrawerContent: () => void;
  onFollowupInputChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onSendDrawerToChat: () => void;
  onSendFollowupMessage: (e: React.FormEvent) => void;
  selectedModelId: string;
  targetConversation: TargetConversationState;
}

export function SearchDrawerConversation({
  targetConversation,
  onClose,
  selectedModelId,
  onModelChange,
  followupInput,
  onFollowupInputChange,
  onSendFollowupMessage,
  hasCopiedDrawer,
  onCopyDrawerContent,
  onSendDrawerToChat,
}: SearchDrawerConversationProps) {
  const drawerMessagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: défilement en bas lors de l'ouverture ou du chargement de nouveaux messages.
  useEffect(() => {
    if (targetConversation.isOpen) {
      drawerMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [
    targetConversation.isOpen,
    targetConversation.messages.length,
    targetConversation.isLoading,
  ]);

  return (
    <AnimatePresence>
      {targetConversation.isOpen && targetConversation.target ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Volet Tiroir */}
          <motion.aside
            animate={{ x: 0 }}
            className="relative z-10 w-full sm:w-[500px] h-full bg-card border-l border-border/80 shadow-2xl flex flex-col overflow-hidden"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            transition={{
              damping: 25,
              stiffness: 300,
              type: "spring",
            }}
          >
            {/* En-tête principal du tiroir */}
            <div className="flex items-center justify-between p-3.5 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shrink-0">
                  <SparklesIcon className="size-4 animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground">
                      mAI Search Assistant
                    </span>
                    <span className="chip text-[10px] py-0 px-1.5 bg-primary/10 text-primary font-medium">
                      {targetConversation.target.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {targetConversation.target.title}
                  </span>
                </div>
              </div>

              <button
                aria-label="Fermer le tiroir"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                onClick={onClose}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Sous-en-tête : Sélecteur de modèle d'IA & Indicateur outil unique de recherche web */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-muted/10 border-b border-border/40 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-medium text-muted-foreground shrink-0 hidden sm:inline">
                  Modèle :
                </span>
                <ModelSelectorCompact
                  modal={true}
                  onModelChange={onModelChange}
                  selectedModelId={selectedModelId}
                  side="bottom"
                />
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium shrink-0 ring-1 ring-primary/20"
                title="Ce modèle dispose de l'outil Recherche web pour vérifier et compléter les informations en direct."
              >
                <GlobeIcon className="size-3" />
                <span>Recherche web active</span>
              </div>
            </div>

            {/* Corps déroulant : Carte source & Fil de discussion multi-tours */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-sm leading-relaxed text-foreground/90 space-y-4">
              {/* Carte récapitulative de la source */}
              <div className="surface-muted p-3 text-xs flex flex-col gap-1.5 rounded-xl border border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 text-muted-foreground">
                    {targetConversation.target.type === "video" ? (
                      <PlayIcon className="size-3.5 text-primary shrink-0" />
                    ) : targetConversation.target.type === "news" ? (
                      <NewspaperIcon className="size-3.5 text-info shrink-0" />
                    ) : (
                      <BookIcon className="size-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-semibold text-foreground/90 truncate">
                      {targetConversation.target.source || "Ressource"}
                    </span>
                  </div>
                  <a
                    className="chip text-[10px] py-0.5 px-2 inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer shrink-0"
                    href={targetConversation.target.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Consulter</span>
                    <ExternalLinkIcon className="size-2.5" />
                  </a>
                </div>
                <div className="font-medium text-foreground line-clamp-2">
                  {targetConversation.target.title}
                </div>
                {targetConversation.target.snippet ? (
                  <p className="text-muted-foreground text-[11px] line-clamp-3">
                    {targetConversation.target.snippet}
                  </p>
                ) : null}
              </div>

              {/* Messages du fil */}
              {targetConversation.messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      isAssistant ? "justify-start" : "justify-end"
                    }`}
                    initial={{ opacity: 0, y: 8 }}
                    key={msg.id}
                    transition={{ duration: 0.2 }}
                  >
                    {isAssistant ? (
                      <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mb-0.5 ring-1 ring-primary/20">
                        <BotIcon className="size-3.5" />
                      </div>
                    ) : null}

                    <div
                      className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-muted/40 border border-border/50 text-foreground"
                          : "bg-primary text-primary-foreground font-medium shadow-sm"
                      }`}
                    >
                      {isAssistant ? (
                        msg.content ? (
                          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm">
                            <AnswerReasoning
                              streaming={
                                targetConversation.isLoading &&
                                index === targetConversation.messages.length - 1
                              }
                              text={msg.reasoning || ""}
                            />
                            <Streamdown>{msg.content}</Streamdown>
                            {msg.sources ? (
                              <SummarySources sources={msg.sources} />
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground animate-pulse">
                            <SparklesIcon className="size-3.5 text-primary" />
                            <span>Génération et recherche en cours…</span>
                          </div>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {isAssistant ? null : (
                      <div className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mb-0.5">
                        <UserIcon className="size-3.5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              <div ref={drawerMessagesEndRef} />
            </div>

            {/* Zone de saisie et formulaire de question de suivi */}
            <form
              className="p-3.5 border-t border-border/50 bg-card flex flex-col gap-2.5 shrink-0"
              onSubmit={onSendFollowupMessage}
            >
              <div className="relative flex items-center w-full rounded-xl border border-border/70 bg-muted/20 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-1">
                <input
                  aria-label="Poser une question sur cette ressource"
                  className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm outline-none placeholder:text-muted-foreground/60"
                  disabled={targetConversation.isLoading}
                  onChange={(e) => onFollowupInputChange(e.target.value)}
                  placeholder="Poser une question de suivi sur cette ressource..."
                  type="text"
                  value={followupInput}
                />
                <button
                  aria-label="Envoyer"
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                  disabled={
                    !followupInput.trim() || targetConversation.isLoading
                  }
                  title="Envoyer la question"
                  type="submit"
                >
                  <SendIcon className="size-3.5" />
                </button>
              </div>

              {/* Actions secondaires */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  className="chip text-[11px] inline-flex items-center gap-1.5 py-1 px-2.5 cursor-pointer"
                  disabled={targetConversation.messages.length === 0}
                  onClick={onCopyDrawerContent}
                  type="button"
                >
                  {hasCopiedDrawer ? (
                    <CheckIcon className="size-3 text-success" />
                  ) : (
                    <CopyIcon className="size-3" />
                  )}
                  <span>{hasCopiedDrawer ? "Copié" : "Copier"}</span>
                </button>

                <button
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  onClick={onSendDrawerToChat}
                  type="button"
                >
                  <MessageCircleIcon className="size-3.5" />
                  <span>Poursuivre dans le Chat mAI</span>
                  <ArrowRightIcon className="size-3" />
                </button>
              </div>
            </form>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
