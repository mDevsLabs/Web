// AUTO-GÉNÉRÉ par `scripts/gen-plugin-catalog.ts` — ne pas éditer à la main.
// Réservé au serveur : importe les implémentations d'outils (ai, zod).
import "server-only";
import { airQualityPlugin } from "./packs/meteo/air-quality";
import { airtablePlugin } from "./packs/productivite/airtable";
import { arxivPlugin } from "./packs/research/arxiv";
import { asanaPlugin } from "./packs/productivite/asana";
import { bravePlugin } from "./packs/web/brave";
import { brevoPlugin } from "./packs/communication/brevo";
import { cloudflarePlugin } from "./packs/infra/cloudflare";
import { crossrefPlugin } from "./packs/research/crossref";
import { discordPlugin } from "./packs/communication/discord";
import { dockerhubPlugin } from "./packs/dev/dockerhub";
import { eurostatPlugin } from "./packs/data/eurostat";
import { exchangeRatePlugin } from "./packs/finance/exchange-rate";
import { frHolidaysPlugin } from "./packs/productivite/fr-holidays";
import { githubPlugin } from "./packs/dev/github";
import { gitlabPublicPlugin } from "./packs/dev/gitlab-public";
import { googleMapsPlugin } from "./packs/mobilite/google-maps";
import { jiraPlugin } from "./packs/productivite/jira";
import { jsonToolboxPlugin } from "./packs/dev/json-toolbox";
import { linearPlugin } from "./packs/dev/linear";
import { makePlugin } from "./packs/automation/make";
import { mapboxPlugin } from "./packs/mobilite/mapbox";
import { mobiliteFrPlugin } from "./packs/mobilite/mobilite-fr";
import { neonPlugin } from "./packs/infra/neon";
import { notionPlugin } from "./packs/productivite/notion";
import { npmPlugin } from "./packs/dev/npm";
import { openFoodFactsPlugin } from "./packs/food/open-food-facts";
import { openLibraryPlugin } from "./packs/culture/open-library";
import { openalexPlugin } from "./packs/research/openalex";
import { posthogPlugin } from "./packs/data/posthog";
import { resendPlugin } from "./packs/communication/resend";
import { sentryPlugin } from "./packs/dev/sentry";
import { slackPlugin } from "./packs/communication/slack";
import { sonarcloudPlugin } from "./packs/dev/sonarcloud";
import { stripePlugin } from "./packs/finance/stripe";
import { supabasePlugin } from "./packs/infra/supabase";
import { tvmazePlugin } from "./packs/culture/tvmaze";
import { twilioPlugin } from "./packs/communication/twilio";
import { upstashPlugin } from "./packs/infra/upstash";
import { vercelPlugin } from "./packs/infra/vercel";
import { weatherPlugin } from "./packs/meteo/weather";
import { webToolboxPlugin } from "./packs/web/web-toolbox";
import { wikidataPlugin } from "./packs/research/wikidata";
import { wikipediaPlugin } from "./packs/research/wikipedia";
import { worldBankPlugin } from "./packs/data/world-bank";
import { youtubePlugin } from "./packs/culture/youtube";
import { zapierPlugin } from "./packs/automation/zapier";
import type { PluginDefinition } from "./core/types";

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  airQualityPlugin,
  airtablePlugin,
  arxivPlugin,
  asanaPlugin,
  bravePlugin,
  brevoPlugin,
  cloudflarePlugin,
  crossrefPlugin,
  discordPlugin,
  dockerhubPlugin,
  eurostatPlugin,
  exchangeRatePlugin,
  frHolidaysPlugin,
  githubPlugin,
  gitlabPublicPlugin,
  googleMapsPlugin,
  jiraPlugin,
  jsonToolboxPlugin,
  linearPlugin,
  makePlugin,
  mapboxPlugin,
  mobiliteFrPlugin,
  neonPlugin,
  notionPlugin,
  npmPlugin,
  openFoodFactsPlugin,
  openLibraryPlugin,
  openalexPlugin,
  posthogPlugin,
  resendPlugin,
  sentryPlugin,
  slackPlugin,
  sonarcloudPlugin,
  stripePlugin,
  supabasePlugin,
  tvmazePlugin,
  twilioPlugin,
  upstashPlugin,
  vercelPlugin,
  weatherPlugin,
  webToolboxPlugin,
  wikidataPlugin,
  wikipediaPlugin,
  worldBankPlugin,
  youtubePlugin,
  zapierPlugin,
];
