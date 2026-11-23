import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import {
  bearerFor,
  callAuthorized,
  clampLimit,
  encodeSegment,
} from "../../../shared/authorized-api";
import { jsonRecords, textField } from "../../../shared/bearer-read";
import { sourceRef } from "../../../shared/public-api";
import manifest from "./index.json";

const descriptor = getIntegrationProvider("airtable")!;
const BASE = "https://api.airtable.com";

const baseIdSchema = z
  .string()
  .trim()
  .regex(
    /^app[A-Za-z0-9]{8,24}$/,
    "Identifiant de base Airtable invalide (app…)."
  );

const tableSchema = z.string().trim().min(1).max(120);

function airtableListBases(deps: PluginToolDeps) {
  return tool({
    description: "Liste les bases Airtable accessibles au jeton connecté.",
    execute: async () => {
      const token = await bearerFor(deps, "airtable");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: BASE,
        descriptor,
        path: "/v0/meta/bases",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const bases = jsonRecords(result.data, "bases")
        .slice(0, 50)
        .map((row) => ({
          id: textField(row.id, 32),
          name: textField(row.name, 120),
          permissionLevel: textField(row.permissionLevel, 32),
        }));
      return {
        bases,
        source: sourceRef(`${BASE}/v0/meta/bases`, "Bases Airtable"),
        total: bases.length,
      };
    },
    inputSchema: z.object({}),
  });
}

function airtableGetBaseSchema(deps: PluginToolDeps) {
  return tool({
    description: "Liste les tables et les champs d'une base Airtable.",
    execute: async ({ baseId }) => {
      const token = await bearerFor(deps, "airtable");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: BASE,
        descriptor,
        path: `/v0/meta/bases/${encodeSegment(baseId)}/tables`,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const tables = jsonRecords(result.data, "tables")
        .slice(0, 40)
        .map((table) => ({
          fields: jsonRecords(table, "fields")
            .slice(0, 50)
            .map((field) => ({
              id: textField(field.id, 32),
              name: textField(field.name, 120),
              type: textField(field.type, 40),
            })),
          id: textField(table.id, 32),
          name: textField(table.name, 120),
        }));
      return {
        source: sourceRef(
          `${BASE}/v0/meta/bases/${baseId}/tables`,
          "Schéma Airtable"
        ),
        tables,
        total: tables.length,
      };
    },
    inputSchema: z.object({
      baseId: baseIdSchema,
    }),
  });
}

function airtableListRecords(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit les enregistrements d'une table Airtable (jusqu'à 50 lignes).",
    execute: async ({ baseId, filterByFormula, maxResults, table, view }) => {
      const token = await bearerFor(deps, "airtable");
      if (!token.ok) return { error: token.error };
      const maxRecords = clampLimit(maxResults, 20, 50);
      const path = `/v0/${encodeSegment(baseId)}/${encodeSegment(table)}`;
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: BASE,
        descriptor,
        path,
        query: {
          filterByFormula: filterByFormula?.trim() || undefined,
          maxRecords,
          view: view?.trim() || undefined,
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const records = jsonRecords(result.data, "records")
        .slice(0, maxRecords)
        .map((row) => ({
          createdTime: textField(row.createdTime, 40),
          fields: row.fields ?? {},
          id: textField(row.id, 32),
        }));
      return {
        records,
        source: sourceRef(`${BASE}${path}`, "Enregistrements Airtable"),
        total: records.length,
      };
    },
    inputSchema: z.object({
      baseId: baseIdSchema,
      filterByFormula: z.string().max(300).optional(),
      maxResults: z.number().int().min(1).max(50).default(20),
      table: tableSchema,
      view: z.string().max(120).optional(),
    }),
  });
}

function airtableCreateRecord(deps: PluginToolDeps) {
  return tool({
    description:
      "Crée un nouvel enregistrement dans une table Airtable. Écriture soumise à approbation dans l'Agent.",
    execute: async ({ baseId, fields, table }) => {
      const token = await bearerFor(deps, "airtable");
      if (!token.ok) return { error: token.error };
      const path = `/v0/${encodeSegment(baseId)}/${encodeSegment(table)}`;
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: BASE,
        body: JSON.stringify({ fields, typecast: true }),
        descriptor,
        headers: { "Content-Type": "application/json" },
        method: "POST",
        path,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        created: true,
        fields: result.data.fields ?? {},
        id: textField(result.data.id, 32),
        source: sourceRef(`${BASE}${path}`, "Fiche Airtable créée"),
      };
    },
    inputSchema: z.object({
      baseId: baseIdSchema,
      fields: z.record(
        z.string().min(1).max(120),
        z.union([
          z.string().max(4000),
          z.number(),
          z.boolean(),
          z.array(z.string().max(200)),
        ])
      ),
      table: tableSchema,
    }),
  });
}

export const airtablePlugin: PluginDefinition = {
  createTools: (deps) => ({
    airtableCreateRecord: airtableCreateRecord(deps),
    airtableGetBaseSchema: airtableGetBaseSchema(deps),
    airtableListBases: airtableListBases(deps),
    airtableListRecords: airtableListRecords(deps),
  }),
  manifest: manifest as PluginManifest,
};
