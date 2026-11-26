/** GET /api/history : projets paginés et filtrés, « sans projet », validation. */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteAllChatsByUserId: vi.fn(),
  getChatsByUserId: vi.fn(),
  getProjectAccess: vi.fn(),
  getProjectChatHistory: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/db/queries", () => ({
  deleteAllChatsByUserId: mocks.deleteAllChatsByUserId,
  getChatsByUserId: mocks.getChatsByUserId,
  getProjectChatHistory: mocks.getProjectChatHistory,
}));
vi.mock("@/lib/projects/access", () => ({
  getProjectAccess: mocks.getProjectAccess,
}));

const PROJET = "11111111-1111-4111-8111-111111111111";
const CURSEUR = "22222222-2222-4222-8222-222222222222";

async function get(query: string) {
  const { GET } = await import("@/app/(chat)/api/history/route");
  return GET(new NextRequest(`https://mai.test/api/history?${query}`));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({
    user: { email: "alice@mai.test" },
    userId: "alice",
  });
  mocks.getProjectAccess.mockResolvedValue({ id: PROJET, role: "member" });
  mocks.getProjectChatHistory.mockResolvedValue({
    chats: [{ id: "a" }],
    hasMore: true,
  });
  mocks.getChatsByUserId.mockResolvedValue({ chats: [], hasMore: false });
});

describe("GET /api/history", { timeout: 30_000 }, () => {
  it("transmet curseur et filtres au projet et relaie hasMore", async () => {
    const response = await get(
      `projectId=${PROJET}&ending_before=${CURSEUR}&limit=20&isArchived=true&pinned=false&search=plan&tag=cours`
    );
    expect(response.status).toBe(200);
    expect(mocks.getProjectChatHistory).toHaveBeenCalledWith({
      endingBefore: CURSEUR,
      includeArchived: false,
      isArchived: true,
      limit: 20,
      pinned: false,
      projectId: PROJET,
      search: "plan",
      startingAfter: null,
      tag: "cours",
    });
    expect(await response.json()).toEqual({
      chats: [{ id: "a" }],
      hasMore: true,
    });
  });

  it("ne lit aucune conversation d'un projet inaccessible", async () => {
    mocks.getProjectAccess.mockResolvedValue(null);
    const response = await get(`projectId=${PROJET}`);
    expect(response.status).toBe(404);
    expect(mocks.getProjectChatHistory).not.toHaveBeenCalled();
  });

  it("traite projectId=null comme l'historique personnel sans projet", async () => {
    const response = await get("projectId=null&limit=20");
    expect(response.status).toBe(200);
    expect(mocks.getProjectAccess).not.toHaveBeenCalled();
    expect(mocks.getChatsByUserId).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "alice",
        projectId: null,
        userEmail: "alice@mai.test",
      })
    );
  });

  it("refuse une limite invalide avant toute lecture", async () => {
    const response = await get("limit=abc");
    expect(response.status).toBe(400);
    expect(mocks.requireUser).not.toHaveBeenCalled();
    expect(mocks.getChatsByUserId).not.toHaveBeenCalled();
  });
});
