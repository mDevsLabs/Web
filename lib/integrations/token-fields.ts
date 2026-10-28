/**
 * Champs collés avec un jeton personnel.
 *
 * La plupart des connecteurs n'ont besoin que du secret. Cinq API exigent un
 * second renseignement qui n'est pas le secret (SID, site, zone, URL REST,
 * identifiant) : il est validé ici, une seule fois, avant le chiffrement et
 * de nouveau à chaque appel. Le modèle ne le choisit jamais.
 */

export const MAKE_ZONES = ["eu1", "eu2", "us1", "us2"] as const;

export type TokenFieldKind =
  | "docker-username"
  | "email"
  | "jira-site"
  | "make-zone"
  | "twilio-sid"
  | "upstash-origin";

export type TokenFieldSpec = {
  id: string;
  kind: TokenFieldKind;
  label: string;
  placeholder: string;
  secret: boolean;
};

export function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) {
      return true;
    }
  }
  return false;
}

const LABEL = /^(?:[a-z0-9]|[a-z0-9][a-z0-9-]{0,61}[a-z0-9])$/;

export function isUpstashOrigin(value: string): boolean {
  const match =
    /^https:\/\/([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.upstash\.io$/.exec(
      value
    );
  return Boolean(match && LABEL.test(match[1] ?? ""));
}

export function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

export function normalizeTokenField(
  kind: TokenFieldKind,
  raw: string
): string | null {
  const value = raw.trim();
  if (!value || value.length > 300 || hasControlCharacter(value)) {
    return null;
  }
  switch (kind) {
    case "email":
      return normalizeEmail(value);
    case "twilio-sid": {
      const sid = value.toUpperCase();
      return /^AC[0-9A-F]{32}$/.test(sid) ? sid : null;
    }
    case "jira-site": {
      const site = value
        .toLowerCase()
        .replace(/^https:\/\//, "")
        .replace(/\/$/, "");
      return LABEL.test(site.slice(0, -".atlassian.net".length)) &&
        site.endsWith(".atlassian.net")
        ? site
        : null;
    }
    case "docker-username": {
      const name = value.toLowerCase();
      return /^[a-z0-9][a-z0-9._-]{1,38}$/.test(name) ? name : null;
    }
    case "make-zone": {
      const zone = value.toLowerCase();
      return (MAKE_ZONES as readonly string[]).includes(zone) ? zone : null;
    }
    case "upstash-origin": {
      const origin = value.toLowerCase().replace(/\/$/, "");
      return isUpstashOrigin(origin) ? origin : null;
    }
    default:
      return null;
  }
}

function messageFor(kind: TokenFieldKind): string {
  switch (kind) {
    case "email":
      return "Adresse e-mail invalide.";
    case "twilio-sid":
      return "Account SID Twilio invalide : il commence par AC et compte 34 caractères.";
    case "jira-site":
      return "Site Jira invalide : indiquez le nom d'hôte, par exemple exemple.atlassian.net.";
    case "docker-username":
      return "Identifiant Docker Hub invalide.";
    case "make-zone":
      return "Zone Make invalide : eu1, eu2, us1 ou us2.";
    case "upstash-origin":
      return "URL REST Upstash invalide : https://….upstash.io, sans chemin.";
    default:
      return "Champ de connexion invalide.";
  }
}

export function validateTokenFields(
  specs: readonly TokenFieldSpec[],
  input: unknown
): { fields: Record<string, string>; ok: true } | { error: string; ok: false } {
  if (input === null || input === undefined) {
    if (specs.length === 0) {
      return { fields: {}, ok: true };
    }
    return { error: `Champ manquant : ${specs[0]?.label ?? ""}.`, ok: false };
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    return { error: "Champs de connexion illisibles.", ok: false };
  }
  const record = input as Record<string, unknown>;
  const known = new Set(specs.map((spec) => spec.id));
  for (const key of Object.keys(record)) {
    if (!known.has(key)) {
      return { error: "Champ de connexion inattendu.", ok: false };
    }
  }
  const fields: Record<string, string> = {};
  for (const spec of specs) {
    const raw = record[spec.id];
    if (typeof raw !== "string" || !raw.trim()) {
      return { error: `Champ manquant : ${spec.label}.`, ok: false };
    }
    const normalized = normalizeTokenField(spec.kind, raw);
    if (!normalized) {
      return { error: messageFor(spec.kind), ok: false };
    }
    fields[spec.id] = normalized;
  }
  return { fields, ok: true };
}

export function readStoredField(
  fields: Record<string, string>,
  id: string,
  kind: TokenFieldKind
): string | null {
  const value = fields[id];
  if (!value) {
    return null;
  }
  return normalizeTokenField(kind, value);
}

/**
 * Remplace `{token}`, `{seg:nom}` et `{origin:nom}` dans une URL d'identité.
 * Un modèle n'atteint jamais cette fonction : les valeurs viennent du coffre.
 */
export function fillCredentialUrl(
  template: string,
  cred: { fields: Record<string, string>; token: string }
): string | null {
  if (!template.includes("{")) {
    return template;
  }
  let missing = false;
  const filled = template.replace(
    /\{(token|seg:[a-zA-Z0-9]+|origin:[a-zA-Z0-9]+)\}/g,
    (match) => {
      if (match === "{token}") {
        if (!cred.token) {
          missing = true;
          return "";
        }
        return encodeURIComponent(cred.token);
      }
      const segment = /^\{seg:([a-zA-Z0-9]+)\}$/.exec(match);
      if (segment) {
        const value = cred.fields[segment[1] ?? ""];
        if (!value) {
          missing = true;
          return "";
        }
        return encodeURIComponent(value);
      }
      const origin = /^\{origin:([a-zA-Z0-9]+)\}$/.exec(match);
      const value = cred.fields[origin?.[1] ?? ""] ?? "";
      if (!isUpstashOrigin(value)) {
        missing = true;
        return "";
      }
      return value;
    }
  );
  if (missing || /[{}]/.test(filled)) {
    return null;
  }
  return filled;
}
