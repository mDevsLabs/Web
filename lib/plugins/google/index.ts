import { tool } from "ai";
import { z } from "zod";
import {
  GOOGLE_SCOPES,
  getIntegrationProvider,
} from "@/lib/integrations/providers";
import {
  bearerFor,
  callAuthorized,
  encodeSegment,
  requireWriteScope,
} from "../shared/authorized-api";
import { sourceRef, truncateText } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Connecteur Google — Drive, Agenda et Gmail sous UNE seule connexion.
 *
 * Un seul client OAuth, un seul écran de consentement, un seul bouton
 * « Déconnecter » : les trois portées sont accordées ensemble, donc les trois
 * familles d'outils partagent le même jeton et le même compte. Les écritures
 * (créer un événement, envoyer un e-mail) sont déclarées `effect: "write"` dans
 * le manifeste : elles ne sont instanciées que dans l'Agent, où le moteur de
 * permissions les soumet à approbation.
 *
 * Les adresses d'API sont des littéraux de ce fichier ; le modèle ne fournit que
 * des morceaux de chemin, encodés, et des filtres bornés.
 */

const descriptor = getIntegrationProvider("google")!;
const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1";

const DRIVE_FIELDS =
  "id,name,mimeType,description,size,createdTime,modifiedTime,parents,webViewLink";
const CALENDAR_FIELDS =
  "id,summary,description,location,start,end,status,attendees,htmlLink,creator";

const idSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9_.@-]+$/, "Identifiant refusé.");

/** Un horodatage RFC 3339 complet : Agenda n'accepte pas une simple date ici. */
const dateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
    "Utilisez AAAA-MM-JJTHH:MM(:SS) avec ou sans décalage."
  );

const countSchema = (max: number, fallback: number) =>
  z.number().int().min(1).max(max).default(fallback);

/**
 * Terme de recherche Drive, nettoyé.
 *
 * Le `q` de Drive est un mini-langage (`or`, `not`, `'x' in name`). Un terme
 * brut du modèle pourrait y ajouter des clauses et élargir la recherche au-delà
 * de ce qui lui a été demandé ; on retire donc guillemets, parenthèses et
 * opérateurs, et le terme devient une simple sous-chaîne.
 */
function driveSearchTerm(value: string): string {
  return value
    .replace(/["'\\()]/g, " ")
    .replace(/\b(or|not|and)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** En-tête prêt pour l'envoi : CR et LF sont la frontière d'une entête MIME. */
function mailHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function decodeMailBody(part: {
  body?: { data?: string; size?: number };
}): string {
  const data = part.body?.data;
  if (!data) {
    return "";
  }
  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function headerOf(
  headers: { name?: string; value?: string }[] | undefined,
  name: string
): string | null {
  const wanted = name.toLowerCase();
  const found = headers?.find(
    (header) => header.name?.toLowerCase() === wanted
  );
  return typeof found?.value === "string" ? found.value.slice(0, 300) : null;
}

// ─── Drive ───────────────────────────────────────────────────────────────────

function searchDriveFiles(deps: PluginToolDeps) {
  return tool({
    description:
      "Cherche dans les fichiers Google Drive du compte connecté, par sous-chaîne de nom. Lecture seule.",
    execute: async ({ maxResults, search }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const term = driveSearchTerm(search);
      if (!term) return { error: "Terme de recherche vide après nettoyage." };
      const result = await callAuthorized<{ files?: unknown[] }>({
        accessToken: token.data,
        base: DRIVE_BASE,
        descriptor,
        path: "/files",
        query: {
          fields: `files(${DRIVE_FIELDS})`,
          pageSize: maxResults,
          q: `name contains '${term}' and trashed = false`,
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const files = (result.data.files ?? [])
        .slice(0, maxResults)
        .map((item) => {
          const file = item as Record<string, unknown>;
          return {
            id: file.id,
            mime: file.mimeType,
            modifiedAt: file.modifiedTime,
            name: truncateText(file.name, 200),
          };
        });
      return {
        files,
        source: sourceRef(`${DRIVE_BASE}/files`, `Google Drive — « ${term} »`),
        total: files.length,
      };
    },
    inputSchema: z.object({
      maxResults: countSchema(20, 8),
      search: z
        .string()
        .min(1)
        .max(80)
        .describe("Sous-chaîne du nom de fichier"),
    }),
  });
}

function listRecentDriveFiles(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les derniers fichiers modifiés ou consultés sur le Google Drive du compte.",
    execute: async ({ maxResults }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<{ files?: unknown[] }>({
        accessToken: token.data,
        base: DRIVE_BASE,
        descriptor,
        path: "/files",
        query: {
          fields: `files(${DRIVE_FIELDS})`,
          orderBy: "modifiedTime desc",
          pageSize: maxResults,
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        files: (result.data.files ?? []).slice(0, maxResults).map((item) => {
          const file = item as Record<string, unknown>;
          return {
            id: file.id,
            mime: file.mimeType,
            modifiedAt: file.modifiedTime,
            name: truncateText(file.name, 200),
          };
        }),
        source: sourceRef(`${DRIVE_BASE}/files`, "Google Drive — récents"),
      };
    },
    inputSchema: z.object({ maxResults: countSchema(25, 10) }),
  });
}

function getDriveFileMetadata(deps: PluginToolDeps) {
  return tool({
    description:
      "Renvoie les métadonnées d'un fichier Google Drive : nom, type, taille, dates, dossier parent.",
    execute: async ({ fileId }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: DRIVE_BASE,
        descriptor,
        path: `/files/${encodeSegment(fileId)}`,
        query: { fields: DRIVE_FIELDS },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        file: {
          description: truncateText(result.data.description, 500),
          id: result.data.id,
          mime: result.data.mimeType,
          modifiedAt: result.data.modifiedTime,
          name: truncateText(result.data.name, 200),
          parents: result.data.parents,
          size: result.data.size,
        },
        source: sourceRef(
          String(result.data.webViewLink ?? `${DRIVE_BASE}/files/${fileId}`),
          "Google Drive"
        ),
      };
    },
    inputSchema: z.object({ fileId: idSchema }),
  });
}

const TEXTUAL_MIMES = /^text\/|^application\/(json|xml|javascript|x-yaml)/;

function readDriveDocument(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit le contenu texte d'un fichier Google Drive : un Document Google est exporté en texte brut, un fichier texte est lu tel quel. Sortie plafonnée.",
    execute: async ({ fileId, maxCharacters }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };

      const meta = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: DRIVE_BASE,
        descriptor,
        path: `/files/${encodeSegment(fileId)}`,
        query: { fields: "id,name,mimeType,size" },
        signal: deps.signal,
      });
      if (!meta.ok) return { error: meta.error };
      const mime = String(meta.data.mimeType ?? "");
      const isGoogleDoc = mime === "application/vnd.google-apps.document";
      if (!isGoogleDoc && !TEXTUAL_MIMES.test(mime)) {
        return {
          error: `Ce fichier (${mime || "type inconnu"}) n'est pas un document texte lisible.`,
        };
      }

      const content = await callAuthorized<string>({
        accessToken: token.data,
        base: DRIVE_BASE,
        descriptor,
        path: isGoogleDoc
          ? `/files/${encodeSegment(fileId)}/export`
          : `/files/${encodeSegment(fileId)}`,
        query: isGoogleDoc ? { mimeType: "text/plain" } : { alt: "media" },
        signal: deps.signal,
        transform: (payload) => ({
          data: typeof payload === "string" ? payload : JSON.stringify(payload),
          ok: true,
        }),
      });
      if (!content.ok) return { error: content.error };

      const text = content.data ?? "";
      return {
        content: text.slice(0, maxCharacters),
        name: truncateText(meta.data.name, 200),
        source: sourceRef(
          `${DRIVE_BASE}/files/${fileId}`,
          `Google Drive — ${String(meta.data.name ?? fileId)}`
        ),
        truncated: text.length > maxCharacters,
      };
    },
    inputSchema: z.object({
      fileId: idSchema,
      maxCharacters: z.number().int().min(500).max(20_000).default(8000),
    }),
  });
}

// ─── Agenda ──────────────────────────────────────────────────────────────────

function eventWindow(minutes: number): { timeMax: string; timeMin: string } {
  const from = new Date();
  const to = new Date(from.getTime() + minutes * 60_000);
  return { timeMax: to.toISOString(), timeMin: from.toISOString() };
}

async function listEvents(
  deps: PluginToolDeps,
  params: {
    calendarId: string;
    maxResults: number;
    timeMax?: string;
    timeMin?: string;
  }
) {
  const token = await bearerFor(deps, "google");
  if (!token.ok) return token;
  const window =
    params.timeMin && params.timeMax
      ? { timeMax: params.timeMax, timeMin: params.timeMin }
      : eventWindow(14 * 24 * 60);
  return callAuthorized<{ items?: Record<string, unknown>[] }>({
    accessToken: token.data,
    base: CALENDAR_BASE,
    descriptor,
    path: `/calendars/${encodeSegment(params.calendarId)}/events`,
    query: {
      maxResults: params.maxResults,
      orderBy: "startTime",
      singleEvents: "true",
      timeMax: window.timeMax,
      timeMin: window.timeMin,
    },
    signal: deps.signal,
  });
}

function shapeEvent(event: Record<string, unknown>) {
  const start = event.start as { dateTime?: string; date?: string } | undefined;
  const end = event.end as { dateTime?: string; date?: string } | undefined;
  const attendees = Array.isArray(event.attendees)
    ? (event.attendees as { displayName?: string; email?: string }[])
        .slice(0, 12)
        .map((person) => person.email ?? person.displayName ?? null)
        .filter(Boolean)
    : [];
  return {
    attendees,
    description: truncateText(event.description, 600),
    endsAt: end?.dateTime ?? end?.date ?? null,
    id: event.id,
    location: truncateText(event.location, 200),
    startsAt: start?.dateTime ?? start?.date ?? null,
    status: event.status,
    summary: truncateText(event.summary, 200),
    url: event.htmlLink,
  };
}

function listCalendarEvents(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les événements à venir du calendrier Google du compte, dans une fenêtre de dates.",
    execute: async ({ calendarId, maxResults, timeMax, timeMin }) => {
      const result = await listEvents(deps, {
        calendarId,
        maxResults,
        timeMax,
        timeMin,
      });
      if (!result.ok) return { error: result.error };
      const events = (result.data.items ?? [])
        .slice(0, maxResults)
        .map(shapeEvent);
      return {
        events,
        source: sourceRef(
          `${CALENDAR_BASE}/calendars/${calendarId}/events`,
          "Google Agenda"
        ),
        total: events.length,
      };
    },
    inputSchema: z.object({
      calendarId: z.string().min(1).max(140).default("primary"),
      maxResults: countSchema(30, 10),
      timeMax: dateTimeSchema.optional(),
      timeMin: dateTimeSchema.optional(),
    }),
  });
}

function getCalendarEvent(deps: PluginToolDeps) {
  return tool({
    description:
      "Récupère le détail d'un événement Google Agenda par son identifiant.",
    execute: async ({ calendarId, eventId }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: CALENDAR_BASE,
        descriptor,
        path: `/calendars/${encodeSegment(calendarId)}/events/${encodeSegment(eventId)}`,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        event: shapeEvent(result.data),
        source: sourceRef(
          String(result.data.htmlLink ?? `${CALENDAR_BASE}/events/${eventId}`),
          "Google Agenda"
        ),
      };
    },
    inputSchema: z.object({
      calendarId: z.string().min(1).max(140).default("primary"),
      eventId: z.string().min(1).max(255),
    }),
  });
}

function checkCalendarAvailability(deps: PluginToolDeps) {
  return tool({
    description:
      "Calcule les créneaux libres du calendrier principal entre deux dates, à partir des occupations réelles.",
    execute: async ({ horizonMinutes, minimumMinutes, timeMax, timeMin }) => {
      const bounds =
        timeMin && timeMax ? { timeMax, timeMin } : eventWindow(horizonMinutes);
      const from = Date.parse(bounds.timeMin);
      const to = Date.parse(bounds.timeMax);
      if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
        return { error: "Fenêtre de dates invalide." };
      }
      const result = await listEvents(deps, {
        calendarId: "primary",
        maxResults: 100,
        timeMax: bounds.timeMax,
        timeMin: bounds.timeMin,
      });
      if (!result.ok) return { error: result.error };

      const busy = (result.data.items ?? [])
        .map((event) => {
          const start = event.start as
            | { dateTime?: string; date?: string }
            | undefined;
          const end = event.end as
            | { dateTime?: string; date?: string }
            | undefined;
          const begin = Date.parse(String(start?.dateTime ?? start?.date));
          const finish = Date.parse(String(end?.dateTime ?? end?.date));
          return Number.isFinite(begin) && Number.isFinite(finish)
            ? { begin, finish }
            : null;
        })
        .filter((slot): slot is { begin: number; finish: number } =>
          Boolean(slot)
        )
        .sort((a, b) => a.begin - b.begin);

      // Les événements se recouvrent (all-day + rendez-vous) : fusionner avant
      // de chercher les trous, sinon un créneau « libre » est en fait occupé.
      const merged: { begin: number; finish: number }[] = [];
      for (const slot of busy) {
        const last = merged.at(-1);
        if (last && slot.begin <= last.finish) {
          last.finish = Math.max(last.finish, slot.finish);
          continue;
        }
        merged.push({ ...slot });
      }

      const free: {
        durationMinutes: number;
        endsAt: string;
        startsAt: string;
      }[] = [];
      let cursor = from;
      for (const slot of merged) {
        if (slot.begin - cursor >= minimumMinutes * 60_000) {
          free.push({
            durationMinutes: Math.round((slot.begin - cursor) / 60_000),
            endsAt: new Date(slot.begin).toISOString(),
            startsAt: new Date(cursor).toISOString(),
          });
        }
        cursor = Math.max(cursor, slot.finish);
      }
      if (to - cursor >= minimumMinutes * 60_000) {
        free.push({
          durationMinutes: Math.round((to - cursor) / 60_000),
          endsAt: new Date(to).toISOString(),
          startsAt: new Date(cursor).toISOString(),
        });
      }

      return {
        busyPeriods: merged.length,
        free,
        source: sourceRef(
          `${CALENDAR_BASE}/calendars/primary/events`,
          "Disponibilités Google Agenda"
        ),
        window: bounds,
      };
    },
    inputSchema: z.object({
      horizonMinutes: z.number().int().min(60).max(20_160).default(10_080),
      minimumMinutes: z.number().int().min(10).max(480).default(30),
      timeMax: dateTimeSchema.optional(),
      timeMin: dateTimeSchema.optional(),
    }),
  });
}

function createCalendarEvent(deps: PluginToolDeps) {
  return tool({
    description:
      "CRÉE un événement dans le calendrier Google du compte. Action d'écriture : soumise à approbation, uniquement disponible dans l'Agent.",
    execute: async ({
      attendees,
      description,
      endsAt,
      location,
      startsAt,
      summary,
      timeZone,
    }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const scope = await requireWriteScope(
        deps,
        "google",
        GOOGLE_SCOPES.calendarEvents
      );
      if (!scope.ok) return { error: scope.error };
      if (Date.parse(endsAt) <= Date.parse(startsAt)) {
        return { error: "La fin doit être postérieure au début." };
      }

      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: CALENDAR_BASE,
        body: JSON.stringify({
          attendees: attendees?.map((email) => ({ email })),
          description,
          end: { dateTime: endsAt, timeZone },
          location,
          start: { dateTime: startsAt, timeZone },
          summary,
        }),
        descriptor,
        method: "POST",
        path: "/calendars/primary/events",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        created: true,
        event: shapeEvent(result.data),
        source: sourceRef(
          String(result.data.htmlLink ?? `${CALENDAR_BASE}/events`),
          "Google Agenda"
        ),
      };
    },
    inputSchema: z.object({
      attendees: z.array(z.string().email()).max(25).optional(),
      description: z.string().max(4000).optional(),
      endsAt: dateTimeSchema,
      location: z.string().max(300).optional(),
      startsAt: dateTimeSchema,
      summary: z.string().min(1).max(200),
      timeZone: z.string().min(1).max(60).default("Europe/Paris"),
    }),
  });
}

// ─── Gmail ───────────────────────────────────────────────────────────────────

const MAIL_METADATA_FIELDS = "messages(id,threadId,snippet,labelIds)";

async function messageMetadata(deps: PluginToolDeps, id: string) {
  const token = await bearerFor(deps, "google");
  if (!token.ok) return { error: token.error };
  const result = await callAuthorized<Record<string, unknown>>({
    accessToken: token.data,
    base: GMAIL_BASE,
    descriptor,
    path: `/users/me/messages/${encodeSegment(id)}`,
    query: {
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    },
    signal: deps.signal,
  });
  if (!result.ok) return { error: result.error };
  const headers = (
    result.data.payload as
      | { headers?: { name: string; value: string }[] }
      | undefined
  )?.headers;
  return {
    data: {
      date: headerOf(headers, "Date"),
      from: headerOf(headers, "From"),
      id: result.data.id,
      snippet: truncateText(result.data.snippet, 400),
      subject: headerOf(headers, "Subject"),
      threadId: result.data.threadId,
    },
    ok: true as const,
  };
}

function searchGmailMessages(deps: PluginToolDeps) {
  return tool({
    description:
      "Recherche des e-mails dans la messagerie Gmail du compte (opérateurs Gmail : from:, has:attachment, newer_than:). Retourne l'en-tête des résultats.",
    execute: async ({ maxResults, query }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const list = await callAuthorized<{
        messages?: { id: string }[];
      }>({
        accessToken: token.data,
        base: GMAIL_BASE,
        descriptor,
        path: "/users/me/messages",
        query: { maxResults, q: query },
        signal: deps.signal,
      });
      if (!list.ok) return { error: list.error };
      // Une seule page d'abord, puis au plus 6 messages : chaque détail est un
      // appel, et les quotas par utilisateur de Gmail sont serrés.
      const ids = (list.data.messages ?? []).slice(0, Math.min(maxResults, 6));
      const messages: unknown[] = [];
      for (const item of ids) {
        const detail = await messageMetadata(deps, item.id);
        if (detail.ok) messages.push(detail.data);
      }
      return {
        matched: (list.data.messages ?? []).length,
        messages,
        source: sourceRef(`${GMAIL_BASE}/users/me/messages`, "Gmail"),
      };
    },
    inputSchema: z.object({
      maxResults: countSchema(25, 6),
      query: z.string().min(1).max(300),
    }),
  });
}

function readGmailThread(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit une conversation Gmail complète : chaque message avec son auteur, son objet, sa date et son texte, plafonné.",
    execute: async ({ maxCharacters, threadId }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<{
        messages?: {
          payload?: {
            body?: { data?: string };
            headers?: { name: string; value: string }[];
            parts?: {
              body?: { data?: string };
              mimeType?: string;
              parts?: unknown[];
            }[];
          };
        }[];
      }>({
        accessToken: token.data,
        base: GMAIL_BASE,
        descriptor,
        path: `/users/me/threads/${encodeSegment(threadId)}`,
        query: { format: "full" },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };

      const messages = (result.data.messages ?? [])
        .slice(0, 20)
        .map((message) => {
          const headers = message.payload?.headers;
          const plain = message.payload?.parts?.find(
            (part) => part.mimeType === "text/plain"
          );
          const body = plain
            ? decodeMailBody(plain)
            : decodeMailBody({ body: message.payload?.body });
          return {
            body: truncateText(body.trim(), maxCharacters),
            date: headerOf(headers, "Date"),
            from: headerOf(headers, "From"),
            subject: headerOf(headers, "Subject"),
            to: headerOf(headers, "To"),
          };
        });
      return {
        messageCount: messages.length,
        messages,
        source: sourceRef(
          `${GMAIL_BASE}/users/me/threads/${threadId}`,
          "Conversation Gmail"
        ),
      };
    },
    inputSchema: z.object({
      maxCharacters: z.number().int().min(200).max(6000).default(2000),
      threadId: z.string().min(1).max(64),
    }),
  });
}

function listGmailLabels(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les libellés (dossiers et étiquettes) du compte Gmail, avec leur nombre de messages non lus.",
    execute: async () => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<{
        labels?: Record<string, unknown>[];
      }>({
        accessToken: token.data,
        base: GMAIL_BASE,
        descriptor,
        path: "/users/me/labels",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        labels: (result.data.labels ?? []).slice(0, 60).map((label) => ({
          id: label.id,
          name: truncateText(label.name, 120),
          type: label.type,
          unread:
            label.labelListVisibility === "labelHide"
              ? undefined
              : label.messagesUnread,
        })),
        source: sourceRef(`${GMAIL_BASE}/users/me/labels`, "Libellés Gmail"),
      };
    },
    inputSchema: z.object({}),
  });
}

function sendGmailMessage(deps: PluginToolDeps) {
  return tool({
    description:
      "ENVOIE un e-mail depuis la messagerie Gmail du compte. Action d'écriture irréversible : soumise à approbation, uniquement disponible dans l'Agent.",
    execute: async ({ body, cc, subject, to }) => {
      const token = await bearerFor(deps, "google");
      if (!token.ok) return { error: token.error };
      const scope = await requireWriteScope(
        deps,
        "google",
        GOOGLE_SCOPES.mailSend
      );
      if (!scope.ok) return { error: scope.error };

      const lines = [
        `To: ${mailHeader(to)}`,
        ...(cc ? [`Cc: ${cc.map(mailHeader).join(", ")}`] : []),
        `Subject: ${mailHeader(subject)}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
      ];
      const raw = Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");

      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GMAIL_BASE,
        body: JSON.stringify({ raw }),
        descriptor,
        method: "POST",
        path: "/users/me/messages/send",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        messageId: result.data.id,
        sent: true,
        source: sourceRef(
          `${GMAIL_BASE}/users/me/messages/send`,
          "Envoi Gmail"
        ),
        threadId: result.data.threadId,
        to,
      };
    },
    inputSchema: z.object({
      body: z.string().min(1).max(20_000),
      cc: z.array(z.string().email()).max(10).optional(),
      subject: z.string().min(1).max(300),
      to: z.string().email(),
    }),
  });
}

export const googlePlugin: PluginDefinition = {
  createTools: (deps) => ({
    checkCalendarAvailability: checkCalendarAvailability(deps),
    createCalendarEvent: createCalendarEvent(deps),
    getCalendarEvent: getCalendarEvent(deps),
    getDriveFileMetadata: getDriveFileMetadata(deps),
    listCalendarEvents: listCalendarEvents(deps),
    listGmailLabels: listGmailLabels(deps),
    listRecentDriveFiles: listRecentDriveFiles(deps),
    readDriveDocument: readDriveDocument(deps),
    readGmailThread: readGmailThread(deps),
    searchDriveFiles: searchDriveFiles(deps),
    searchGmailMessages: searchGmailMessages(deps),
    sendGmailMessage: sendGmailMessage(deps),
  }),
  manifest: manifest as PluginManifest,
};
