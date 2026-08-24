"use client";

import { CopyIcon, Loader2Icon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  code: string;
  language?: string;
};

export function CodeExecution({ code, language = "python" }: Props) {
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);

  useEffect(() => {
    // Check pyodide readiness
    const check = setInterval(() => {
      if ((window as any).pyodide) {
        setPyodideReady(true);
        clearInterval(check);
      }
      if ((window as any).loadPyodide) {
        // load if not loaded
        (window as any)
          .loadPyodide?.()
          .then((py: any) => {
            (window as any).pyodide = py;
            setPyodideReady(true);
          })
          .catch(() => {
            /* CDN indisponible */
          });
        clearInterval(check);
      }
    }, 800);
    return () => clearInterval(check);
  }, []);

  const run = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    try {
      if (language === "python") {
        const py = (window as any).pyodide;
        if (!py) {
          setError(
            "Pyodide non chargé. Réessayez dans quelques secondes (chargement CDN)."
          );
          setIsRunning(false);
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
        try {
          const result = await py.runPythonAsync(code);
          if (result !== undefined && result !== null) {
            const str = String(result);
            if (str !== "undefined" && str !== "None") {
              stdout += str;
            }
          }
          setOutput(stdout.trim() || "(exécution réussie — pas de sortie)");
        } catch (e: any) {
          setError(e.message || String(e));
        }
      } else {
        // JS
        let stdout = "";
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          stdout += `${args.map(String).join(" ")}\n`;
        };
        try {
          const fn = new Function(code);
          const res = fn();
          if (res !== undefined) {
            stdout += String(res);
          }
          setOutput(stdout.trim() || "(exécution JS réussie)");
        } catch (e: any) {
          setError(e.message || String(e));
        } finally {
          console.log = originalLog;
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
          {pyodideReady ? "• prêt" : "• chargement..."}
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
