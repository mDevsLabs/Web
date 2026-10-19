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

  it("ne renvoie jamais un succès optimiste au renommage de bibliothèque", () => {
    const route = read("app/(chat)/api/library/route.ts");
    // Le renommage renvoie ce que l'amont a répondu, ou son erreur. La garde
    // porte désormais sur la forme du succès, plus sur une constante de code :
    // le message d'indisponibilité est annoncé quand l'amont est injoignable.
    expect(route).not.toContain(
      "return NextResponse.json({ id, name, success: true })"
    );
    expect(route).toContain("Le nom n'a pas été modifié");
  });

  it("ne supprime pas la ligne projet si la suppression cloud échoue", () => {
    const route = read("app/(chat)/api/projects/[id]/files/route.ts");
    expect(route).toContain("Suppression cloud refusée");
    // L'ancien garde `throw new Error("Suppression cloud indisponible.")` a
    // disparu : le client amont ne lève plus, il retourne un payload d'erreur,
    // donc toute suppression non-404 est un refus et le `throw` n'a plus lieu
    // d'être dans cette forme.
    expect(route).not.toContain("Suppression cloud indisponible");
    // L'invariant est l'ordre dans le gestionnaire DELETE : le contrôle de la
    // suppression cloud, puis la suppression de la ligne projet. On isole ce
    // gestionnaire, sinon `indexOf` trouverait la première occurrence dans le
    // fichier entier, et l'ordre vérifié ne voudrait rien dire.
    const deleteHandler = route.slice(
      route.indexOf("export async function DELETE")
    );
    const remoteIndex = deleteHandler.indexOf("remoteDelete");
    const rowIndex = deleteHandler.indexOf("deleteProjectFile({ id: fileId })");
    expect(remoteIndex).toBeGreaterThan(-1);
    expect(rowIndex).toBeGreaterThan(remoteIndex);
  });
});
