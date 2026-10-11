/** Le rattrapage suit les seq sans sauter les réponses arrivées hors ligne. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findConversation: vi.fn(),
  listMessages: vi.fn(),
  user: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getMaiUser: mocks.user }));
vi.mock("@/lib/wakies/queries", () => mocks);
vi.mock("@/lib/wakies/blob", () => ({ signerPieceJointe: vi.fn() }));
const context = { params: Promise.resolve({ id: "conversation" }) };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "alice", tier: "plus" });
  mocks.findConversation.mockResolvedValue({ id: "conversation" });
  mocks.listMessages.mockResolvedValue(
    Array.from({ length: 101 }, (_, i) => ({
      id: String(i + 51),
      parts: [],
      role: "assistant",
      seq: i + 51,
    }))
  );
});
describe("pagination croissante des messages", { timeout: 30_000 }, () => {
  it("retient les cent premières arrivées et donne le prochain curseur", async () => {
    const { GET } = await import(
      "@/app/(chat)/api/wakies/conversations/[id]/messages/route"
    );
    const response = await GET(
      new Request(
        "https://mai.test/api/wakies/conversations/conversation/messages?apres=50&limite=100"
      ),
      context
    );
    expect(response.status).toBe(200);
    expect(mocks.listMessages).toHaveBeenCalledWith("alice", "conversation", {
      apresSeq: 50,
      avantSeq: undefined,
      limite: 101,
    });
    const body = await response.json();
    expect(body.messages).toHaveLength(100);
    expect(body.messages[0].seq).toBe(51);
    expect(body.messages.at(-1).seq).toBe(150);
    expect(body.seqSuivant).toBe(150);
    expect(body.seqProchain).toBeNull();
  });
  it("refuse deux directions de pagination dans une requête", async () => {
    const { GET } = await import(
      "@/app/(chat)/api/wakies/conversations/[id]/messages/route"
    );
    const response = await GET(
      new Request(
        "https://mai.test/api/wakies/conversations/conversation/messages?avant=100&apres=50"
      ),
      context
    );
    expect(response.status).toBe(400);
    expect(mocks.listMessages).not.toHaveBeenCalled();
  });
  it("garde la direction ancienne et son curseur existant", async () => {
    const { GET } = await import(
      "@/app/(chat)/api/wakies/conversations/[id]/messages/route"
    );
    const response = await GET(
      new Request(
        "https://mai.test/api/wakies/conversations/conversation/messages?avant=152&limite=100"
      ),
      context
    );
    const body = await response.json();
    expect(body.messages[0].seq).toBe(52);
    expect(body.seqProchain).toBe(52);
    expect(body.seqSuivant).toBeNull();
  });
});
