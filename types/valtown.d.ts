/**
 * Déclarations ambiantes pour les spécificateurs Deno / Val Town du backend.
 *
 * Pourquoi : les modules racine du graphe `main.ts` sont exécutés sur Val Town,
 * où les préfixes `npm:*` et les URL `https://esm.town/...` sont résolus à
 * l'exécution. `tsc` ne les connaît pas et échouerait en TS2307. Chaque
 * déclaration ci-dessous re-exporte les types RÉELS des paquets installés dans
 * le dépôt — aucun `any` n'est utilisé pour faire taire le compilateur. Seul
 * `https://esm.town/v/std/sqlite` (service Val Town sans paquet npm) reçoit une
 * déclaration explicite, calquée sur l'API réellement utilisée par `config.ts`
 * et `devices.ts`.
 */

/**
 * Global Deno (Val Town) — surface réellement utilisée par le backend :
 * lecture des variables d'environnement et enregistrement de tâches CRON.
 */
declare const Deno: {
  cron: (
    name: string,
    schedule: string,
    options: { backoffSchedule?: number[] },
    handler: () => void | Promise<void>
  ) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

declare module "npm:hono@4" {
  export * from "hono";
  export { Hono } from "hono";
}

declare module "npm:hono/cors" {
  export * from "hono/cors";
}

declare module "npm:hono/streaming" {
  export * from "hono/streaming";
}

declare module "npm:jose" {
  export * from "jose";
}

declare module "npm:bcryptjs" {
  export * from "bcryptjs";
}

declare module "npm:@neondatabase/serverless" {
  export * from "@neondatabase/serverless";
}

declare module "npm:aws4fetch" {
  export * from "aws4fetch";
}

declare module "https://esm.town/v/std/sqlite" {
  /** Résultat d'une requête SQLite Val Town : les lignes sont des tableaux. */
  export interface SQLiteExecuteResult {
    columns?: string[];
    rows: unknown[][];
  }

  export interface SQLiteDatabase {
    execute: ((query: {
      sql: string;
      args?: unknown[];
    }) => Promise<SQLiteExecuteResult>) &
      ((query: string, args?: unknown[]) => Promise<SQLiteExecuteResult>);
  }

  export const sqlite: SQLiteDatabase;
}
