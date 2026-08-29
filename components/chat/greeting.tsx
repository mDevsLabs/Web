"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AgentIcon } from "@/components/agents/agent-icon";
import { useActiveChat } from "@/hooks/use-active-chat";

export const Greeting = () => {
  const { activeAgent, sendMessage } = useActiveChat();
  const starterPrompts: string[] = (activeAgent as any)?.starterPrompts || [];
  const welcomeMessage: string = (activeAgent as any)?.welcomeMessage || "";
  const visiblePrompts = starterPrompts.filter(Boolean).slice(0, 4);

  return (
    <div className="flex flex-col items-center px-4" key="overview">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 size-16 relative flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeAgent ? (
          <div
            className="size-16 rounded-2xl flex items-center justify-center text-white shadow-lg drop-shadow-md"
            style={{ backgroundColor: activeAgent.color || "#6366f1" }}
          >
            <AgentIcon
              emoji={(activeAgent as any).emoji}
              icon={activeAgent.icon}
              size={32}
              variant="plain"
            />
          </div>
        ) : (
          <Image
            alt="mAI"
            className="rounded-2xl shadow-lg drop-shadow-md"
            height={64}
            priority
            src="/logo.png"
            width={64}
          />
        )}
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-bold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeAgent
          ? `Bonjour, je suis ${activeAgent.name} 👋`
          : "Comment puis-je vous aider aujourd'hui ?"}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-2.5 text-center text-muted-foreground text-sm max-w-md"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeAgent?.description ||
          "Posez vos questions du quotidien, rédigez des documents ou explorez vos projets avec mAI Web."}
      </motion.div>

      {welcomeMessage ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 max-w-md text-center text-sm text-muted-foreground rounded-xl border border-border/40 bg-card/70 px-4 py-3 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {welcomeMessage}
        </motion.div>
      ) : null}

      {visiblePrompts.length > 0 ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-wrap justify-center gap-2 max-w-lg pointer-events-auto"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {visiblePrompts.map((p, i) => (
            <button
              className="pointer-events-auto cursor-pointer rounded-full border border-border/50 bg-card/80 px-3.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground hover:bg-primary/5"
              key={i}
              onClick={() =>
                sendMessage({
                  parts: [{ text: p, type: "text" }],
                  role: "user" as const,
                })
              }
              type="button"
            >
              {p}
            </button>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
};
