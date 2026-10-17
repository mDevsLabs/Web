/**
 * 必须在任何 `monaco-editor` 初始化之前执行。
 * Worker unique mis en cache (évite la fuite `new Worker` à chaque appel),
 * URL compatible `vite build` + `file://` via `?worker`.
 */
import EditorWorker from "./editor.worker?worker";

let cachedWorker: Worker | null = null;

function installMonacoEnvironment(): void {
  const globalObj = typeof self === "undefined" ? globalThis : self;

  (
    globalObj as unknown as {
      MonacoEnvironment?: { getWorker: typeof getWorker };
    }
  ).MonacoEnvironment = {
    getWorker,
  };
}

function getWorker(_moduleId: string, _label: string): Worker {
  // Tous les labels partagent l'editor worker (preview: pas besoin des
  // workers ts/json/css/html). Cache pour éviter la fuite.
  if (cachedWorker) return cachedWorker;
  try {
    cachedWorker = new EditorWorker();
    return cachedWorker;
  } catch {
    // Fallback legacy (dev sans ?worker).
    return new Worker(
      new URL(
        "../node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
        import.meta.url
      ),
      {
        type: "module",
      }
    );
  }
}

installMonacoEnvironment();

export function disposeMonacoWorker(): void {
  try {
    cachedWorker?.terminate();
  } catch {
    /* ignore */
  }
  cachedWorker = null;
}
