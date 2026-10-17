import { describe, expect, it } from "vitest";
import {
  assainirNom,
  FORMATS_REFUSES,
  FORMATS_TELEVERSABLES,
  formaterTaille,
  motifRefus,
  partDePiece,
  pieceSelectionnee,
  TAILLE_MAX,
} from "@/components/wakies/attachments";

describe("utilitaires de pièces jointes Wakies", () => {
  describe("assainirNom", () => {
    it("retire les caractères invisibles, de contrôle et les bidi", () => {
      // Caractères de contrôle ASCII (0x00, 0x1F, 0x7F) et caractères bidi (0x202E RTL override)
      const nomMalicieux = "mon\u0000fichier\u202Etxt.pdf\u007F";
      expect(assainirNom(nomMalicieux)).toBe("monfichiertxt.pdf");
    });

    it("fournit un repli 'fichier' pour un nom vide ou contenant uniquement des espaces", () => {
      expect(assainirNom("")).toBe("fichier");
      expect(assainirNom("   ")).toBe("fichier");
      expect(assainirNom("\u0000\u001F")).toBe("fichier");
    });

    it("limite le nom à 120 caractères", () => {
      const longNom = "a".repeat(200);
      expect(assainirNom(longNom)).toHaveLength(120);
    });

    it("préserve les noms valides en français avec accents", () => {
      expect(assainirNom("Rapport_Activité_2026.pdf")).toBe(
        "Rapport_Activité_2026.pdf"
      );
    });
  });

  describe("formaterTaille", () => {
    it("formate correctement les octets, Ko et Mo avec la notation française", () => {
      expect(formaterTaille(500)).toBe("500 o");
      expect(formaterTaille(1024)).toBe("1 Ko");
      expect(formaterTaille(2048)).toBe("2 Ko");
      expect(formaterTaille(1024 * 1024)).toBe("1,0 Mo");
      expect(formaterTaille(2.5 * 1024 * 1024)).toBe("2,5 Mo");
      expect(formaterTaille(15.75 * 1024 * 1024)).toBe("15,8 Mo");
    });
  });

  describe("motifRefus", () => {
    it("refuse les types dangereux (HTML, JavaScript, SVG)", () => {
      for (const mime of FORMATS_REFUSES) {
        const file = new File(["test"], "test", { type: mime });
        expect(motifRefus(file)).toBe(
          "Ce format n'est pas accepté. Utilisez du texte, une image ou un PDF."
        );
      }
    });

    it("refuse les fichiers dépassant 50 Mo", () => {
      const grosFichier = new File([""], "gros.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(grosFichier, "size", { value: TAILLE_MAX + 1 });
      expect(motifRefus(grosFichier)).toBe(
        "Ce fichier dépasse 50 Mo. Choisissez-en un plus léger."
      );
    });

    it("accepte les types supportés (PDF, JSON, PNG, CSV, etc.)", () => {
      for (const mime of Object.keys(FORMATS_TELEVERSABLES)) {
        const file = new File(["data"], "test", { type: mime });
        expect(motifRefus(file)).toBeNull();
      }
      const jpeg = new File(["data"], "photo.jpg", { type: "image/jpeg" });
      expect(motifRefus(jpeg)).toBeNull();
    });

    it("refuse les types MIME non supportés (ex. application/zip)", () => {
      const zip = new File(["zip"], "archive.zip", {
        type: "application/zip",
      });
      expect(motifRefus(zip)).toBe(
        "Ce format n'est pas accepté. Utilisez du texte, une image ou un PDF."
      );
    });
  });

  describe("pieceSelectionnee et partDePiece", () => {
    it("crée un état de pièce sélectionnée prêt pour le composant", () => {
      const file = new File(["hello"], "document.pdf", {
        type: "application/pdf",
      });
      const etat = pieceSelectionnee(file);
      expect(etat.nom).toBe("document.pdf");
      expect(etat.etat).toBe("selectionne");
      expect(etat.taille).toBe(file.size);
      expect(etat.progression).toBe(0);
      expect(etat.idLocal).toMatch(/^piece-\d+-/);
    });

    it("transforme un état prêt en part de message sérialisable pour PostgreSQL", () => {
      const part = partDePiece({
        etat: "pret",
        idLocal: "local-1",
        nom: "rapport.pdf",
        pathname: "uploads/user/rapport.pdf",
        progression: 1,
        taille: 1024,
        type: "application/pdf",
      });
      expect(part).toEqual({
        fileName: "rapport.pdf",
        mediaType: "application/pdf",
        pathname: "uploads/user/rapport.pdf",
        size: 1024,
        type: "file",
      });
    });
  });
});
