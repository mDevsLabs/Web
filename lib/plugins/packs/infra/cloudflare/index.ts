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

const descriptor = getIntegrationProvider("cloudflare")!;
const BASE = "https://api.cloudflare.com";

function cloudflareListZones(deps: PluginToolDeps) {
  return tool({
    description: "Liste les zones Cloudflare visibles avec le jeton.",
    execute: async ({ maxResults }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: "/client/v4/zones",
        providerId: "cloudflare",
        query: { per_page: maxResults },
      });
      if (!result.ok) return { error: result.error };
      const zones = jsonRecords(result.data, "result")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 40),
          name: textField(row.name, 120),
          status: textField(row.status, 40),
        }));
      return {
        source: sourceRef(`${BASE}/client/v4/zones`, "Zones Cloudflare"),
        total: zones.length,
        zones,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function cloudflareGetZone(deps: PluginToolDeps) {
  return tool({
    description:
      "Détail d'une zone Cloudflare : état, plan et serveurs de noms.",
    execute: async ({ zoneId }) => {
      const path = `/client/v4/zones/${encodeSegment(zoneId)}`;
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path,
        providerId: "cloudflare",
      });
      if (!result.ok) return { error: result.error };
      const zone = asRecord(asRecord(result.data)?.result);
      const plan = asRecord(zone?.plan);
      return {
        source: sourceRef(`${BASE}${path}`, "Zone Cloudflare"),
        zone: zone
          ? {
              id: textField(zone.id, 40),
              name: textField(zone.name, 120),
              nameServers: Array.isArray(zone.name_servers)
                ? zone.name_servers.slice(0, 6)
                : [],
              plan: textField(plan?.name, 80),
              status: textField(zone.status, 40),
            }
          : null,
      };
    },
    inputSchema: z.object({
      zoneId: z.string().min(8).max(40),
    }),
  });
}

function cloudflareListDnsRecords(deps: PluginToolDeps) {
  return tool({
    description: "Liste les enregistrements DNS d'une zone Cloudflare.",
    execute: async ({ maxResults, zoneId }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: `/client/v4/zones/${encodeSegment(zoneId)}/dns_records`,
        providerId: "cloudflare",
        query: { per_page: maxResults },
      });
      if (!result.ok) return { error: result.error };
      const records = jsonRecords(result.data, "result")
        .slice(0, maxResults)
        .map((row) => ({
          content: textField(row.content, 200),
          id: textField(row.id, 40),
          name: textField(row.name, 160),
          proxied: row.proxied === true,
          ttl: typeof row.ttl === "number" ? row.ttl : null,
          type: textField(row.type, 10),
        }));
      return {
        records,
        source: sourceRef(
          `${BASE}/client/v4/zones/${zoneId}/dns_records`,
          "DNS Cloudflare"
        ),
        total: records.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(100).default(30),
      zoneId: z.string().min(8).max(40),
    }),
  });
}

function cloudflareListWorkers(deps: PluginToolDeps) {
  return tool({
    description: "Liste les scripts Cloudflare Workers du compte.",
    execute: async ({ accountId, maxResults }) => {
      let resolvedAccountId = accountId?.trim();
      if (!resolvedAccountId) {
        const accounts = await readBearer({
          base: BASE,
          deps,
          descriptor,
          path: "/client/v4/accounts",
          providerId: "cloudflare",
          query: { per_page: 5 },
        });
        if (!accounts.ok) return { error: accounts.error };
        const first = jsonRecords(accounts.data, "result")[0];
        resolvedAccountId = textField(first?.id, 40) ?? undefined;
        if (!resolvedAccountId) {
          return { error: "Aucun compte Cloudflare accessible avec ce jeton." };
        }
      }
      const path = `/client/v4/accounts/${encodeSegment(resolvedAccountId)}/workers/scripts`;
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path,
        providerId: "cloudflare",
      });
      if (!result.ok) return { error: result.error };
      const workers = jsonRecords(result.data, "result")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 120),
          modifiedOn: textField(row.modified_on, 40),
        }));
      return {
        accountId: resolvedAccountId,
        source: sourceRef(`${BASE}${path}`, "Workers Cloudflare"),
        total: workers.length,
        workers,
      };
    },
    inputSchema: z.object({
      accountId: z.string().min(8).max(40).optional(),
      maxResults: z.number().int().min(1).max(50).default(20),
    }),
  });
}

export const cloudflarePlugin: PluginDefinition = {
  createTools: (deps) => ({
    cloudflareGetZone: cloudflareGetZone(deps),
    cloudflareListDnsRecords: cloudflareListDnsRecords(deps),
    cloudflareListWorkers: cloudflareListWorkers(deps),
    cloudflareListZones: cloudflareListZones(deps),
  }),
  manifest: manifest as PluginManifest,
};
