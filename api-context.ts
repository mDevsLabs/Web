import type {} from "npm:hono@4";

declare module "npm:hono@4" {
  interface ContextVariableMap {
    apiKey: string | null;
    matchedApiKey: string | null;
    quotaDebitedByHandler: boolean;
    requestQuota: {
      apiKey: string | null;
      limit: number;
      remaining: number;
      used: number;
    };
    userId: string | null;
    userPlan: string;
  }
}
