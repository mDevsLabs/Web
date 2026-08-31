import { tool } from "ai";
import { z } from "zod";

// Principaux symboles de monnaies
const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: "A$",
  BRL: "R$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  USD: "$",
};

export const currencyConverter = tool({
  description:
    "Convertir des devises fiduciaires (EUR, USD, GBP, JPY, CAD, CHF, etc.) et cryptomonnaies courantes (BTC, ETH, SOL) en temps réel avec taux de change actualisés. Permet également de lister les taux de conversion d'une devise de base vers plusieurs devises cibles.",
  execute: async (input) => {
    const from = input.from.toUpperCase().trim();
    const to = input.to.toUpperCase().trim();
    const amount = input.amount ?? 1;

    if (amount <= 0) {
      return { error: "Le montant doit être un nombre strictement positif." };
    }

    if (from === to) {
      return {
        amount,
        date: new Date().toISOString().split("T")[0],
        from,
        rate: 1,
        result: amount,
        symbol: CURRENCY_SYMBOLS[to] || to,
        to,
      };
    }

    // Gestion de la crypto courante (BTC, ETH, SOL) via CoinGecko public API
    const cryptoIds: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
    };

    if (cryptoIds[from] || cryptoIds[to]) {
      try {
        const cryptoKey = cryptoIds[from] ? cryptoIds[from] : cryptoIds[to];
        const fiatKey = cryptoIds[from] ? to.toLowerCase() : from.toLowerCase();

        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoKey}&vs_currencies=${fiatKey}`;
        const resp = await fetch(url, { headers: { Accept: "application/json" } });

        if (resp.ok) {
          const data = await resp.json();
          const cryptoPriceInFiat = data[cryptoKey]?.[fiatKey];
          if (cryptoPriceInFiat) {
            let result: number;
            let rate: number;

            if (cryptoIds[from]) {
              // Crypto -> Fiat
              rate = cryptoPriceInFiat;
              result = amount * rate;
            } else {
              // Fiat -> Crypto
              rate = 1 / cryptoPriceInFiat;
              result = amount * rate;
            }

            return {
              amount,
              date: new Date().toISOString().split("T")[0],
              from,
              rate: Number(rate.toFixed(6)),
              result: Number(result.toFixed(6)),
              symbol: CURRENCY_SYMBOLS[to] || to,
              to,
            };
          }
        }
      } catch {
        // Fallback ou continuation vers devises fiduciaires si échec
      }
    }

    // Devises fiduciaires via Frankfurter (BCE European Central Bank)
    try {
      const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });

      if (!response.ok) {
        return {
          error: `Conversion impossible entre "${from}" et "${to}". Vérifiez les codes de devises (ex: EUR, USD, GBP, JPY).`,
        };
      }

      const data = await response.json();
      const convertedValue = data.rates?.[to];

      if (typeof convertedValue !== "number") {
        return { error: `Taux de change introuvable pour ${to}.` };
      }

      const unitRate = convertedValue / amount;

      return {
        amount,
        date: data.date || new Date().toISOString().split("T")[0],
        from,
        rate: Number(unitRate.toFixed(4)),
        result: Number(convertedValue.toFixed(4)),
        symbol: CURRENCY_SYMBOLS[to] || to,
        to,
      };
    } catch (err: any) {
      return { error: `Erreur lors de la conversion de devise : ${err.message || "inconnue"}` };
    }
  },
  inputSchema: z.object({
    amount: z
      .number()
      .positive()
      .optional()
      .describe("Montant à convertir (défaut: 1)"),
    from: z
      .string()
      .min(3)
      .max(5)
      .describe("Code devise source ISO 4217 (ex: EUR, USD, GBP, JPY, CHF, CAD) ou crypto (BTC, ETH, SOL)"),
    to: z
      .string()
      .min(3)
      .max(5)
      .describe("Code devise cible ISO 4217 (ex: USD, EUR, GBP, JPY) ou crypto (BTC, ETH, SOL)"),
  }),
});
