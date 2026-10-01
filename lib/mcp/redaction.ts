// Redaction helpers for MCP data crossing a trust boundary (API, logs, model
// errors, exports).  This module deliberately has no server-only or database
// dependency so it can be used by both route handlers and pure unit tests.

export const MCP_REDACTED = "***";

/** A key is sensitive when its *name* identifies a credential. */
const SECRET_KEY_PATTERN =
  /(?:^|[-_])(?:access[-_]?token|api[-_]?key|apikey|auth(?:orization)?|bearer|client[-_]?secret|cookie|credential|password|passwd|private[-_]?key|refresh[-_]?token|secret|session|signature|sig|token)(?:$|[-_])/i;

/** Values commonly emitted by providers in errors, URLs, or tool results. */
const SECRET_VALUE_PATTERNS: RegExp[] = [
  /\b(?:gh[pousr]_[A-Za-z0-9._-]+|github_pat_[A-Za-z0-9._-]+|glpat-[A-Za-z0-9._-]+|xox[baprs]-[A-Za-z0-9._-]+|sk_(?:live|test)_[A-Za-z0-9._-]+|pat[A-Za-z0-9._-]{6,}|sbp_[A-Za-z0-9._-]+)/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{8,}\b/g,
];

const MAX_REDACTION_DEPTH = 8;
const MAX_REDACTION_ITEMS = 100;
const MAX_REDACTION_STRING = 4000;

export function isMcpSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key.trim());
}

export function looksLikeMcpSecret(value: string): boolean {
  if (!value) return false;
  if (
    SECRET_VALUE_PATTERNS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    })
  ) {
    return true;
  }
  return /(?:secret|token|password|passwd|api[-_]?key|private[-_]?key|credential)/i.test(
    value
  );
}

/**
 * Redact a free-form string.  It intentionally errs on the side of hiding a
 * value: a log or an error is not a useful place to preserve an opaque string
 * that looks like a credential.
 */
export function redactMcpText(
  value: string,
  maxLength = MAX_REDACTION_STRING
): string {
  let output = value;
  output = output.replace(
    /(authorization\s*:\s*bearer\s+)[^\s,;]+/gi,
    `$1${MCP_REDACTED}`
  );
  output = output.replace(
    /((?:access[-_]?token|api[-_]?key|apikey|auth(?:orization)?|bearer|client[-_]?secret|cookie|credential|password|passwd|private[-_]?key|refresh[-_]?token|secret|session|signature|sig|token)\s*[:=]\s*)([^\s,;]+)/gi,
    `$1${MCP_REDACTED}`
  );
  for (const pattern of SECRET_VALUE_PATTERNS) {
    pattern.lastIndex = 0;
    output = output.replace(pattern, MCP_REDACTED);
  }
  // Redact URL query/fragment values even when the key is unusual (for
  // example `?credential=opaque-value`).  The URL parser in dto.ts handles the
  // normal case; this catches URLs embedded in upstream error messages.
  output = output.replace(
    /([?&#][^=\s&#]+=)([^&#\s]+)/g,
    (match, prefix: string, rawValue: string) =>
      looksLikeMcpSecret(rawValue) ||
      isMcpSecretKey(prefix.slice(1).split("=")[0] ?? "")
        ? `${prefix}${MCP_REDACTED}`
        : match
  );
  if (output.length > maxLength) {
    return `${output.slice(0, Math.max(0, maxLength - 1))}…`;
  }
  return output;
}

/**
 * Recursively redact JSON-like values.  It also caps cardinality and depth so
 * a malicious MCP result cannot turn a log/DTO into an unbounded allocation.
 * `keyHint` is used for fields such as `token` whose value may not carry a
 * provider-specific prefix.
 */
export function redactMcpValue(
  value: unknown,
  options: { depth?: number; keyHint?: string; seen?: WeakSet<object> } = {}
): unknown {
  const depth = options.depth ?? 0;
  const keyHint = options.keyHint ?? "";
  if (depth > MAX_REDACTION_DEPTH) return "[truncated]";
  if (typeof value === "string") {
    return isMcpSecretKey(keyHint)
      ? MCP_REDACTED
      : redactMcpText(value, MAX_REDACTION_STRING);
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return typeof value === "bigint" ? value.toString() : value;
  }
  if (typeof value === "function" || typeof value === "symbol") {
    return;
  }
  if (!value || typeof value !== "object") return;

  const seen = options.seen ?? new WeakSet<object>();
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value
        .slice(0, MAX_REDACTION_ITEMS)
        .map((item) => redactMcpValue(item, { depth: depth + 1, seen }));
    }
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>
    ).slice(0, MAX_REDACTION_ITEMS)) {
      if (key === "__proto__" || key === "prototype" || key === "constructor") {
        continue;
      }
      const safeKey = redactMcpText(key, 128);
      out[safeKey] = redactMcpValue(item, {
        depth: depth + 1,
        keyHint: key,
        seen,
      });
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

export function redactMcpError(
  error: unknown,
  fallback = "Erreur MCP"
): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return redactMcpText(message || fallback, 1000);
}
