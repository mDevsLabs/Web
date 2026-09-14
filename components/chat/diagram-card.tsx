"use client";

import DOMPurify from "dompurify";
import {
  CodeIcon,
  DownloadIcon,
  ImageDownIcon,
  Maximize2Icon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  WaypointsIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DiagramOutput = {
  code?: string;
  description?: string;
  error?: string;
  format?: "mermaid" | "plantuml";
  title?: string;
};

let mermaidModulePromise: Promise<any> | null = null;
let mermaidCounter = 0;

async function getMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((mod) => {
      const mermaid = (mod as any).default ?? mod;
      const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
      mermaid.initialize({
        fontFamily: "var(--font-sans, ui-sans-serif, system-ui)",
        // strict bloque <foreignObject>/scripts dans le SVG généré
        securityLevel: "strict",
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
      });
      return mermaid;
    });
  }
  return mermaidModulePromise;
}

// PlantUML : rendu via Kroki (service public, POST texte brut — pas besoin
// d'encodage deflate côté client).
async function renderPlantUml(code: string): Promise<string> {
  const res = await fetch("https://kroki.io/plantuml/svg", {
    body: code,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Kroki a répondu ${res.status}`);
  }
  return res.text();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "diagramme"
  );
}

// Purifie le SVG (mermaid/kroki) : supprime scripts, event-handlers,
// foreignObject — indispensable avant dangerouslySetInnerHTML.
export function sanitizeSvg(svg: string): string {
  if (!svg) return "";
  return DOMPurify.sanitize(svg, {
    ADD_TAGS: ["foreignObject"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "a"],
    USE_PROFILES: { svg: true },
  });
}

async function exportSvg(svg: string, title: string) {
  const withXmlns = svg.includes("<svg")
    ? svg.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    : svg;
  downloadBlob(
    new Blob([withXmlns], { type: "image/svg+xml;charset=utf-8" }),
    `${slugify(title)}.svg`
  );
}

async function exportPng(svg: string, title: string) {
  const withXmlns = svg.includes("<svg")
    ? svg.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    : svg;
  const svgBlob = new Blob([withXmlns], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Rendu PNG impossible"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, img.width * scale);
    canvas.height = Math.max(1, img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas indisponible");
    }
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) {
      throw new Error("Export PNG impossible");
    }
    downloadBlob(blob, `${slugify(title)}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function DiagramCard({
  output,
  state,
}: {
  output?: DiagramOutput;
  state?: string;
}) {
  const code = output?.code ?? "";
  const format = output?.format ?? "mermaid";
  const title = output?.title ?? "Diagramme";

  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const dragRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "output-available" || !code) {
      return;
    }
    let cancelled = false;
    setSvg(null);
    setRenderError(null);
    (async () => {
      try {
        if (format === "plantuml") {
          const rendered = await renderPlantUml(code);
          if (!cancelled) {
            setSvg(rendered);
          }
        } else {
          const mermaid = await getMermaid();
          const id = `mai-diagram-${++mermaidCounter}`;
          const { svg: rendered } = await mermaid.render(id, code);
          if (!cancelled) {
            setSvg(rendered);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setRenderError(
            String(err?.message ?? err).slice(0, 400) ||
              "Impossible de rendre ce diagramme."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, format, state]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) =>
      Math.min(4, Math.max(0.2, z * (e.deltaY < 0 ? 1.12 : 0.89)))
    );
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        panX: pan.x,
        panY: pan.y,
        x: e.clientX,
        y: e.clientY,
      };
    },
    [pan]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    setPan({
      x: drag.panX + (e.clientX - drag.x),
      y: drag.panY + (e.clientY - drag.y),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (state !== "output-available") {
    return (
      <div className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <WaypointsIcon className="size-3.5 animate-pulse" />
        Génération du diagramme…
      </div>
    );
  }

  if (output?.error) {
    return (
      <div className="w-[min(100%,450px)] rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
        {output.error}
      </div>
    );
  }

  const hasRendered = Boolean(svg) && !renderError;

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <button
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 hover:bg-muted",
          showCode && "bg-muted"
        )}
        onClick={() => setShowCode((v) => !v)}
        title={showCode ? "Voir le diagramme" : "Voir le code"}
        type="button"
      >
        <CodeIcon className="size-3" />
        {showCode ? "Aperçu" : "Code"}
      </button>
      <button
        className="rounded-md border border-border/50 px-1.5 py-1 hover:bg-muted disabled:opacity-40"
        disabled={!hasRendered}
        onClick={() => setZoom((z) => Math.max(0.2, z * 0.85))}
        title="Zoom arrière"
        type="button"
      >
        <MinusIcon className="size-3" />
      </button>
      <span className="w-10 text-center font-mono text-[10px] text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <button
        className="rounded-md border border-border/50 px-1.5 py-1 hover:bg-muted disabled:opacity-40"
        disabled={!hasRendered}
        onClick={() => setZoom((z) => Math.min(4, z * 1.15))}
        title="Zoom avant"
        type="button"
      >
        <PlusIcon className="size-3" />
      </button>
      <button
        className="rounded-md border border-border/50 px-1.5 py-1 hover:bg-muted disabled:opacity-40"
        disabled={!hasRendered || (zoom === 1 && pan.x === 0 && pan.y === 0)}
        onClick={resetView}
        title="Réinitialiser la vue"
        type="button"
      >
        <RotateCcwIcon className="size-3" />
      </button>
      <span className="flex-1" />
      <button
        className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 hover:bg-muted disabled:opacity-40"
        disabled={!svg}
        onClick={() => svg && exportSvg(svg, title)}
        title="Exporter en SVG"
        type="button"
      >
        <DownloadIcon className="size-3" />
        SVG
      </button>
      <button
        className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 hover:bg-muted disabled:opacity-40"
        disabled={!svg}
        onClick={() => svg && exportPng(svg, title)}
        title="Exporter en PNG"
        type="button"
      >
        <ImageDownIcon className="size-3" />
        PNG
      </button>
      <button
        className="rounded-md border border-border/50 px-1.5 py-1 hover:bg-muted disabled:opacity-40"
        disabled={!hasRendered}
        onClick={() => setFullscreen(true)}
        title="Plein écran"
        type="button"
      >
        <Maximize2Icon className="size-3" />
      </button>
    </div>
  );

  const body = showCode ? (
    <pre className="max-h-72 overflow-auto rounded-lg border border-border/40 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
      {code}
    </pre>
  ) : renderError ? (
    <div className="space-y-2">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11.5px] text-amber-700 dark:text-amber-400">
        Erreur de rendu : {renderError}
      </div>
      <pre className="max-h-40 overflow-auto rounded-lg border border-border/40 bg-muted/40 p-2 font-mono text-[11px]">
        {code}
      </pre>
    </div>
  ) : svg ? (
    <div
      className="relative h-64 cursor-grab touch-none overflow-hidden rounded-lg border border-border/40 bg-white active:cursor-grabbing dark:bg-zinc-900"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      ref={containerRef}
    >
      <div
        className="flex h-full w-full items-center justify-center p-2 [&_svg]:max-h-full [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center",
        }}
      />
    </div>
  ) : (
    <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
      Rendu du diagramme…
    </div>
  );

  return (
    <div className="w-[min(100%,640px)] overflow-hidden rounded-xl border border-border/50 bg-card/60 shadow-xs">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <WaypointsIcon className="size-3.5 shrink-0 text-primary" />
        <span className="truncate text-[12.5px] font-semibold">{title}</span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase text-muted-foreground">
          {format}
        </span>
      </div>
      <div className="space-y-2 p-2.5">
        {toolbar}
        {body}
        {output?.description && !showCode ? (
          <p className="text-[11.5px] text-muted-foreground">
            {output.description}
          </p>
        ) : null}
      </div>

      {fullscreen && hasRendered ? (
        <div className="fixed inset-0 z-100 flex flex-col bg-background/95 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 pb-2">
            <span className="truncate text-sm font-semibold">{title}</span>
            <span className="flex-1" />
            <div className="scale-110">{toolbar}</div>
            <button
              className="ml-2 rounded-md border border-border/50 p-1.5 hover:bg-muted"
              onClick={() => setFullscreen(false)}
              title="Fermer"
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 cursor-grab items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-white active:cursor-grabbing dark:bg-zinc-900"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
          >
            <div
              className="flex h-full w-full items-center justify-center p-4 [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg as string) }}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
