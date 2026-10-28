import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("POST /api/settings — corps lu une seule fois", () => {
  it("ne consomme pas le corps JSON deux fois", () => {
    const source = read("app/(chat)/api/settings/route.ts");
    const post = source.slice(source.indexOf("export async function POST"));

    // `NextRequest.json()` n'est pas mémorisé : une seconde lecture rejette et
    // faisait valider `null` par Zod (« champ: objet attendu, null reçu »).
    expect(post.match(/await req\.json\(\)/g) ?? []).toHaveLength(1);
    expect(post).toContain("jsonBody = await req.json()");
    expect(post).toContain("updateProfileSchema.safeParse(raw)");
  });
});
