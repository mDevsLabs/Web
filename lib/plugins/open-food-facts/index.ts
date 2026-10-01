import { tool } from "ai";
import { z } from "zod";
import {
  contactHeaders,
  fetchPublicJson,
  sourceRef,
  truncateText,
} from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const OFF = "https://world.openfoodfacts.org";
const barcodeSchema = z.string().min(8).max(14).regex(/^\d+$/);
const fields =
  "code,product_name,brands,quantity,labels,ingredients_text,allergens,nutriscore_grade,nova_group,ecoscore_grade,nutriments,image_url,url";
type ProductResponse = {
  product?: Record<string, unknown>;
  status?: number;
  status_verbose?: string;
};
function productView(product: Record<string, unknown>) {
  return {
    allergens: truncateText(product.allergens, 1000),
    barcode: product.code ?? null,
    brands: truncateText(product.brands, 250),
    ecoScore: product.ecoscore_grade ?? null,
    image: product.image_url ?? null,
    ingredients: truncateText(product.ingredients_text, 2500),
    labels: truncateText(product.labels, 500),
    name: truncateText(product.product_name, 250),
    novaGroup: product.nova_group ?? null,
    nutriments:
      product.nutriments && typeof product.nutriments === "object"
        ? product.nutriments
        : null,
    nutriScore: product.nutriscore_grade ?? null,
    quantity: truncateText(product.quantity, 80),
    url: product.url ?? null,
  };
}
async function getProduct(barcode: string) {
  const url = `${OFF}/api/v3/product/${encodeURIComponent(barcode)}.json?fields=${fields}`;
  const result = await fetchPublicJson<ProductResponse>(
    url,
    contactHeaders("mAI-Web")
  );
  if (!result.ok) return { error: result.error, url: result.url };
  if (result.data.status !== 1 || !result.data.product)
    return { error: "Produit absent de la base Open Food Facts.", url };
  return { data: productView(result.data.product), url };
}

export const getFoodProduct = tool({
  description:
    "Recherche un aliment Open Food Facts par code-barres et renvoie ses informations principales.",
  execute: async ({ barcode }) => {
    const result = await getProduct(barcode);
    return "error" in result
      ? { error: result.error }
      : {
          ...result.data,
          note: "Open Food Facts est une base contributive : certains champs peuvent manquer ou être inexacts.",
          source: sourceRef(result.url, "Open Food Facts"),
        };
  },
  inputSchema: z.object({
    barcode: barcodeSchema.describe(
      "Code-barres EAN/UPC, uniquement des chiffres"
    ),
  }),
});

export const searchFoodProducts = tool({
  description:
    "Recherche des produits alimentaires par mots-clés et renvoie une liste courte avec codes-barres et scores.",
  execute: async ({ limit, query }) => {
    const url = new URL(`${OFF}/api/v2/search`);
    url.searchParams.set("search_terms", query);
    url.searchParams.set("page", "1");
    url.searchParams.set("page_size", String(limit));
    url.searchParams.set("fields", fields);
    const result = await fetchPublicJson<{
      products?: Array<Record<string, unknown>>;
    }>(url.href, contactHeaders("mAI-Web"));
    if (!result.ok) return { error: result.error };
    const products = (result.data.products ?? [])
      .slice(0, limit)
      .map(productView);
    return {
      count: products.length,
      note: "Données contributives pouvant être incomplètes.",
      products,
      source: sourceRef(url.href, "Recherche Open Food Facts"),
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(12).default(8),
    query: z.string().min(2).max(100),
  }),
});

export const compareFoodProducts = tool({
  description:
    "Compare deux à cinq produits Open Food Facts par code-barres, informations nutritionnelles et scores disponibles.",
  execute: async ({ barcodes }) => {
    const results = await Promise.all(
      barcodes.map((barcode) => getProduct(barcode))
    );
    return {
      note: "Comparaison indicative de données contributives; l'absence d'un champ ne signifie pas une valeur nulle.",
      products: results.map((result, index) =>
        "error" in result
          ? { barcode: barcodes[index], error: result.error }
          : result.data
      ),
      sources: [
        ...new Set(
          results
            .filter((result) => !("error" in result))
            .map((result) => result.url)
        ),
      ].map((url) => sourceRef(url, "Open Food Facts")),
    };
  },
  inputSchema: z.object({ barcodes: z.array(barcodeSchema).min(2).max(5) }),
});

export const getFoodIngredients = tool({
  description:
    "Lit les ingrédients, allergènes et informations de traces déclarées pour un produit alimentaire.",
  execute: async ({ barcode }) => {
    const result = await getProduct(barcode);
    if ("error" in result) return { error: result.error };
    return {
      allergens: result.data.allergens,
      barcode,
      caveat:
        "Les déclarations proviennent de contributeurs et peuvent être absentes ou incomplètes. Vérifiez toujours l'emballage en cas d'allergie.",
      ingredients: result.data.ingredients,
      product: result.data.name,
      source: sourceRef(result.url, "Open Food Facts"),
    };
  },
  inputSchema: z.object({ barcode: barcodeSchema }),
});

export const openFoodFactsPlugin: PluginDefinition = {
  createTools: () => ({
    compareFoodProducts,
    getFoodIngredients,
    getFoodProduct,
    searchFoodProducts,
  }),
  manifest: manifest as PluginManifest,
};
