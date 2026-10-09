"use client";

import type { Page } from "@/lib/wakies/pages";
export type PageContext = Pick<Page, "id" | "spaceId" | "title">;
export function contextualMessage(
  text: string,
  context: PageContext | null | undefined
) {
  if (context === undefined)
    throw new Error(
      "Le contexte de la conversation n’est pas chargé. Réessayez avant d’envoyer."
    );
  return context
    ? `From [${context.title.replace(/[[\]\\\r\n]/g, "")}](/#/spaces/${context.spaceId}/pages/${context.id}):\n\n${text}`
    : text;
}
