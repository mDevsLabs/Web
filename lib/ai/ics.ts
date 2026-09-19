// Génération ICS (RFC 5545) sans dépendance : échappement, pliage de lignes,
// UID/DTSTAMP, événements simple ou avec heure de fin, lieu, description, participants.

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Pliage à 75 octets (RFC 5545 §3.1) — continuation par espace.
function foldLine(line: string): string {
  if (line.length <= 73) {
    return line;
  }
  const parts: string[] = [];
  let rest = line;
  let first = true;
  while (rest.length > (first ? 73 : 74)) {
    const take = first ? 73 : 74;
    parts.push((first ? "" : " ") + rest.slice(0, take));
    rest = rest.slice(take);
    first = false;
  }
  parts.push((first ? "" : " ") + rest);
  return parts.join("\r\n");
}

function toIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function toIcsDateValueOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export type IcsEvent = {
  attendees?: string[];
  description?: string;
  end?: Date | null;
  location?: string;
  start: Date;
  title: string;
  uid?: string;
};

export function buildIcs(event: IcsEvent): string {
  const uid =
    event.uid ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@mai`;
  const now = new Date();
  const allDay =
    event.start.getHours() === 0 &&
    event.start.getMinutes() === 0 &&
    !event.end;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mAI//Calendar Reminder//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    allDay
      ? `DTSTART;VALUE=DATE:${toIcsDateValueOnly(event.start)}`
      : `DTSTART:${toIcsDate(event.start)}`,
  ];

  if (event.end) {
    lines.push(`DTEND:${toIcsDate(event.end)}`);
  } else if (allDay) {
    const end = new Date(event.start.getTime() + 24 * 60 * 60 * 1000);
    lines.push(`DTEND;VALUE=DATE:${toIcsDateValueOnly(end)}`);
  } else {
    // Durée par défaut : 1 h
    const end = new Date(event.start.getTime() + 60 * 60 * 1000);
    lines.push(`DTEND:${toIcsDate(end)}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }
  for (const attendee of event.attendees ?? []) {
    lines.push(`ATTENDEE;CN=${escapeIcsText(attendee)}:mailto:${attendee}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

function formatGoogleDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Lien "Ajouter à Google Calendar" pré-rempli. */
export function googleCalendarUrl(event: IcsEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    details: event.description ?? "",
    text: event.title,
  });
  if (event.location) {
    params.set("location", event.location);
  }
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);
  params.set(
    "dates",
    `${formatGoogleDate(event.start)}/${formatGoogleDate(end)}`
  );
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Lien "Ajouter à Outlook" pré-rempli. */
export function outlookCalendarUrl(event: IcsEvent): string {
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    body: event.description ?? "",
    enddt: end.toISOString(),
    path: "/calendar/action/compose",
    startdt: event.start.toISOString(),
    subject: event.title,
  });
  if (event.location) {
    params.set("location", event.location);
  }
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
