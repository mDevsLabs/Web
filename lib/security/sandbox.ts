// Isolation des aperçus HTML (« sandbox » de l'artifact html, du chat et des
// documents) : contenu NON fiable — produit par le modèle, édité ou collé par
// l'utilisateur.
//
// Deux invariants, tous les deux testés (tests/unit/sandbox-security.test.ts) :
//
//  1. Le document sandboxé n'a JAMAIS l'origine de l'application.
//     `sandbox="allow-scripts allow-same-origin"` sur un `srcDoc` donne au
//     contenu l'origine de la page hôte (le document hérite de l'origine de son
//     parent) : combiné à `allow-scripts`, l'isolation est nulle — le contenu
//     atteint le DOM parent, `localStorage`, les cookies et les API
//     applicatives. On n'accorde donc que `allow-scripts` : l'origine est
//     opaque, `parent.postMessage` reste possible (donc la console marche),
//     mais tout accès à l'hôte est refusé par le navigateur.
//
//  2. Aucun message venant d'une autre fenêtre n'est cru. L'origine d'un
//     document opaque est « null », elle ne peut donc pas servir de contrôle :
//     la seule preuve acceptable est `event.source === iframe.contentWindow`.
//
// La CSP ferme les canaux d'exfiltration et de navigation qui ne dépendent pas
// de l'origine (`connect-src`, `form-action`, `base-uri`) tout en laissant les
// CDN nécessaires aux aperçus Tailwind/React fonctionner.

/** Plafond du texte retransmis par le pont console (anti-saturation mémoire). */
export const MAX_SANDBOX_LOG_CHARS = 4000;

/** Longueur maximale d'un document d'aperçu accepté avant injection. */
export const MAX_SANDBOX_DOC_CHARS = 2_000_000;

/** Seule capacité accordée à l'iframe : les scripts, sans origine partagée. */
export const SANDBOX_IFRAME_SANDBOX = "allow-scripts";

export const SANDBOX_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'unsafe-inline' https:",
  "img-src data: blob: https:",
  "font-src data: https:",
  "media-src data: blob: https:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
].join("; ");

export const SANDBOX_CSP_META = `<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">`;

export const SANDBOX_CONSOLE_BRIDGE = `
<script>
(function () {
  var send = function (level, args) {
    try {
      var text = Array.prototype.map.call(args, function (a) {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === "object" && a !== null) {
          try { return JSON.stringify(a, null, 1); } catch (e) { return String(a); }
        }
        return String(a);
      }).join(" ").slice(0, ${MAX_SANDBOX_LOG_CHARS});
      // Cible « * » : l'origine du document est opaque, aucune origine
      // spécifique n'est adressable. La confiance est établie côté parent par
      // la vérification de event.source (jamais par l'origine du message).
      parent.postMessage({ __maiSandbox: true, level: level, text: text }, "*");
    } catch (e) {}
  };
  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      send(level, arguments);
      original.apply(null, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send("error", [event.message + " (" + (event.filename || "") + ":" + event.lineno + ")"]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("error", ["Promesse rejetée : " + (event.reason && (event.reason.stack || event.reason.message) || event.reason)]);
  });
  parent.postMessage({ __maiSandbox: true, level: "info", text: "Sandbox rechargée" }, "*");
})();
</script>`;

export const SANDBOX_TAILWIND_CDN = `<script src="https://cdn.tailwindcss.com"></script>`;

export const SANDBOX_REACT_CDN = `
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;

export type SandboxLogLevel = "error" | "info" | "log" | "warn";

export type SandboxLogMessage = {
  level: SandboxLogLevel;
  text: string;
};

const LOG_LEVELS: readonly SandboxLogLevel[] = ["log", "info", "warn", "error"];

export function detectReactMode(content: string): boolean {
  return (
    /type=["']text\/babel["']/i.test(content) ||
    /from\s+["']react["']|require\(["']react["']\)/i.test(content) ||
    /ReactDOM\.render|createRoot\s*\(/i.test(content)
  );
}

export function detectTailwind(content: string): boolean {
  return /tailwind/i.test(content);
}

// Injecte un contenu dans <head> (ou crée le document complet si besoin).
export function injectIntoHead(html: string, injections: string): string {
  if (!injections) {
    return html;
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n${injections}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(
      /<html[^>]*>/i,
      (m) => `${m}\n<head>${injections}</head>`
    );
  }
  return `<!DOCTYPE html><html><head>${injections}</head><body>${html}</body></html>`;
}

/**
 * Construit le document d'aperçu.
 *
 * Ordre d'injection volontaire : la CSP est injectée EN DERNIER, car
 * `injectIntoHead` insère juste après `<head>` — la dernière injection se
 * retrouve donc en tête de `<head>`, avant tout script du pont console, des CDN
 * ou du contenu fourni. Un `<script>` du contenu ne peut ainsi jamais
 * s'exécuter avant que la politique soit connue du navigateur.
 */
export function buildSandboxDocument(params: {
  content: string;
  reactMode: boolean;
  tailwindEnabled: boolean;
}): string {
  const content =
    params.content.length > MAX_SANDBOX_DOC_CHARS
      ? params.content.slice(0, MAX_SANDBOX_DOC_CHARS)
      : params.content;

  let doc = injectIntoHead(content, SANDBOX_CONSOLE_BRIDGE);
  if (params.tailwindEnabled) {
    doc = injectIntoHead(doc, SANDBOX_TAILWIND_CDN);
  }
  if (params.reactMode) {
    doc = injectIntoHead(doc, SANDBOX_REACT_CDN);
  }
  return injectIntoHead(doc, SANDBOX_CSP_META);
}

/**
 * Valide un message de console émis par l'iframe d'aperçu.
 *
 * Renvoie `null` pour tout message qui ne vient pas EXACTEMENT de cette frame :
 * source différente (autre fenêtre/onglet/iframe), `__maiSandbox` absent ou non
 * booléen, niveau inconnu, texte non textuel. Un message forgé par un site tiers
 * ouvert dans un autre onglet est ainsi rejeté, alors que l'ancien contrôle
 * (« le message contient un champ __maiSandbox ») l'acceptait.
 */
export function readSandboxLogMessage(params: {
  data: unknown;
  expectedWindow: unknown;
  source: unknown;
}): SandboxLogMessage | null {
  if (!params.expectedWindow || params.source !== params.expectedWindow) {
    return null;
  }
  const data = params.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (record.__maiSandbox !== true) {
    return null;
  }
  const level = LOG_LEVELS.includes(record.level as SandboxLogLevel)
    ? (record.level as SandboxLogLevel)
    : "log";
  const text =
    typeof record.text === "string"
      ? record.text.slice(0, MAX_SANDBOX_LOG_CHARS)
      : "";
  return { level, text };
}
