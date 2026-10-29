import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { asRecord, callProvider, loadCredential } from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * La clé ExchangeRate-API se place dans le chemin, pas dans un en-tête.
 * Elle vient du coffre. La référence montrée au modèle ne la contient pas.
 */

const descriptor = getIntegrationProvider("exchange-rate")!;
const BASE = "https://v6.exchangerate-api.com";
const MAJORS = ["EUR", "USD", "GBP", "CHF", "JPY", "CAD"] as const;

function currency(value: string): string | null {
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

async function rates(deps: PluginToolDeps, path: string) {
  const cred = await loadCredential(deps, "exchange-rate");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    auth: { kind: "none" },
    base: BASE,
    descriptor,
    path: `/v6/${encodeURIComponent(cred.data.token)}${path}`,
    signal: deps.signal,
    token: cred.data.token,
  });
}

function exchangeLatestRates(deps: PluginToolDeps) {
  return tool({
    description: "Derniers taux de change pour une devise de base.",
    execute: async ({ base, codes }) => {
      const code = currency(base);
      if (!code) {
        return { error: "Code de devise invalide." };
      }
      const wanted = (codes?.length ? codes : [...MAJORS])
        .map(currency)
        .filter((item): item is string => Boolean(item))
        .slice(0, 12);
      const result = await rates(deps, `/latest/${code}`);
      if (!result.ok) {
        return { error: result.error };
      }
      const record = asRecord(result.data);
      const table = asRecord(record?.conversion_rates) ?? {};
      const ratesOut: Record<string, number> = {};
      for (const item of wanted) {
        if (typeof table[item] === "number") {
          ratesOut[item] = table[item];
        }
      }
      return {
        base: code,
        rates: ratesOut,
        source: sourceRef(`${BASE}/v6/latest/${code}`, "Taux ExchangeRate-API"),
      };
    },
    inputSchema: z.object({
      base: z.string().trim().min(3).max(3).default("EUR"),
      codes: z.array(z.string().trim().length(3)).max(12).optional(),
    }),
  });
}

function exchangeConvert(deps: PluginToolDeps) {
  return tool({
    description: "Convertit un montant d'une devise vers une autre.",
    execute: async ({ amount, from, to }) => {
      const source = currency(from);
      const target = currency(to);
      if (!source || !target) {
        return { error: "Code de devise invalide." };
      }
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1_000_000_000_000
      ) {
        return { error: "Montant hors limites." };
      }
      const result = await rates(deps, `/pair/${source}/${target}/${amount}`);
      if (!result.ok) {
        return { error: result.error };
      }
      const record = asRecord(result.data);
      return {
        amount,
        from: source,
        rate:
          typeof record?.conversion_rate === "number"
            ? record.conversion_rate
            : null,
        result:
          typeof record?.conversion_result === "number"
            ? record.conversion_result
            : null,
        source: sourceRef(
          `${BASE}/v6/pair/${source}/${target}`,
          "Conversion ExchangeRate-API"
        ),
        to: target,
      };
    },
    inputSchema: z.object({
      amount: z.number().positive().max(1_000_000_000_000).default(1),
      from: z.string().trim().length(3),
      to: z.string().trim().length(3),
    }),
  });
}

export const exchangeRatePlugin: PluginDefinition = {
  createTools: (deps) => ({
    exchangeConvert: exchangeConvert(deps),
    exchangeLatestRates: exchangeLatestRates(deps),
  }),
  manifest: manifest as PluginManifest,
};
