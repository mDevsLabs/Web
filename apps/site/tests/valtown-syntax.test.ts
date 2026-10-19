import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function resolveFile(file: string): string {
  const candidates = [
    join(process.cwd(), file),
    join(import.meta.dirname, "..", file),
    join(import.meta.dirname, "..", "..", "..", file),
    join(process.cwd(), "..", "..", file),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return join(process.cwd(), file);
}

describe("Val Town TypeScript syntax", () => {
  it.each(["api-middleware.ts", "models.ts"])("parses %s", (file) => {
    const source = readFileSync(resolveFile(file), "utf8");
    const result = ts.transpileModule(source, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        isolatedModules: true,
      },
    });
    const errors = (result.diagnostics || []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    expect(errors).toEqual([]);
  });
});
