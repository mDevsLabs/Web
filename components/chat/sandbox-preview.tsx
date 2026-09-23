"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  MonitorIcon,
  PauseIcon,
  PlayIcon,
  SmartphoneIcon,
  TabletIcon,
  TerminalIcon,
  TrashIcon,
  ZapIcon,
} from "lucide-react";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildSandboxDocument,
  detectReactMode,
  detectTailwind,
  readSandboxLogMessage,
  SANDBOX_IFRAME_SANDBOX,
} from "@/lib/security/sandbox";
import { cn } from "@/lib/utils";

type ConsoleLog = {
  argsText: string;
  id: number;
  level: "error" | "info" | "log" | "warn";
  time: string;
};

type DeviceMode = "desktop" | "mobile" | "tablet";

const DEVICE_WIDTH: Record<DeviceMode, string> = {
  desktop: "100%",
  mobile: "390px",
  tablet: "820px",
};

export function SandboxPreview({ content }: { content: string }) {
  const [reactAuto] = useState(() => detectReactMode(content));
  const [reactMode, setReactMode] = useState(reactAuto);
  const [tailwindEnabled, setTailwindEnabled] = useState(() =>
    detectTailwind(content)
  );
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [committedContent, setCommittedContent] = useState(content);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const logIdRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Refresh auto débouncé pendant le streaming (800 ms)
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const timer = setTimeout(() => {
      setCommittedContent(content);
    }, 800);
    return () => clearTimeout(timer);
  }, [content, autoRefresh]);

  // Capture console de l'iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Le contenu sandboxé n'est pas fiable : la validation (fenêtre source
      // exacte, schéma, plafond de taille) est centralisée et testée dans
      // lib/security/sandbox.ts. Ni l'origine (opaque, donc « null ») ni le
      // contenu du message ne peuvent servir de contrôle d'accès.
      const message = readSandboxLogMessage({
        data: event.data,
        expectedWindow: iframeRef.current?.contentWindow ?? null,
        source: event.source,
      });
      if (!message) {
        return;
      }
      setLogs((prev) => {
        const next: ConsoleLog[] = [
          ...prev,
          {
            argsText: message.text,
            id: ++logIdRef.current,
            level: message.level,
            time: new Date().toLocaleTimeString("fr-FR", { hour12: false }),
          },
        ];
        return next.slice(-100);
      });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;

  const srcDoc = useMemo(
    () =>
      buildSandboxDocument({
        content: committedContent,
        reactMode,
        tailwindEnabled,
      }),
    [committedContent, reactMode, tailwindEnabled]
  );

  const reload = () => {
    setCommittedContent(content);
  };

  const deviceStyle: CSSProperties = {
    margin: "0 auto",
    maxWidth: DEVICE_WIDTH[device],
    width: "100%",
  };

  return (
    <div className="flex h-full flex-col gap-1.5">
      {/* Barre de contrôle sandbox */}
      <div className="flex flex-wrap items-center gap-1 text-[11px]">
        <button
          className={cn(
            "rounded-md border border-border/50 px-2 py-1 hover:bg-muted",
            tailwindEnabled && "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
          )}
          onClick={() => setTailwindEnabled((v) => !v)}
          title="Injecter Tailwind CSS (CDN)"
          type="button"
        >
          Tailwind {tailwindEnabled ? "ON" : "OFF"}
        </button>
        <button
          className={cn(
            "rounded-md border border-border/50 px-2 py-1 hover:bg-muted",
            reactMode && "bg-sky-500/15 text-sky-600 dark:text-sky-400"
          )}
          onClick={() => setReactMode((v) => !v)}
          title="Injecter React + Babel (transpilation JSX dans l'iframe)"
          type="button"
        >
          React {reactMode ? "ON" : "OFF"}
        </button>

        <span className="mx-1 h-4 w-px bg-border" />

        <button
          className={cn(
            "rounded-md border border-border/50 p-1 hover:bg-muted",
            device === "mobile" && "bg-muted"
          )}
          onClick={() => setDevice("mobile")}
          title="Vue mobile (390px)"
          type="button"
        >
          <SmartphoneIcon className="size-3.5" />
        </button>
        <button
          className={cn(
            "rounded-md border border-border/50 p-1 hover:bg-muted",
            device === "tablet" && "bg-muted"
          )}
          onClick={() => setDevice("tablet")}
          title="Vue tablette (820px)"
          type="button"
        >
          <TabletIcon className="size-3.5" />
        </button>
        <button
          className={cn(
            "rounded-md border border-border/50 p-1 hover:bg-muted",
            device === "desktop" && "bg-muted"
          )}
          onClick={() => setDevice("desktop")}
          title="Vue bureau (100%)"
          type="button"
        >
          <MonitorIcon className="size-3.5" />
        </button>

        <span className="mx-1 h-4 w-px bg-border" />

        <button
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 hover:bg-muted",
            autoRefresh &&
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          )}
          onClick={() => setAutoRefresh((v) => !v)}
          title={autoRefresh ? "Refresh auto activé" : "Refresh auto en pause"}
          type="button"
        >
          {autoRefresh ? (
            <ZapIcon className="size-3" />
          ) : (
            <PauseIcon className="size-3" />
          )}
          Auto
        </button>
        <button
          className="rounded-md border border-border/50 px-2 py-1 hover:bg-muted"
          onClick={reload}
          title="Recharger la preview maintenant"
          type="button"
        >
          <PlayIcon className="mr-1 inline size-3" />
          Recharger
        </button>

        <button
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 hover:bg-muted",
            (errorCount > 0 || warnCount > 0) && "relative"
          )}
          onClick={() => setConsoleOpen((v) => !v)}
          title="Console"
          type="button"
        >
          <TerminalIcon className="size-3" />
          Console
          {logs.length > 0 && (
            <span className="font-mono text-[9.5px] text-muted-foreground">
              {logs.length}
            </span>
          )}
          {errorCount > 0 && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* Console repliable */}
      {consoleOpen ? (
        <div className="flex max-h-36 min-h-24 flex-col overflow-hidden rounded-lg border border-border/50 bg-zinc-950 text-zinc-200">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
            <TerminalIcon className="size-3" />
            Console ({logs.length})
            {errorCount > 0 && (
              <span className="text-red-400">{errorCount} erreur(s)</span>
            )}
            {warnCount > 0 && (
              <span className="text-amber-400">{warnCount} avert.</span>
            )}
            <button
              className="ml-auto rounded p-0.5 hover:bg-zinc-800"
              onClick={() => setLogs([])}
              title="Vider la console"
              type="button"
            >
              <TrashIcon className="size-3" />
            </button>
            <button
              className="rounded p-0.5 hover:bg-zinc-800"
              onClick={() => setConsoleOpen(false)}
              title="Réduire"
              type="button"
            >
              <ChevronDownIcon className="size-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 font-mono text-[10.5px] leading-relaxed">
            {logs.length === 0 ? (
              <p className="text-zinc-500">
                Aucun log — utilise console.log() dans ton code.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  className={cn(
                    "flex gap-2 whitespace-pre-wrap break-words border-b border-zinc-900 py-0.5",
                    log.level === "error" && "text-red-400",
                    log.level === "warn" && "text-amber-300",
                    log.level === "info" && "text-sky-300"
                  )}
                  key={log.id}
                >
                  <span className="shrink-0 text-zinc-600">{log.time}</span>
                  <span>{log.argsText}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Frame responsive */}
      <div className="min-h-0 flex-1 rounded-lg border border-border/40 bg-muted/30 p-1.5">
        <iframe
          className="h-full min-h-[300px] w-full rounded border border-border/30 bg-white"
          // `allow-same-origin` est volontairement ABSENT : combiné à
          // `allow-scripts` sur un `srcdoc`, il donnait au contenu non fiable
          // l'origine de l'application (accès DOM parent, cookies,
          // localStorage). `allow-modals` est retiré (spam de dialogues).
          ref={iframeRef}
          referrerPolicy="no-referrer"
          sandbox={SANDBOX_IFRAME_SANDBOX}
          srcDoc={srcDoc}
          style={deviceStyle}
          title="Preview Live"
        />
      </div>
      {logs.length > 0 && !consoleOpen ? (
        <button
          className="flex items-center gap-1 self-start text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => setConsoleOpen(true)}
          type="button"
        >
          <ChevronUpIcon className="size-3" />
          {errorCount > 0
            ? `${errorCount} erreur(s) console`
            : `${logs.length} log(s) console`}
        </button>
      ) : null}
    </div>
  );
}
