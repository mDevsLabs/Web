import { tool } from "ai";
import { z } from "zod";
import { buildIcs, googleCalendarUrl, outlookCalendarUrl } from "@/lib/ai/ics";

// Planificateur d'événements : détecte une date/échéance dans la discussion
// et produit un fichier .ics téléchargeable + liens Google/Outlook pré-remplis.
export const calendarReminder = tool({
  description:
    "Crée un événement d'agenda (réunion, échéance, rendez-vous) détecté dans la conversation et le rend téléchargeable : fichier .ics, lien « Ajouter à Google Calendar » et lien Outlook pré-remplis. À activer dès que l'utilisateur mentionne une date, une réunion, un rendez-vous ou une échéance à ne pas oublier.",
  execute: async ({ attendees, description, end, location, start, title }) => {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      return { error: `Date de début invalide : "${start}".` };
    }
    let endDate: Date | null = null;
    if (end) {
      endDate = new Date(end);
      if (Number.isNaN(endDate.getTime())) {
        return { error: `Date de fin invalide : "${end}".` };
      }
      if (endDate <= startDate) {
        endDate = null;
      }
    }

    const event = {
      attendees: attendees && attendees.length > 0 ? attendees : undefined,
      description,
      end: endDate,
      location,
      start: startDate,
      title,
    };

    const ics = buildIcs(event);

    return {
      attendees: attendees ?? [],
      description: description ?? null,
      endDate: endDate ? endDate.toISOString() : null,
      filename: `evenement-${startDate.toISOString().slice(0, 10)}.ics`,
      googleUrl: googleCalendarUrl(event),
      ics,
      location: location ?? null,
      outlookUrl: outlookCalendarUrl(event),
      startDate: startDate.toISOString(),
      title,
    };
  },
  inputSchema: z.object({
    attendees: z
      .array(z.string().email())
      .max(20)
      .optional()
      .describe("E-mails des participants à inviter."),
    description: z
      .string()
      .max(2000)
      .optional()
      .describe("Description / ordre du jour de l'événement."),
    end: z
      .string()
      .optional()
      .describe(
        "Date de fin ISO 8601 (optionnelle ; défaut : 1 h après le début)."
      ),
    location: z
      .string()
      .max(500)
      .optional()
      .describe("Lieu ou lien de visioconférence."),
    start: z
      .string()
      .describe(
        "Date et heure de début en ISO 8601. Si l'utilisateur donne une date sans heure, utiliser 09:00 heure locale avec le fuseau correspondant."
      ),
    title: z.string().min(1).max(200).describe("Titre de l'événement."),
  }),
});
