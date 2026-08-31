import { tool } from "ai";
import { z } from "zod";

export const qrCodeGenerator = tool({
  description:
    "Générer un QR Code vectoriel haute définition (SVG ou URL d'image) pour un lien Web, un texte, une configuration de réseau Wi-Fi ou des coordonnées vCard. Prêt à être scanné avec un smartphone.",
  execute: async (input) => {
    const { data, size = 300, margin = 2, errorCorrection = "M", format = "svg", color = "000000", bgColor = "ffffff" } = input;

    const trimmed = data.trim();
    if (!trimmed) {
      return { error: "Contenu du QR code manquant ou vide." };
    }

    const cleanColor = color.replace("#", "");
    const cleanBgColor = bgColor.replace("#", "");

    // Utilisation de l'API de rendu open-source QRServer fiable et rapide
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      trimmed
    )}&margin=${margin}&ecc=${errorCorrection}&format=${format}&color=${cleanColor}&bgcolor=${cleanBgColor}`;

    try {
      if (format === "svg") {
        const response = await fetch(qrUrl);
        if (response.ok) {
          const svgContent = await response.text();
          return {
            bgColor: `#${cleanBgColor}`,
            color: `#${cleanColor}`,
            data: trimmed,
            format: "svg",
            imageUrl: qrUrl,
            size,
            svg: svgContent,
          };
        }
      }

      return {
        bgColor: `#${cleanBgColor}`,
        color: `#${cleanColor}`,
        data: trimmed,
        format,
        imageUrl: qrUrl,
        size,
      };
    } catch (err: any) {
      return {
        error: `Erreur lors de la génération du QR code : ${err.message || "inconnue"}`,
        imageUrl: qrUrl,
      };
    }
  },
  inputSchema: z.object({
    bgColor: z
      .string()
      .optional()
      .describe("Couleur d'arrière-plan hexadécimale (défaut: 'ffffff')"),
    color: z
      .string()
      .optional()
      .describe("Couleur du QR code en code hexadécimal sans dièse ou avec (défaut: '000000')"),
    data: z
      .string()
      .min(1)
      .max(2000)
      .describe("Le texte, lien URL, contact vCard ou configuration Wi-Fi à encoder dans le QR Code"),
    errorCorrection: z
      .enum(["L", "M", "Q", "H"])
      .optional()
      .describe("Niveau de correction d'erreurs (L: 7%, M: 15%, Q: 25%, H: 30%, défaut: M)"),
    format: z
      .enum(["svg", "png"])
      .optional()
      .describe("Format de sortie souhaité : 'svg' (recommandé, vectoriel) ou 'png' (défaut: svg)"),
    margin: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .describe("Marge blanche autour du code (défaut: 2)"),
    size: z
      .number()
      .int()
      .min(100)
      .max(1000)
      .optional()
      .describe("Dimension en pixels (largeur et hauteur, défaut: 300)"),
  }),
});
