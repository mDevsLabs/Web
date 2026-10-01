import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { generateImageViaMai } from "@/lib/ai/generators/image";
import { getMaiSessionToken } from "@/lib/auth/session";
import type { ChatMessage } from "@/lib/types";

type ImageGenerateProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
  session: Session;
};

export const imageGenerate = ({ dataStream, session }: ImageGenerateProps) =>
  tool({
    description:
      "Generate an image via mAI Studio. Use when user asks to create, generate, draw, illustrate an image. Returns image_url. You MUST then display the image.",
    execute: async ({ prompt, negative_prompt, width, height }) => {
      const userId = session.user?.id || session.user?.email || "";
      const sessionToken =
        (session as any)?.token || (session as any)?.user?.token || null;
      // Repli historique : sans token de session, le token mAI serveur.
      const token = sessionToken ?? (await getMaiSessionToken());

      // Le cœur partagé (lib/ai/generators/image.ts) porte la logique métier :
      // préférences, quota journalier, appel API mAI. L'outil ne brancherait
      // ici que la prévisualisation temps réel propre au Chat.
      return generateImageViaMai({
        onImage: (imageUrl) => {
          dataStream.write({
            data: imageUrl,
            transient: true,
            type: "data-imageDelta",
          });
        },
        request: { height, negativePrompt: negative_prompt, prompt, width },
        resolveToken: async () => token,
        userId,
      });
    },
    inputSchema: z.object({
      height: z
        .number()
        .int()
        .min(512)
        .max(1536)
        .optional()
        .describe("Hauteur 512-1536"),
      negative_prompt: z.string().optional().describe("Éléments à exclure"),
      prompt: z.string().describe("Description détaillée de l'image à générer"),
      width: z
        .number()
        .int()
        .min(512)
        .max(1536)
        .optional()
        .describe("Largeur 512-1536"),
    }),
  });
