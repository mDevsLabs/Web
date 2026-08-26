import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";
import { formatImageSrc } from "@/lib/utils";

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
        let token =
          (session as any)?.token || (session as any)?.user?.token || null;
        if (!token) {
          token = await getMaiSessionToken();
        }
        // Call MAI API directly for generation
        const payload: any = {
          height: height || 1024,
          model: "black-forest-labs/flux-1-schnell",
          negative_prompt: negative_prompt || undefined,
          prompt,
          width: width || 1024,
        };
        if (!token) {
          return {
            error:
              "Génération d'image non disponible sans session valide. Redirige vers /images.",
          };
        }

        // Vérification préalable du quota journalier disponible
        try {
          const usageRes = await fetch(`${MAI_API_URL}/v1/images/usage`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            const dailyLimit = Number(usageData.dailyLimit ?? 0);
            const usedToday = Number(usageData.usedToday ?? 0);
            const remaining = Number(usageData.remaining ?? (dailyLimit - usedToday));
            if (dailyLimit > 0 && (usedToday >= dailyLimit || remaining <= 0)) {
              return {
                error: `Votre quota journalier de génération d'images est épuisé (${usedToday}/${dailyLimit} images). Réinitialisation à minuit UTC.`,
                limit: dailyLimit,
                used: usedToday,
              };
            }
          }
        } catch (quotaErr) {
          console.warn("Avertissement vérification quota tool image:", quotaErr);
        }
        const apiUrl = `${MAI_API_URL}/v1/images/generations`;
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
        const rawUrl =
          data?.data?.[0]?.url ||
          data?.data?.[0]?.b64_json ||
          data?.image_url;
        if (!rawUrl) {
          return { error: "Aucune image retournée" };
        }
        const image_url = formatImageSrc(rawUrl);

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
