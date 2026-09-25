import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..", "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("Intégrité des fichiers", () => {
  it("stocke les nouveaux blobs en privé et signe leur lecture", () => {
    const route = read("app/(chat)/api/files/upload/route.ts");
    expect(route).toContain('access: "private"');
    expect(route).toContain("issueSignedToken");
    expect(route).toContain("presignUrl");
    expect(route).not.toContain('access: "public"');
  });

  it("ne renvoie plus un succès optimiste au renommage de bibliothèque", () => {
    const route = read("app/(chat)/api/library/route.ts");
    expect(route).toContain("service_unavailable");
    expect(route).not.toContain(
      "return NextResponse.json({ id, name, success: true })"
    );
  });

  it("ne supprime pas la ligne projet si la suppression cloud échoue", () => {
    const route = read("app/(chat)/api/projects/[id]/files/route.ts");
    expect(route).toContain("Suppression cloud refusée");
    expect(route).toContain("Suppression cloud indisponible");
  });
});
