"use client";

import { CopyIcon, Loader2Icon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  code: string;
  language?: string;
};

// Motifs dangereux refusés avant même l'envoi au Worker (import,
// fetch/XHR, DOM, storage, eval/Function).
const BLOCKED_JS_PATTERNS = [
  /import\s*\(/,
  /\bimport\b.*\bfrom\b/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bdocument\b/,
  /\bwindow\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\bnavigator\b.*\bsendBeacon\b/,
];

function runJsInSandbox(code: string, timeoutMs = 10_000): Promise<string> {
  for (const re of BLOCKED_JS_PATTERNS) {
    if (re.test(code)) {
      return Promise.reject(
        new Error(
          "Code JS bloqué : motif interdit détecté (réseau/DOM/import/eval)."
        )
      );
    }
  }
  const workerSrc = `
    let out = "";
    const log = (...a) => { out += a.map(String).join(" ") + "\\n"; };
    self.console = { log, info: log, warn: log, error: log };
    self.onmessage = (e) => {
      const userCode = String(e.data ?? "");
      try {
        const fn = new Function("console", '"use strict";\\n" + userCode');
        const res = fn({ log, info: log, warn: log, error: log });
        if (res !== undefined && res !== null) out += String(res);
        self.postMessage({ ok: true, out });
      } catch (err) {
        self.postMessage({ ok: false, err: err && err.message ? err.message : String(err) });
      }
    };
  `;
  return new Promise((resolve, reject) => {
    let settled = false;
    const blob = new Blob([workerSrc], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error("L'exécution JS a dépassé le délai autorisé."));
    }, timeoutMs);
    worker.onmessage = (ev: MessageEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      const data = ev.data as { ok: boolean; out?: string; err?: string };
      if (data.ok) resolve(data.out ?? "");
      else reject(new Error(data.err || "Erreur d'exécution JS"));
    };
    worker.onerror = (ev) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(ev.message || "Erreur Worker JS"));
    };
    worker.postMessage(code);
  });
}

export function CodeExecution({ code, language = "python" }: Props) {
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideError, setPyodideError] = useState("");
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const win = window as Window & {
      pyodide?: any;
      loadPyodide?: (options?: { indexURL?: string }) => Promise<any>;
    };

    const load = async () => {
      try {
        if (win.pyodide) {
          if (!cancelled) setPyodideReady(true);
          return;
        }
        if (!win.loadPyodide) {
          if (!cancelled) {
            setPyodideError("Le moteur Python n'est pas disponible.");
          }
          return;
        }
        if (!cancelled) setIsPyodideLoading(true);
        const py = await win.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        if (!cancelled) {
          win.pyodide = py;
          setPyodideReady(true);
        }
      } catch (e) {
        if (!cancelled)
          setPyodideError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsPyodideLoading(false);
      }
    };

    void load();
    const check = window.setInterval(() => void load(), 500);
    return () => {
      cancelled = true;
      window.clearInterval(check);
    };
  }, []);

  const run = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    try {
      if (language === "python") {
        const py = (window as any).pyodide;
        if (!py || !pyodideReady) {
          setError(
            pyodideError ||
              (isPyodideLoading
                ? "Le moteur Python est encore en cours de chargement."
                : "Le moteur Python n'est pas disponible. Rechargez la page puis réessayez.")
          );
          return;
        }
        // Capture stdout
        let stdout = "";
        py.setStdout({
          batched: (msg: string) => {
            stdout += `${msg}\n`;
          },
        });
        py.setStderr({
          batched: (msg: string) => {
            stdout += `${msg}\n`;
          },
        });
        let timeoutId: number | undefined;
        try {
          const result = await Promise.race([
            py.runPythonAsync(code),
            new Promise<never>((_, reject) => {
              timeoutId = window.setTimeout(
                () =>
                  reject(new Error("L'exécution a dépassé le délai autorisé.")),
                60_000
              );
            }),
          ]);
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
          if (result !== undefined && result !== null) {
            const str = String(result);
            if (str !== "undefined" && str !== "None") stdout += str;
          }
          setOutput(stdout.trim() || "(exécution réussie — pas de sortie)");
        } catch (e: any) {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
          setError(e.message || String(e));
        }
      } else {
        // JS — exécuté dans un Web Worker isolé (pas d'accès DOM,
        // cookies, localStorage). Remplace l'ancien `new Function(code)`
        // qui s'exécutait dans le contexte de la page.
        try {
          const out = await runJsInSandbox(code, 10_000);
          setOutput(out.trim() || "(exécution JS réussie)");
        } catch (e: any) {
          setError(e.message || String(e));
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };

  return (
    <div className="w-[min(100%,600px)] rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40">
        <span className="text-[12px] font-semibold flex items-center gap-1.5">
          <PlayIcon className="size-3.5" />{" "}
          {language === "python"
            ? "Python (Pyodide, navigateur)"
            : "JavaScript"}{" "}
          {language === "python"
            ? pyodideReady
              ? "• prêt"
              : pyodideError
                ? "• erreur de chargement"
                : isPyodideLoading
                  ? "• chargement..."
                  : "• indisponible"
            : "• prêt"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            onClick={copyCode}
            size="icon-sm"
            title="Copier"
            variant="ghost"
          >
            <CopyIcon className="size-3.5" />
          </Button>
          <Button
            className="h-7 text-xs gap-1"
            disabled={
              isRunning ||
              (language === "python" && (!pyodideReady || isPyodideLoading))
            }
            onClick={run}
            size="sm"
          >
            {isRunning ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <PlayIcon className="size-3.5" />
            )}
            {isRunning ? "Exécution..." : "Exécuter"}
          </Button>
        </div>
      </div>
      <pre className="p-3 text-[12px] font-mono overflow-auto max-h-64 bg-background">
        {code}
      </pre>
      {(output || error) && (
        <div
          className={`px-3 py-2 border-t ${error ? "bg-red-50 dark:bg-red-950/30 border-red-200" : "bg-muted/20 border-border/40"}`}
        >
          <div className="text-[11px] font-semibold mb-1">
            {error ? "Erreur:" : "Sortie:"}
          </div>
          <pre
            className={`text-[12px] font-mono whitespace-pre-wrap ${error ? "text-red-600" : "text-foreground"}`}
          >
            {error || output}
          </pre>
        </div>
      )}
    </div>
  );
}
