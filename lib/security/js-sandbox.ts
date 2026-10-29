/**
 * Génération du script d'un Worker qui exécute du JavaScript non fiable.
 *
 * Le code utilisateur EST le corps du worker (aucun `eval`/`new Function`).
 * Avant sa première instruction, les capacités réseau, DOM et de communication
 * sont retirées de la realm. Un filtre lexical sur le texte source n'est PAS
 * une barrière : `globalThis["fe"+"tch"]` le contourne. La barrière réelle est
 * le retrait des propriétés de la realm, complété par la terminaison du worker
 * au-delà du délai et le plafond de sortie.
 *
 * Limites assumées : un worker partage l'origine de la page. Ce module ne
 * prétend pas isoler des données déjà présentes dans la même origine ; il
 * retire les API qui permettraient d'y accéder ou d'exfiltrer.
 */

export const JS_SANDBOX_MAX_OUTPUT = 100_000;
export const JS_SANDBOX_MAX_CODE = 200_000;

const REMOVED_CAPABILITIES = [
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
  "WebAssembly",
  "Image",
  "Audio",
  "postMessage",
  "close",
  "eval",
  "Function",
  "document",
  "window",
  "localStorage",
  "sessionStorage",
];

export function buildJsWorkerSource(code: string): string {
  return `
"use strict";
const __send = self.postMessage.bind(self);
let __out = "";
const __append = (value) => {
  __out += value;
  if (__out.length > ${JS_SANDBOX_MAX_OUTPUT}) {
    throw new Error("Sortie trop volumineuse.");
  }
};
const __console = {
  log: (...args) => __append(args.map(String).join(" ") + "\\n"),
  info: (...args) => __append(args.map(String).join(" ") + "\\n"),
  warn: (...args) => __append(args.map(String).join(" ") + "\\n"),
  error: (...args) => __append(args.map(String).join(" ") + "\\n"),
};
for (const name of ${JSON.stringify(REMOVED_CAPABILITIES)}) {
  try {
    Object.defineProperty(self, name, {
      configurable: false,
      value: undefined,
      writable: false,
    });
  } catch {}
}
try {
  const __value = (function (console) {
    "use strict";
${code}
  })(__console);
  if (__value !== undefined && __value !== null) {
    __append(String(__value));
  }
  __send({ ok: true, out: __out.slice(0, ${JS_SANDBOX_MAX_OUTPUT}) });
} catch (err) {
  __send({
    ok: false,
    err: err && err.message ? String(err.message) : String(err),
  });
}
`;
}
