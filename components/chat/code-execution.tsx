"use client";

import { CopyIcon, Loader2Icon, PlayIcon } from "@mdevs/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildJsWorkerSource,
  JS_SANDBOX_MAX_CODE,
  JS_SANDBOX_MAX_OUTPUT,
} from "@/lib/security/js-sandbox";

type Props = {
  code: string;
  language?: string;
};

const JS_TIMEOUT_MS = 10_000;
const PYTHON_TIMEOUT_MS = 60_000;
const PYTHON_LOAD_TIMEOUT_MS = 120_000;
const MAX_CODE_LENGTH = JS_SANDBOX_MAX_CODE;
const MAX_OUTPUT_LENGTH = JS_SANDBOX_MAX_OUTPUT;

/**
 * Exécute le JavaScript dans un Worker dont le script EST le code utilisateur.
 * Aucun `eval`/`new Function` : la realm est créée par le navigateur, et
 * `buildJsWorkerSource` en retire les capacités dangereuses avant exécution.
 */
function runJsInSandbox(
  code: string,
  timeoutMs = JS_TIMEOUT_MS
): Promise<string> {
  if (code.length > MAX_CODE_LENGTH) {
    return Promise.reject(new Error("Code trop long."));
  }
  const workerSrc = buildJsWorkerSource(code);
  return new Promise((resolve, reject) => {
    let settled = false;
    const blob = new Blob([workerSrc], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(url);
      fn();
    };
    const timer = window.setTimeout(() => {
      finish(() =>
        reject(new Error("L'exécution JS a dépassé le délai autorisé."))
      );
    }, timeoutMs);
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { ok?: boolean; out?: unknown; err?: unknown };
      if (!data || typeof data.ok !== "boolean") {
        return;
      }
      window.clearTimeout(timer);
      if (data.ok) {
        finish(() =>
          resolve(String(data.out ?? "").slice(0, MAX_OUTPUT_LENGTH))
        );
      } else {
        finish(() => reject(new Error(String(data.err || "Erreur JS"))));
      }
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      finish(() => reject(new Error(event.message || "Erreur du Worker JS")));
    };
    // Le script du worker s'exécute au chargement ; aucun message n'est requis.
  });
}

type PythonEntry = {
  worker: Worker;
  ready: Promise<void>;
  pending: {
    reject: (error: Error) => void;
    resolve: (output: string) => void;
  } | null;
};

function createPythonEntry(): PythonEntry {
  const worker = new Worker("/workers/python-sandbox.js");
  let resolveReady: () => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const entry: PythonEntry = { pending: null, ready, worker };

  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      message?: unknown;
      output?: unknown;
    };
    if (!data || typeof data.type !== "string") return;
    if (data.type === "ready") {
      resolveReady();
      return;
    }
    if (data.type === "error" && !entry.pending) {
      rejectReady(
        new Error(
          String(data.message || "Moteur Python indisponible.").slice(0, 500)
        )
      );
      return;
    }
    if (!entry.pending) return;
    const pending = entry.pending;
    entry.pending = null;
    if (data.type === "result") {
      pending.resolve(String(data.output ?? "").slice(0, MAX_OUTPUT_LENGTH));
    } else if (data.type === "error") {
      pending.reject(
        new Error(String(data.message || "Erreur Python").slice(0, 500))
      );
    }
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || "Erreur du Worker Python");
    rejectReady(error);
    if (entry.pending) {
      const pending = entry.pending;
      entry.pending = null;
      pending.reject(error);
    }
  };
  worker.postMessage({ type: "init" });
  return entry;
}

export function CodeExecution({ code, language = "python" }: Props) {
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [pythonState, setPythonState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const pythonRef = useRef<PythonEntry | null>(null);

  const disposePython = useCallback(() => {
    const entry = pythonRef.current;
    pythonRef.current = null;
    if (entry) {
      entry.pending?.reject(new Error("Exécution interrompue."));
      entry.pending = null;
      entry.worker.terminate();
    }
    setPythonState("idle");
  }, []);

  useEffect(() => disposePython, [disposePython]);

  const runPythonSandbox = useCallback(
    async (source: string): Promise<string> => {
      if (source.length > MAX_CODE_LENGTH) {
        throw new Error("Code trop long.");
      }
      if (!pythonRef.current) {
        setPythonState("loading");
        pythonRef.current = createPythonEntry();
      }
      const entry = pythonRef.current;

      let loadTimer: number | undefined;
      try {
        await Promise.race([
          entry.ready,
          new Promise<never>((_, reject) => {
            loadTimer = window.setTimeout(
              () =>
                reject(
                  new Error(
                    "Le chargement du moteur Python a dépassé le délai autorisé."
                  )
                ),
              PYTHON_LOAD_TIMEOUT_MS
            );
          }),
        ]);
      } catch (loadError) {
        disposePython();
        setPythonState("error");
        throw loadError;
      } finally {
        if (loadTimer !== undefined) window.clearTimeout(loadTimer);
      }
      setPythonState("ready");

      return new Promise<string>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          if (entry.pending) {
            entry.pending = null;
            disposePython();
            reject(new Error("L'exécution a dépassé le délai autorisé."));
          }
        }, PYTHON_TIMEOUT_MS);
        entry.pending = {
          reject: (runError) => {
            window.clearTimeout(timer);
            reject(runError);
          },
          resolve: (runOutput) => {
            window.clearTimeout(timer);
            resolve(runOutput);
          },
        };
        entry.worker.postMessage({ code: source, type: "run" });
      });
    },
    [disposePython]
  );

  const run = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    try {
      if (language === "python") {
        const result = await runPythonSandbox(code);
        setOutput(result.trim() || "(exécution réussie — pas de sortie)");
      } else {
        const result = await runJsInSandbox(code, JS_TIMEOUT_MS);
        setOutput(result.trim() || "(exécution JS réussie)");
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : String(runError));
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };

  const pythonLabel =
    pythonState === "ready"
      ? "• prêt"
      : pythonState === "loading"
        ? "• chargement..."
        : pythonState === "error"
          ? "• erreur de chargement"
          : "• chargement à la demande";

  return (
    <div className="w-[min(100%,600px)] rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40">
        <span className="text-[12px] font-semibold flex items-center gap-1.5">
          <PlayIcon className="size-3.5" />{" "}
          {language === "python"
            ? "Python (Pyodide, worker isolé)"
            : "JavaScript (worker isolé)"}{" "}
          {language === "python" ? pythonLabel : "• prêt"}
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
            disabled={isRunning}
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
