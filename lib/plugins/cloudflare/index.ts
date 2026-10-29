import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { encodeSegment } from "../shared/authorized-api";
import { jsonRecords, readBearer, textField } from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Cloudflare en lecture seule, par jeton d'API.
 * La purge de cache et l'édition DNS ne sont pas exposées.
 */

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

export const cloudflarePlugin: PluginDefinition = {
  createTools: (deps) => ({
    cloudflareListDnsRecords: cloudflareListDnsRecords(deps),
    cloudflareListZones: cloudflareListZones(deps),
  }),
  manifest: manifest as PluginManifest,
};
