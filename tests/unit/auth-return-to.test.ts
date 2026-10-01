import { describe, expect, it } from "vitest";
import { getReturnToFromSearch, getSafeReturnTo } from "@/lib/auth/return-to";

describe("getSafeReturnTo", () => {
  it("conserve un chemin interne et sa query string", () => {
    expect(getSafeReturnTo("/chat/abc?tab=tools#latest")).toBe(
      "/chat/abc?tab=tools#latest"
    );
  });

  it("rejette les redirections externes et protocol-relative", () => {
    expect(getSafeReturnTo("https://example.com/steal")).toBe("/");
    expect(getSafeReturnTo("//example.com/steal")).toBe("/");
    expect(getSafeReturnTo("/\\example.com")).toBe("/");
    expect(getSafeReturnTo("/%2F%2Fexample.com")).toBe("/");
    expect(getSafeReturnTo("/%5Cexample.com")).toBe("/");
  });

  it("accepte redirectUrl et next en rétrocompatibilité", () => {
    expect(
      getReturnToFromSearch("?redirectUrl=%2Fsettings%3Ftab%3Dsecurity")
    ).toBe("/settings?tab=security");
    expect(getReturnToFromSearch("?next=%2Fprojects%2F123")).toBe(
      "/projects/123"
    );
  });
});
