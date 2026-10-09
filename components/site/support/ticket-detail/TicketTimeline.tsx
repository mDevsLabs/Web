"use client";

import { BotIcon as Bot, FileTextIcon as FileText, ImageIcon, MessageSquareIcon as MessageSquare, ShieldCheckIcon as ShieldCheck, SparklesIcon as Sparkles } from "@mdevs/icons";
import ReactMarkdown from "react-markdown";
import type {
  SupportAttachment,
  SupportMessage,
} from "@/app/(chat)/site/actions/support-utils";
import type {
  TicketDetailUser,
  TicketTimelineProps,
} from "@/components/site/support/ticket-detail/ticket-detail-types";
import { formatDisplayDate, formatDisplayTime } from "@/lib/site/date-format";

function isCurrentUserMessage(
  message: SupportMessage,
  user: TicketDetailUser
): boolean {
  return (
    !!user &&
    (message.sender_email === user.email ||
      message.sender_id === String(user.id))
  );
}

export function TicketTimeline({
  messages,
  user,
  messagesEndRef,
}: TicketTimelineProps) {
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
        <MessageSquare aria-hidden="true" className="h-4 w-4" /> Fil des
        échanges ({messages.length})
      </h2>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isSystem = message.sender_role === "system";
          const isFromAdmin = message.sender_role === "admin";
          const isOriginalPost = message.action_type === "created";
          if (isSystem) {
            return (
              <div
                className="my-4 flex justify-center"
                key={message.id || index}
              >
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600">
                  <Sparkles
                    aria-hidden="true"
                    className="h-3 w-3 text-purple-600"
                  />
                  {message.message} • {formatDisplayTime(message.created_at)}
                </span>
              </div>
            );
          }
          const isCurrentUser = isCurrentUserMessage(message, user);
          return (
            <div
              className={`rounded-3xl border p-5 sm:p-6 ${isFromAdmin ? "border-purple-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/40 shadow-2xs" : isOriginalPost ? "border-slate-200 bg-white shadow-2xs" : isCurrentUser ? "border-slate-200 bg-slate-50/80" : "border-slate-200 bg-white"}`}
              key={message.id || index}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold shadow-2xs ${isFromAdmin ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
                  >
                    {isFromAdmin ? (
                      <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      (message.sender_name || "U").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {isFromAdmin ? "mAI" : message.sender_name}
                      </span>
                      {isFromAdmin ? (
                        <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                          mAI • Support
                        </span>
                      ) : null}
                      {isOriginalPost ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Demande initiale
                        </span>
                      ) : null}
                      {message.is_ai_generated ? (
                        <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <Bot aria-hidden="true" className="h-3 w-3" /> Contenu
                          créé par IA
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {formatDisplayDate(message.created_at, {
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none pl-12 leading-relaxed text-slate-800">
                <ReactMarkdown>{message.message}</ReactMarkdown>
              </div>
              {message.is_ai_generated ? (
                <div className="ml-12 mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <Bot aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Note :</strong> Ce message a été généré avec
                    l&apos;assistance de l&apos;IA et relu par l&apos;équipe
                    mAI. Vérifiez les informations critiques.
                  </span>
                </div>
              ) : null}
              {message.attachments && message.attachments.length > 0 ? (
                <div className="ml-12 mt-3 grid grid-cols-2 gap-2">
                  {message.attachments.map((attachment: SupportAttachment) => (
                    <a
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs hover:border-purple-200"
                      href={attachment.file_url}
                      key={attachment.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {attachment.mime_type.startsWith("image/") ? (
                        <ImageIcon
                          aria-hidden="true"
                          className="h-4 w-4 text-purple-600"
                        />
                      ) : (
                        <FileText
                          aria-hidden="true"
                          className="h-4 w-4 text-slate-500"
                        />
                      )}
                      <span className="truncate font-medium">
                        {attachment.file_name}
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
