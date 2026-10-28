import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteReadNotifications } = vi.hoisted(() => ({
  deleteReadNotifications: vi.fn(async () => ({ deleted: 10 })),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(async () => ({
    user: { email: "user@example.com" },
    userId: "user-1",
  })),
}));

vi.mock("@/lib/db/queries", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    deleteAllNotifications: vi.fn(async () => ({ success: true })),
    deleteReadNotifications,
  };
});

import { DELETE } from "@/app/(chat)/api/notifications/route";

describe("Notifications — vider les lues", () => {
  beforeEach(() => {
    deleteReadNotifications.mockClear();
  });

  it("supprime les lues EN BASE sans se limiter aux 50 plus récentes", async () => {
    const response = await DELETE(
      new Request("https://app.mai.test/api/notifications?clearRead=true", {
        method: "DELETE",
      })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: 10 });
    // La route délègue à la requête SQL filtrée ; elle ne charge ni ne filtre
    // un lot de 50 en mémoire.
    expect(deleteReadNotifications).toHaveBeenCalledWith("user-1");
  });

  it("distingue « tout supprimer » de « vider les lues »", async () => {
    const response = await DELETE(
      new Request("https://app.mai.test/api/notifications?all=true", {
        method: "DELETE",
      })
    );
    expect(response.status).toBe(200);
    expect(deleteReadNotifications).not.toHaveBeenCalled();
  });
});
