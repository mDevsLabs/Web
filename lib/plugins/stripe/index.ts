import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { jsonRecords, readBearer, textField } from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Stripe en lecture seule.
 * Une clé secrète peut débiter un compte : aucun outil d'écriture n'est exposé,
 * et une clé restreinte en lecture reste le choix recommandé.
 */

const descriptor = getIntegrationProvider("stripe")!;
const BASE = "https://api.stripe.com";

function stripeList(deps: PluginToolDeps, path: string, limit: number) {
  return readBearer({
    base: BASE,
    deps,
    descriptor,
    path,
    providerId: "stripe",
    query: { limit },
  });
}

function stripeListCustomers(deps: PluginToolDeps) {
  return tool({
    description: "Liste les clients Stripe récents.",
    execute: async ({ maxResults }) => {
      const result = await stripeList(deps, "/v1/customers", maxResults);
      if (!result.ok) return { error: result.error };
      const customers = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          email: textField(row.email, 120),
          id: textField(row.id, 80),
          name: textField(row.name, 120),
        }));
      return {
        customers,
        source: sourceRef(`${BASE}/v1/customers`, "Clients Stripe"),
        total: customers.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
    }),
  });
}

function stripeListPayments(deps: PluginToolDeps) {
  return tool({
    description: "Liste les paiements Stripe récents et leur état.",
    execute: async ({ maxResults }) => {
      const result = await stripeList(deps, "/v1/payment_intents", maxResults);
      if (!result.ok) return { error: result.error };
      const payments = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          amount: textField(row.amount, 20),
          currency: textField(row.currency, 8),
          id: textField(row.id, 80),
          status: textField(row.status, 40),
        }));
      return {
        payments,
        source: sourceRef(`${BASE}/v1/payment_intents`, "Paiements Stripe"),
        total: payments.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
    }),
  });
}

function stripeListSubscriptions(deps: PluginToolDeps) {
  return tool({
    description: "Liste les abonnements Stripe récents.",
    execute: async ({ maxResults }) => {
      const result = await stripeList(deps, "/v1/subscriptions", maxResults);
      if (!result.ok) return { error: result.error };
      const subscriptions = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          currency: textField(row.currency, 8),
          customer: textField(row.customer, 80),
          id: textField(row.id, 80),
          status: textField(row.status, 40),
        }));
      return {
        source: sourceRef(`${BASE}/v1/subscriptions`, "Abonnements Stripe"),
        subscriptions,
        total: subscriptions.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
    }),
  });
}

export const stripePlugin: PluginDefinition = {
  createTools: (deps) => ({
    stripeListCustomers: stripeListCustomers(deps),
    stripeListPayments: stripeListPayments(deps),
    stripeListSubscriptions: stripeListSubscriptions(deps),
  }),
  manifest: manifest as PluginManifest,
};
