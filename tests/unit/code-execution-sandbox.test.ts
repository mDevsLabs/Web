import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Exécution de code — frontières d'exécution", () => {
  it("le JavaScript n'utilise plus eval/new Function dans la page", () => {
    const source = read("components/chat/code-execution.tsx");
    // Le Worker EST le script utilisateur : aucune compilation dynamique dans
    // la realm de la page, aucun filtre lexical présenté comme une sandbox.
    expect(source).not.toMatch(/new Function\s*\(/);
    expect(source).not.toContain("BLOCKED_JS_PATTERNS");
    expect(source).toContain("buildJsWorkerSource");
  });

  it("Pyodide est chargé DANS un worker dédié, plus dans la page", () => {
    const component = read("components/chat/code-execution.tsx");
    expect(component).toContain('new Worker("/workers/python-sandbox.js")');
    expect(component).not.toContain("window.pyodide");
    const layout = read("app/(chat)/layout.tsx");
    expect(layout).not.toContain("pyodide");
  });

  it("le worker Python retire le réseau et bloque les imports dangereux", () => {
    const worker = read("public/workers/python-sandbox.js");
    expect(worker).toContain("lockDownWorkerRealm");
    expect(worker).toContain('"fetch"');
    expect(worker).toContain('"XMLHttpRequest"');
    expect(worker).toContain('"WebSocket"');
    expect(worker).toContain("_mai_guarded_import");
    expect(worker).toContain('"pyodide.http"');
    expect(worker).toContain("pyodide.setStdout");
    // Aucun accès direct au DOM de la page depuis le worker.
    expect(worker).not.toContain("window.");
    expect(worker).not.toContain("document.");
  });
});
