import { describe, expect, it } from "vitest";
import {
  releaseApiRequestQuota,
  reserveApiQuotaOrRefuse,
  reserveApiRequestQuota,
} from "../../api-quota";
import type { SqlClient } from "../../openrouter-models";

/**
 * Double de SqlClient : il simule la sémantique réellement attendue des
 * requêtes de quota (reset hebdomadaire, somme globale au compte, incrément
 * conditionnel, limite individuelle). Le verrou consultatif est représenté par
 * une file mutex : deux réservations concurrentes ne peuvent pas lire le même
 * solde, exactement comme sous pg_advisory_xact_lock.
 */

type FakeKey = {
  apiKey: string;
  maxLimit: number | null;
  requestCount: number;
  usagePeriodStart: string | null;
};

type FakeState = {
  keys: FakeKey[];
  weekStartStr: string;
};

type FakeQuery = { text: string; values: unknown[] };

function createFakeSql(state: FakeState, options?: { failOn?: string }) {
  let locked: Promise<unknown> = Promise.resolve();

  function withLock<T>(run: () => Promise<T>): Promise<T> {
    const next = locked.then(run, run);
    locked = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  async function execute(query: FakeQuery): Promise<any[]> {
    if (options?.failOn && query.text.includes(options.failOn)) {
      throw new Error("base indisponible");
    }
    if (query.text.includes("pg_advisory_xact_lock")) {
      return [];
    }
    if (query.text.includes("SET request_count = 0")) {
      const week = state.weekStartStr;
      for (const key of state.keys) {
        if (key.usagePeriodStart !== week) {
          key.requestCount = 0;
          key.usagePeriodStart = week;
        }
      }
      return [];
    }
    if (query.text.includes("WITH account_keys")) {
      const apiKey = query.values.find(
        (value): value is string =>
          typeof value === "string" && value.startsWith("mai-")
      );
      // Ordre des nombres interpolés : coût (SET), coût (WHERE), limite, coût
      // (max_limit). La limite est donc le troisième.
      const numbers = query.values.filter(
        (value): value is number => typeof value === "number"
      );
      const cost = Math.max(1, Math.floor(numbers[0] ?? 1));
      const limit = numbers[2] ?? cost;
      const total = state.keys.reduce((sum, key) => sum + key.requestCount, 0);
      const key = state.keys.find((candidate) => candidate.apiKey === apiKey);
      const withinAccount = total + cost <= limit;
      const withinKey =
        !key || key.maxLimit === null || key.maxLimit <= 0
          ? true
          : key.requestCount + cost <= key.maxLimit;
      let reservedCount = 0;
      if (key && withinAccount && withinKey) {
        key.requestCount += cost;
        reservedCount = 1;
      }
      return [
        {
          key_count: String(key?.requestCount ?? 0),
          key_max: key?.maxLimit ?? null,
          reserved_count: reservedCount,
          total: String(total),
        },
      ];
    }
    if (query.text.includes("GREATEST(request_count - ")) {
      const apiKey = query.values.find(
        (value): value is string => typeof value === "string"
      );
      const amount = Math.max(
        1,
        Number(query.values.find((value) => typeof value === "number") ?? 1)
      );
      const key = state.keys.find((candidate) => candidate.apiKey === apiKey);
      if (key) {
        key.requestCount = Math.max(0, key.requestCount - amount);
      }
      return [];
    }
    throw new Error(`Requête non simulée: ${query.text.slice(0, 60)}`);
  }

  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    const query: FakeQuery = { text: strings.join("?"), values };
    // Thenable paresseux : comme le pilote Neon, construire une requête ne
    // l'exécute pas. Une transaction peut ainsi la collecter sans double effet.
    const lazy = {
      __query: query,
      catch(onRejected: (reason: unknown) => unknown) {
        return execute(query).catch(onRejected);
      },
      finally(onFinally: () => void) {
        return execute(query).finally(onFinally);
      },
      // biome-ignore lint/suspicious/noThenProperty: double de pilote paresseux ; `then` est requis pour `await`.
      then(
        onFulfilled?: (value: any[]) => unknown,
        onRejected?: (reason: unknown) => unknown
      ) {
        return execute(query).then(onFulfilled, onRejected);
      },
    };
    return lazy;
  }) as unknown as SqlClient & {
    transaction: (queries: unknown[]) => Promise<any[][]>;
  };

  sql.transaction = (queries: unknown[]) =>
    withLock(async () => {
      const results: any[][] = [];
      for (const query of queries) {
        results.push(await execute((query as { __query: FakeQuery }).__query));
      }
      return results;
    });

  return sql;
}

const WEEK = "2026-10-26";

function baseState(count: number, maxLimit: number | null = null): FakeState {
  return {
    keys: [
      {
        apiKey: "mai-plus-AAAAA-bbbbb",
        maxLimit,
        requestCount: count,
        usagePeriodStart: WEEK,
      },
    ],
    weekStartStr: WEEK,
  };
}

describe("Quota API — réservation atomique à l'échelle du compte", () => {
  it("deux requêtes privées simultanées à 9/10 : une seule consomme la dernière place", async () => {
    const state = baseState(9);
    const sql = createFakeSql(state);
    const params = {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 10,
      userId: "user-1",
      weekStartStr: WEEK,
    };

    const [first, second] = await Promise.all([
      reserveApiQuotaOrRefuse(sql, params),
      reserveApiQuotaOrRefuse(sql, params),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual(["account_exhausted", "reserved"]);
    expect(state.keys[0].requestCount).toBe(10);
  });

  it("le compte est global : une seconde clé ne repart pas d'un solde neuf", async () => {
    const state = baseState(9);
    state.keys.push({
      apiKey: "mai-max-CCCCC-ddddd",
      maxLimit: null,
      requestCount: 0,
      usagePeriodStart: WEEK,
    });
    const sql = createFakeSql(state);

    // La somme du compte vaut déjà 9 : la clé « max » ne peut pas ouvrir une
    // 11e requête sur une limite de 10.
    const first = await reserveApiQuotaOrRefuse(sql, {
      apiKey: "mai-max-CCCCC-ddddd",
      limit: 10,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(first.status).toBe("reserved");
    const second = await reserveApiQuotaOrRefuse(sql, {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 10,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(second.status).toBe("account_exhausted");
    expect(state.keys.reduce((sum, k) => sum + k.requestCount, 0)).toBe(10);
  });

  it("respecte la limite individuelle d'une clé sans confondre avec le quota du compte", async () => {
    const state = baseState(0, 3);
    state.keys[0].requestCount = 3;
    const sql = createFakeSql(state);

    const result = await reserveApiQuotaOrRefuse(sql, {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 100,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(result.status).toBe("key_exhausted");
    expect(state.keys[0].requestCount).toBe(3);
  });

  it("libère une réservation échouée sans facturer la requête refusée", async () => {
    const state = baseState(9);
    const sql = createFakeSql(state);

    const reservation = await reserveApiRequestQuota(sql, {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 10,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(reservation.reserved).toBe(true);
    expect(state.keys[0].requestCount).toBe(10);

    await releaseApiRequestQuota(sql, "mai-plus-AAAAA-bbbbb");
    expect(state.keys[0].requestCount).toBe(9);

    // La place rendue est de nouveau disponible.
    const retry = await reserveApiRequestQuota(sql, {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 10,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(retry.reserved).toBe(true);
    expect(state.keys[0].requestCount).toBe(10);
  });

  it("une indisponibilité de lecture du quota renvoie « unavailable » (jamais un accès)", async () => {
    const state = baseState(9);
    const sql = createFakeSql(state, { failOn: "WITH account_keys" });

    const result = await reserveApiQuotaOrRefuse(sql, {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 10,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(result.status).toBe("unavailable");
    expect(state.keys[0].requestCount).toBe(9);
  });

  it("réinitialise la période hebdomadaire de manière idempotente", async () => {
    const state = baseState(0);
    state.keys[0].usagePeriodStart = "2026-10-19";
    state.keys[0].requestCount = 400;
    const sql = createFakeSql(state);

    const result = await reserveApiRequestQuota(sql, {
      apiKey: "mai-plus-AAAAA-bbbbb",
      limit: 500,
      userId: "user-1",
      weekStartStr: WEEK,
    });
    expect(result.reserved).toBe(true);
    expect(result.used).toBe(0);
    expect(state.keys[0].requestCount).toBe(1);
    expect(state.keys[0].usagePeriodStart).toBe(WEEK);
  });
});
