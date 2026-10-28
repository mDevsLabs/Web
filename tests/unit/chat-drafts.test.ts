import { describe, expect, it } from "vitest";
import {
  DRAFT_TTL_MS,
  draftKeyForChatId,
  draftScopeForIdentity,
  loadDraft,
  NEW_CHAT_DRAFT_KEY,
  resolveNewChatDraftKey,
  saveDraft,
} from "@/lib/chat/drafts";

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("Brouillons de chat — isolation par compte", () => {
  const alice = draftScopeForIdentity("alice@example.com");
  const bob = draftScopeForIdentity("bob@example.com");

  it("produit un scope stable et distinct par identité", () => {
    expect(draftScopeForIdentity("alice@example.com")).toBe(alice);
    expect(alice).not.toBe(bob);
    expect(alice).not.toContain("alice");
  });

  it("B ne lit jamais le brouillon de A (nouvelle conversation)", () => {
    const storage = new MemoryStorage();
    const keyA = resolveNewChatDraftKey(alice);
    const keyB = resolveNewChatDraftKey(bob);
    expect(keyA).not.toBe(keyB);

    saveDraft(keyA, "brouillon de Alice", { storage });
    expect(loadDraft(keyB, { storage })).toBe("");
    expect(loadDraft(keyA, { storage })).toBe("brouillon de Alice");
  });

  it("isole aussi les conversations existantes", () => {
    const storage = new MemoryStorage();
    const chatId = "chat-123";
    saveDraft(draftKeyForChatId(chatId, alice), "secret A", { storage });
    expect(loadDraft(draftKeyForChatId(chatId, bob), { storage })).toBe("");
    expect(loadDraft(draftKeyForChatId(chatId, alice), { storage })).toBe(
      "secret A"
    );
  });

  it("ne relit JAMAIS l'ancienne clé globale sans propriétaire", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      NEW_CHAT_DRAFT_KEY,
      JSON.stringify({ savedAt: Date.now(), text: "ancien brouillon" })
    );
    expect(loadDraft(resolveNewChatDraftKey(alice), { storage })).toBe("");
  });

  it("expire après 30 jours et nettoie l'entrée", () => {
    const storage = new MemoryStorage();
    const key = resolveNewChatDraftKey(alice);
    saveDraft(key, "vieux", { now: 1000, storage });
    expect(loadDraft(key, { now: 1000 + DRAFT_TTL_MS + 1, storage })).toBe("");
    expect(storage.getItem(key)).toBeNull();
  });

  it("un identifiant vide produit une clé « new » explicite", () => {
    expect(draftKeyForChatId("", alice)).toBe(resolveNewChatDraftKey(alice));
  });
});
