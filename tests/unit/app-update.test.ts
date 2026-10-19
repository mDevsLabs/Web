// Les mises à jour doivent attendre les saisies et les réponses, même au retour réseau.
import { describe, expect, it } from "vitest";
import { canApplyAppUpdate } from "@/lib/client/app-update";

function documentState({
  visible = true,
  blocked = false,
  editor = false,
  fields = [],
}: {
  visible?: boolean;
  blocked?: boolean;
  editor?: boolean;
  fields?: Partial<HTMLInputElement | HTMLTextAreaElement>[];
} = {}): Document {
  return {
    querySelector: (selector: string) =>
      selector.includes("contenteditable")
        ? editor
          ? {}
          : null
        : blocked
          ? {}
          : null,
    querySelectorAll: () => fields,
    visibilityState: visible ? "visible" : "hidden",
  } as unknown as Document;
}

describe("application sûre d’une nouvelle version Web", () => {
  it("autorise le rechargement d’un écran libre", () => {
    expect(canApplyAppUpdate(documentState())).toBe(true);
  });
  it("attend le retour visible, la fin d’une réponse ou la fermeture d’un dialogue", () => {
    expect(canApplyAppUpdate(documentState({ visible: false }))).toBe(false);
    expect(canApplyAppUpdate(documentState({ blocked: true }))).toBe(false);
  });
  it("préserve les brouillons et l’édition d’un document", () => {
    expect(canApplyAppUpdate(documentState({ editor: true }))).toBe(false);
    expect(
      canApplyAppUpdate(
        documentState({
          fields: [
            { tagName: "TEXTAREA", type: "textarea", value: "Brouillon" },
          ],
        })
      )
    ).toBe(false);
    expect(
      canApplyAppUpdate(
        documentState({
          fields: [
            {
              defaultValue: "Ancien nom",
              tagName: "INPUT",
              type: "text",
              value: "Nom modifié",
            },
          ],
        })
      )
    ).toBe(false);
  });
  it("préserve un fichier sélectionné avant son envoi", () => {
    expect(
      canApplyAppUpdate(
        documentState({
          fields: [
            {
              defaultValue: "",
              files: { length: 1 } as FileList,
              tagName: "INPUT",
              type: "file",
              value: "",
            },
          ],
        })
      )
    ).toBe(false);
  });
  it("préserve aussi une saisie contrôlée et une case modifiée", () => {
    expect(
      canApplyAppUpdate(
        documentState({
          fields: [
            {
              defaultValue: "Brouillon",
              tagName: "INPUT",
              type: "text",
              value: "Brouillon",
            },
          ],
        })
      )
    ).toBe(false);
    expect(
      canApplyAppUpdate(
        documentState({
          fields: [
            {
              checked: true,
              defaultChecked: false,
              tagName: "INPUT",
              type: "checkbox",
              value: "on",
            },
          ],
        })
      )
    ).toBe(false);
  });
  it("ignore les valeurs techniques, désactivées ou en lecture seule", () => {
    expect(
      canApplyAppUpdate(
        documentState({
          fields: [
            { tagName: "INPUT", type: "hidden", value: "identifiant" },
            { readOnly: true, tagName: "INPUT", type: "text", value: "Statut" },
            {
              disabled: true,
              tagName: "INPUT",
              type: "text",
              value: "Indisponible",
            },
            {
              checked: true,
              defaultChecked: true,
              tagName: "INPUT",
              type: "checkbox",
              value: "on",
            },
          ],
        })
      )
    ).toBe(true);
  });
});
