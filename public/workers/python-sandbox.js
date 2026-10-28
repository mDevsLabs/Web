/* global loadPyodide */
/**
 * Bac à sable Python (Pyodide) exécuté dans un Worker dédié.
 *
 * Pourquoi un Worker : le code non fiable n'a plus accès au DOM, aux cookies,
 * au localStorage ni aux objets de la page. Pyodide est chargé ICI, puis les
 * capacités réseau et le pont `js` sont retirés avant la première exécution.
 *
 * Limites assumées : un Worker n'est pas une origine séparée. Le réseau est
 * retiré de la realm et les imports Python dangereux sont bloqués, mais une
 * évasion sophistiquée de Pyodide reste théoriquement possible. La durée est
 * bornée par le thread principal qui TERMINE le worker (ce qui libère aussi la
 * mémoire), et la sortie est plafonnée.
 */

const MAX_OUTPUT = 100_000;
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/";
const send = self.postMessage.bind(self);

let pyodide = null;
let runner = null;
let initializing = null;
let lockedDown = false;

function appendOutput(current, chunk) {
  const next = current + String(chunk);
  if (next.length > MAX_OUTPUT) {
    throw new Error("Sortie trop volumineuse (max 100 000 caractères).");
  }
  return next;
}

const IMPORT_GUARD = `
import builtins as _mai_builtins
import sys as _mai_sys

_MAI_BLOCKED_ROOTS = {
    "js", "pyodide", "pyodide_js", "pyodide.http",
    "urllib", "http", "socket", "ssl", "requests", "aiohttp",
    "websockets", "ftplib", "smtplib", "telnetlib", "xmlrpc",
    "webbrowser", "http.client", "urllib.request",
}
_MAI_ORIGINAL_IMPORT = _mai_builtins.__import__

def _mai_guarded_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = str(name).split(".")[0]
    if root in _MAI_BLOCKED_ROOTS or str(name) in _MAI_BLOCKED_ROOTS:
        raise ImportError("Import interdit dans le bac à sable (réseau/JS).")
    return _MAI_ORIGINAL_IMPORT(name, globals, locals, fromlist, level)

_mai_builtins.__import__ = _mai_guarded_import

for _mai_name in list(_mai_sys.modules):
    if _mai_name.split(".")[0] in _MAI_BLOCKED_ROOTS:
        _mai_sys.modules.pop(_mai_name, None)

def _mai_run(code):
    safe_builtins = dict(_mai_builtins.__dict__)
    safe_builtins["__import__"] = _mai_guarded_import
    scope = {"__builtins__": safe_builtins, "__name__": "__mai_sandbox__"}
    exec(compile(code, "<mAI>", "exec"), scope, scope)
    return None

_mai_run
`;

function lockDownWorkerRealm() {
  if (lockedDown) return;
  lockedDown = true;
  // `send` est la seule référence conservée (capturée avant le retrait).
  // Réseau et communication retirés. `WebAssembly`, `Function` et `eval` sont
  // laissés au moteur Pyodide : ils exécutent déjà le bytecode Python et ne
  // donnent aucun accès au DOM ni aux secrets de la page dans cette realm.
  const capabilities = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "importScripts",
    "indexedDB",
    "caches",
    "navigator",
    "Worker",
    "SharedWorker",
    "BroadcastChannel",
    "MessageChannel",
    "Notification",
    "RTCPeerConnection",
    "Image",
    "Audio",
    "postMessage",
    "close",
  ];
  for (const name of capabilities) {
    try {
      Object.defineProperty(self, name, {
        configurable: false,
        value: undefined,
        writable: false,
      });
    } catch {
      // Certaines propriétés ne sont pas configurables : le retrait des autres
      // reste effectif.
    }
  }
}

async function initialize() {
  if (pyodide && runner) return;
  if (initializing) return initializing;
  initializing = (async () => {
    try {
      importScripts(`${PYODIDE_URL}pyodide.js`);
      pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
      // L'installeur d'import doit être posé AVANT le retrait des capacités.
      runner = pyodide.runPython(IMPORT_GUARD);
      lockDownWorkerRealm();
      send({ type: "ready" });
    } catch (error) {
      send({
        message: `Chargement du moteur Python impossible : ${
          error?.message ? error.message : String(error)
        }`,
        type: "error",
      });
      throw error;
    } finally {
      initializing = null;
    }
  })();
  return initializing;
}

async function runPython(code) {
  await initialize();
  if (!pyodide || !runner) {
    throw new Error("Le moteur Python n'est pas disponible.");
  }
  let stdout = "";
  pyodide.setStdout({
    batched: (message) => {
      stdout = appendOutput(stdout, `${message}\n`);
    },
  });
  pyodide.setStderr({
    batched: (message) => {
      stdout = appendOutput(stdout, `${message}\n`);
    },
  });
  runner(code);
  return stdout;
}

self.onmessage = async (event) => {
  const data = event?.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "init") {
    try {
      await initialize();
    } catch {
      // L'erreur a déjà été signalée au thread principal.
    }
    return;
  }
  if (data.type === "run") {
    if (typeof data.code !== "string" || data.code.length > 200_000) {
      send({ message: "Code Python invalide ou trop long.", type: "error" });
      return;
    }
    try {
      const output = await runPython(data.code);
      send({ output: output.slice(0, MAX_OUTPUT), type: "result" });
    } catch (error) {
      send({
        message: error?.message ? error.message : String(error),
        type: "error",
      });
    }
  }
};
