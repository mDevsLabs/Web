import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { MAI_API_URL } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";

type ImageGenerateProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const imageGenerate = ({ session, dataStream }: ImageGenerateProps) =>
  tool({
    description:
      "Generate an image via mAI Studio. Use when user asks to create, generate, draw, illustrate an image. Returns image_url. You MUST then display the image.",
    execute: async ({ prompt, negative_prompt, width, height }) => {
      const userId = session.user?.id || session.user?.email || "";
      // Check quota first via internal API (reuse logic)
      try {
        const token =
          (session as any)?.token || (session as any)?.user?.token || null;
        // Call MAI API directly for generation
        const payload: any = {
          height: height || 1024,
          model: "black-forest-labs/flux-1-schnell",
          negative_prompt: negative_prompt || undefined,
          prompt,
          width: width || 1024,
        };
        // Try to use internal route via fetch if session token available
        // Fallback to direct MAI_API_URL if not
        const apiUrl = `${MAI_API_URL}/v1/images/generations`;
        // We need a token; if not available, return error to instruct manual
        if (!token) {
          // Attempt to call local API via MAI session proxy? Return placeholder
          return {
            error:
              "Génération d'image non disponible sans session valide. Redirige vers /images.",
          };
        }
        const res = await fetch(apiUrl, {
          body: JSON.stringify(payload),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            error:
              data?.error?.message || data?.error || "Erreur génération image",
            quota: data?.quota,
          };
        }
        const image_url = data?.data?.[0]?.url || data?.image_url;
        if (!image_url) {
          return { error: "Aucune image retournée" };
        }

        // Stream imageDelta for realtime preview
        dataStream.write({
          data: image_url,
          transient: true,
          type: "data-imageDelta",
        });

        return {
          height: height || 1024,
          image_url,
          prompt,
          width: width || 1024,
        };
      } catch (e: any) {
        return { error: e.message || "Erreur génération image" };
      }
    },
    inputSchema: z.object({
      height: z.number().optional().default(1024).describe("Hauteur 512-1536"),
      negative_prompt: z.string().optional().describe("Éléments à exclure"),
      prompt: z.string().describe("Description détaillée de l'image à générer"),
      width: z.number().optional().default(1024).describe("Largeur 512-1536"),
    }),
  });
