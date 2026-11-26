#!/usr/bin/env node

/**
 * ============================================================================
 * scripts/cron/run-tick.mjs — Exécuteur autonome des ticks CRON Next.js
 * ============================================================================
 *
 * Exécuteur haute performance sans dépendances npm externes (Node.js natif).
 * Peut être appelé par GitHub Actions ou en local sans exécuter `pnpm install`.
 *
 * Usage :
 *   node scripts/cron/run-tick.mjs all            # Tous les ticks en parallèle
 *   node scripts/cron/run-tick.mjs agent          # Tick Agent uniquement
 *   node scripts/cron/run-tick.mjs planning       # Tick Planning uniquement
 *   node scripts/cron/run-tick.mjs wakies         # Tick Wakies uniquement
 *   node scripts/cron/run-tick.mjs vibe           # Tick Vibe uniquement
 *   node scripts/cron/run-tick.mjs notifications  # Tick Notifications uniquement
 *   node scripts/cron/run-tick.mjs quizzly        # Tick Quizzly uniquement
 *
 * Variables d'environnement requises :
 *   APP_URL     : URL de base de l'application Next.js (ex: https://mai-web.vercel.app)
 *   CRON_SECRET : Secret partagé pour authentifier l'appel CRON
 */

import process from "node:process";

const TICKS = {
  agent: { budgetMs: 285_000, method: "POST", path: "/api/cron/agent" },
  notifications: {
    budgetMs: 120_000,
    method: "POST",
    path: "/api/cron/notifications",
  },
  planning: { budgetMs: 290_000, method: "POST", path: "/api/cron/planning" },
  quizzly: { budgetMs: 60_000, method: "POST", path: "/api/cron/quizzly" },
  vibe: { budgetMs: 60_000, method: "GET", path: "/api/cron/vibe" },
  wakies: { budgetMs: 290_000, method: "POST", path: "/api/cron/wakies" },
};

function getConfig() {
  const base = process.env.APP_URL?.trim().replace(/\/+$/, "");
  const secret = process.env.CRON_SECRET?.trim().replace(/^["']+|["']+$/g, "");

  if (!base || !secret) {
    const missing = [];
    if (!base) missing.push("APP_URL");
    if (!secret) missing.push("CRON_SECRET");
    console.error(
      `::error::Variables d'environnement manquantes : ${missing.join(", ")}`
    );
    process.exit(1);
  }

  return { base, secret };
}

async function verifyTarget(base) {
  const url = `${base}/api/app-version`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) {
      console.error(
        `::error::La cible ${base} ne répond pas sur /api/app-version (404). Vérifiez APP_URL.`
      );
      process.exit(1);
    }
  } catch (err) {
    console.warn(
      `[cron-runner] Précontrôle non concluant sur ${url} : ${err.message}. Poursuite des ticks.`
    );
  }
}

async function executeTick(name, tick, config) {
  const startedAt = Date.now();
  const url = `${config.base}${tick.path}`;
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${config.secret}`,
    "x-cron-secret": config.secret,
  };

  if (tick.method === "POST") {
    headers["content-type"] = "application/json";
  }

  console.log(`[cron] Début tick "${name}" : ${tick.method} ${tick.path}`);

  try {
    const response = await fetch(url, {
      headers,
      method: tick.method,
      signal: AbortSignal.timeout(tick.budgetMs),
    });

    const durationMs = Date.now() - startedAt;
    const body = (await response.text().catch(() => "")).slice(0, 300);

    if (response.ok) {
      console.log(
        `[cron] ✓ "${name}" -> HTTP ${response.status} (${durationMs} ms) ${body}`
      );
      return { durationMs, name, ok: true, status: response.status };
    }

    console.error(
      `[cron] ✗ "${name}" -> HTTP ${response.status} (${durationMs} ms) ${body}`
    );
    return {
      durationMs,
      error: `HTTP ${response.status}`,
      name,
      ok: false,
      status: response.status,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    console.error(
      `[cron] ✗ "${name}" -> Erreur (${durationMs} ms) : ${err.message}`
    );
    return { durationMs, error: err.message, name, ok: false };
  }
}

async function main() {
  const target = process.argv[2]?.toLowerCase() || "all";
  const config = getConfig();

  await verifyTarget(config.base);

  if (target === "all") {
    console.log("[cron-runner] Lancement des 6 ticks en parallèle...");
    const promises = Object.entries(TICKS).map(([name, tick]) =>
      executeTick(name, tick, config)
    );
    const results = await Promise.all(promises);
    const failed = results.filter((r) => !r.ok);

    console.log(
      `\n[cron-runner] Bilan : ${results.length - failed.length}/${results.length} ticks réussis.`
    );
    if (failed.length > 0) {
      console.error(
        `::error::${failed.length} tick(s) ont échoué : ${failed.map((f) => f.name).join(", ")}`
      );
      process.exit(1);
    }
  } else if (TICKS[target]) {
    const result = await executeTick(target, TICKS[target], config);
    if (!result.ok) {
      console.error(`::error::Le tick "${target}" a échoué.`);
      process.exit(1);
    }
  } else {
    console.error(
      `::error::Cible inconnue "${target}". Cibles valides : all, ${Object.keys(TICKS).join(", ")}`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("::error::Erreur fatale du cron-runner :", err);
  process.exit(1);
});
