import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import { encodeSegment } from "../../../shared/authorized-api";
import {
  asRecord,
  jsonRecords,
  readBearer,
  textField,
} from "../../../shared/bearer-read";
import { sourceRef } from "../../../shared/public-api";
import manifest from "./index.json";

const descriptor = getIntegrationProvider("stripe")!;
const BASE = "https://api.stripe.com";

function stripeCall(
  deps: PluginToolDeps,
  path: string,
  query?: Record<string, string | number | undefined>
) {
  return readBearer({
    base: BASE,
    deps,
    descriptor,
    path,
    providerId: "stripe",
    query,
  });
}

function stripeListCustomers(deps: PluginToolDeps) {
  return tool({
    description: "Liste les clients Stripe récents.",
    execute: async ({ maxResults }) => {
      const result = await stripeCall(deps, "/v1/customers", {
        limit: maxResults,
      });
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

function stripeGetCustomer(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit le détail d'un client Stripe par son identifiant (cus_…).",
    execute: async ({ customerId }) => {
      const path = `/v1/customers/${encodeSegment(customerId)}`;
      const result = await stripeCall(deps, path);
      if (!result.ok) return { error: result.error };
      const row = asRecord(result.data);
      return {
        customer: row
          ? {
              balance: typeof row.balance === "number" ? row.balance : null,
              currency: textField(row.currency, 8),
              delinquent: row.delinquent === true,
              email: textField(row.email, 120),
              id: textField(row.id, 80),
              name: textField(row.name, 120),
            }
          : null,
        source: sourceRef(`${BASE}${path}`, "Client Stripe"),
      };
    },
    inputSchema: z.object({
      customerId: z
        .string()
        .trim()
        .regex(
          /^cus_[A-Za-z0-9]{6,40}$/,
          "Identifiant client Stripe invalide (cus_…)."
        ),
    }),
  });
}

function stripeListPayments(deps: PluginToolDeps) {
  return tool({
    description: "Liste les paiements Stripe récents et leur état.",
    execute: async ({ maxResults }) => {
      const result = await stripeCall(deps, "/v1/payment_intents", {
        limit: maxResults,
      });
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
      const result = await stripeCall(deps, "/v1/subscriptions", {
        limit: maxResults,
      });
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

function stripeListInvoices(deps: PluginToolDeps) {
  return tool({
    description: "Liste les factures Stripe récentes et leur statut.",
    execute: async ({ maxResults, status }) => {
      const result = await stripeCall(deps, "/v1/invoices", {
        limit: maxResults,
        ...(status ? { status } : {}),
      });
      if (!result.ok) return { error: result.error };
      const invoices = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          amountDue: textField(row.amount_due, 20),
          amountPaid: textField(row.amount_paid, 20),
          currency: textField(row.currency, 8),
          customer: textField(row.customer, 80),
          id: textField(row.id, 80),
          number: textField(row.number, 40),
          status: textField(row.status, 30),
        }));
      return {
        invoices,
        source: sourceRef(`${BASE}/v1/invoices`, "Factures Stripe"),
        total: invoices.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
      status: z
        .enum(["draft", "open", "paid", "uncollectible", "void"])
        .optional(),
    }),
  });
}

export const stripePlugin: PluginDefinition = {
  createTools: (deps) => ({
    stripeGetCustomer: stripeGetCustomer(deps),
    stripeListCustomers: stripeListCustomers(deps),
    stripeListInvoices: stripeListInvoices(deps),
    stripeListPayments: stripeListPayments(deps),
    stripeListSubscriptions: stripeListSubscriptions(deps),
  }),
  manifest: manifest as PluginManifest,
};
