"use client";

import { ArrowUpRight, Check, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { computerToolResult } from "@/components/wakies/ComputerToolCard";
import { Markdown } from "@/components/wakies/markdown";
import { openPageLink } from "@/components/wakies/page-navigation";
import {
  decidePageReview,
  restorePageReview,
} from "@/components/wakies/page-review-decision";
import type { Page } from "@/lib/wakies/pages";
import { pageReviewSchema } from "@/lib/wakies/shared/page-review";
export function PageReviewCard({
  args,
  status,
  result,
  respond,
  conversationId,
  toolCallId,
  onSaved,
}: {
  args: unknown;
  status: string;
  result?: unknown;
  respond?: (result: unknown) => Promise<void>;
  conversationId: string;
  toolCallId: string;
  onSaved: () => void;
}) {
  const draft = pageReviewSchema.safeParse(args);
  const outcome = computerToolResult(result);
  const [savedPage, setSavedPage] = useState<Page>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receiptReady, setReceiptReady] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const pending = useRef(false);
  const finished = status === "complete";
  const recordedApproval = outcome.approved === true;
  const saved = !!savedPage || recordedApproval;
  const pageId =
    savedPage?.id ?? (typeof outcome.pageId === "string" ? outcome.pageId : "");
  const spaceId =
    savedPage?.spaceId ??
    (typeof outcome.spaceId === "string" ? outcome.spaceId : "");
  useEffect(() => {
    if (recordedApproval) return;
    let active = true;
    setReceiptReady(false);
    setError("");
    void restorePageReview(conversationId, toolCallId)
      .then((page) => {
        if (!active) return;
        setSavedPage(page ?? undefined);
        setReceiptReady(true);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de restaurer cette révision."
          );
      });
    return () => {
      active = false;
    };
  }, [conversationId, toolCallId, recordedApproval, restoreAttempt]);
  const decide = async (approved: boolean) => {
    if (!respond || !receiptReady || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const page = await decidePageReview(
        conversationId,
        toolCallId,
        args,
        approved
      );
      if (!page) {
        await respond({
          approved: false,
          message:
            "Le propriétaire a refusé ce brouillon. Ne l’enregistrez pas.",
        });
        return;
      }
      setSavedPage(page);
      onSaved();
      await respond({
        approved: true,
        pageId: page.id,
        spaceId: page.spaceId,
        url: `/#/spaces/${page.spaceId}/pages/${page.id}`,
      });
    } catch (cause) {
      setReceiptReady(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer le brouillon approuvé."
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <section
      aria-label="Réviser le brouillon de la page"
      className="page-review-card"
    >
      <header>
        <FileText size={17} />
        <strong>
          {saved
            ? "Enregistré dans votre Espace"
            : receiptReady
              ? finished
                ? "Révision terminée"
                : "Prêt pour votre révision"
              : "Vérification de la révision enregistrée…"}
        </strong>
        <span>
          {saved
            ? "Approuvé"
            : receiptReady
              ? finished
                ? "Non enregistré"
                : "À vous de décider"
              : "Vérification"}
        </span>
      </header>
      <div className="page-review-body">
        <h3>
          {draft.success ? draft.data.title : "Préparation de votre brouillon…"}
        </h3>
        {draft.success && (
          <Markdown
            components={{
              a: ({ href, children }) => (
                <a href={href} rel="noreferrer" target="_blank">
                  {children}
                </a>
              ),
              img: ({ alt }) => <span>{alt}</span>,
            }}
          >
            {draft.data.content}
          </Markdown>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {!receiptReady && error && (
        <button
          onClick={() => setRestoreAttempt((attempt) => attempt + 1)}
          type="button"
        >
          Retry review
        </button>
      )}
      <footer>
        {saved && pageId && spaceId && (
          <button
            className="review-primary"
            onClick={() =>
              openPageLink(
                `/#/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}`
              )
            }
            type="button"
          >
            Open page <ArrowUpRight size={15} />
          </button>
        )}
        {!finished && respond && receiptReady && (
          <>
            <button
              className="review-primary"
              disabled={busy || (!saved && !draft.success)}
              onClick={() => void decide(true)}
              type="button"
            >
              <Check size={15} />
              {busy
                ? "Enregistrement…"
                : saved
                  ? "Poursuivre la conversation"
                  : "Approve & save"}
            </button>
            {!saved && (
              <button
                disabled={busy}
                onClick={() => void decide(false)}
                type="button"
              >
                Decline
              </button>
            )}
          </>
        )}
        {!saved && (
          <small>
            {receiptReady
              ? finished
                ? "Aucune page n’a été enregistrée."
                : "Rien n’est enregistré tant que vous n’avez pas approuvé."
              : "Vérification si ce brouillon a déjà été enregistré."}
          </small>
        )}
      </footer>
    </section>
  );
}
