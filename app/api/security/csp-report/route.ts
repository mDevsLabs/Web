import { NextResponse } from "next/server";

// Rapports de violation CSP.
//
// `CSP_REPORT_ONLY=1` bascule l'en-tête en mode observation, ce qui n'a de sens
// que si les violations sont reçues quelque part. Il n'y avait ni `report-uri`
// ni `report-to` dans la politique : le mode observation ne pouvait donc rien
// observer, et le levier était inerte.
//
// Ce qui nous intéresse est un résumé, pas une explosion de volume : les
// violations d'un même site sont très répétitives. On ne retient que les
// derniers rapports par couple (document, ressource) dédupliqué, et on journalise
// la première apparition de chaque couple (directive, ressource).
const MAX_REPORTS = 50;
const DEDUPE_WINDOW_MS = 15 * 60_000;

type Report = {
  blockedURI: string;
  count: number;
  document: string;
  effectiveDirective: string;
  firstSeenAt: number;
  lastSeenAt: number;
};

const state = {
  recent: [] as Report[],
  seen: new Map<string, number>(),
};

function prune(now: number) {
  // Purge des entrées de déduplication expirées, avec plafond sur la carte
  // pour qu'un rapport par document ne la fasse pas croître indéfiniment.
  for (const [key, at] of state.seen) {
    if (now - at > DEDUPE_WINDOW_MS) {
      state.seen.delete(key);
    }
  }
  if (state.seen.size > 5000) {
    state.seen.clear();
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entries = Array.isArray(payload)
    ? payload
    : [(payload as { "csp-report"?: unknown })?.["csp-report"]];

  const now = Date.now();
  prune(now);
  let logged = 0;

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const report = entry as Record<string, unknown>;
    const directive = String(report.effectiveDirective ?? "unknown");
    const blocked = String(report.blockedURI ?? "unknown");
    const document = String(report["document-uri"] ?? "unknown");

    const key = `${directive}|${blocked}`;
    const known = state.seen.get(key);
    state.seen.set(key, now);

    const existing = state.recent.find(
      (item) => item.document === document && item.blockedURI === blocked
    );
    if (existing) {
      existing.count += 1;
      existing.lastSeenAt = now;
    } else {
      if (state.recent.length >= MAX_REPORTS) {
        state.recent.shift();
      }
      state.recent.push({
        blockedURI: blocked,
        count: 1,
        document,
        effectiveDirective: directive,
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    // Première apparition seulement : une violation qui se répète est un
    // problème de configuration, pas une urgence par occurrence.
    if (known === undefined && logged < 10) {
      console.warn(
        JSON.stringify({
          blockedURI: blocked.slice(0, 200),
          document: document.slice(0, 200),
          effectiveDirective: directive,
          event: "csp_violation",
        })
      );
      logged += 1;
    }
  }

  return NextResponse.json({ ok: true });
}
