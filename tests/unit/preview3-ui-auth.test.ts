// Les régressions de la preview touchent la connexion, les menus et les capacités des pièces jointes.
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { readAuthentication } from "@/lib/client/authentication";
import { resolveWakieCatalogModel } from "@/lib/wakies/model";
import {
  acceptePiece,
  capacitesPieces,
  formatsPieces,
} from "@/lib/wakies/shared/model-attachments";
import {
  cheminPartageWakie,
  estPagePartageWakie,
  lienPartageWakie,
} from "@/lib/wakies/shared/sharing";
import { proxy } from "@/proxy";

afterEach(() => vi.unstubAllGlobals());

describe("connexion vérifiée par le serveur", () => {
  it.each([true, false])(
    "lit l’état %s sans cookie lisible",
    async (authenticated) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(Response.json({ authenticated }))
      );
      await expect(readAuthentication("/api/user/me")).resolves.toBe(
        authenticated
      );
      expect(fetch).toHaveBeenCalledWith("/api/user/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
    }
  );
  it("reconnaît un refus de session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    );
    await expect(readAuthentication("/api/user/me")).resolves.toBe(false);
  });
  it.each([503, 500])(
    "ne transforme pas HTTP %s en déconnexion",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status }))
      );
      await expect(readAuthentication("/api/user/me")).rejects.toThrow();
    }
  );
  it("ne transforme pas une coupure réseau en déconnexion", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Réseau indisponible"))
    );
    await expect(readAuthentication("/api/user/me")).rejects.toThrow();
  });
  it("refuse un payload incomplet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    await expect(readAuthentication("/api/user/me")).rejects.toThrow();
  });
});

describe("accueil public sans session", () => {
  it.each(["/", "/wakies", "/settings?tab=memory"])(
    "envoie %s vers le site avec retour conservé",
    async (path) => {
      const response = await proxy(
        new NextRequest(`https://mai.example${path}`)
      );
      const destination = new URL(response.headers.get("location")!);
      expect(destination.pathname).toBe("/site");
      expect(destination.searchParams.get("connexion")).toBe("1");
      expect(destination.searchParams.get("redirectUrl")).toBe(path);
    }
  );
  it.each(["/site", "/site/docs", "/login", "/register"])(
    "laisse %s accessible",
    async (path) => {
      const response = await proxy(
        new NextRequest(`https://mai.example${path}`)
      );
      expect(response.headers.get("location")).toBeNull();
    }
  );
  it("préserve le refus JSON des API privées", async () => {
    const response = await proxy(
      new NextRequest("https://mai.example/api/wakies/state")
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
  });

  it("rend publique uniquement une URL de fiche avec un identifiant exact", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(estPagePartageWakie(`/wakies/share/${id}`)).toBe(true);
    expect(estPagePartageWakie(`/base/wakies/share/${id}`, "/base")).toBe(true);
    expect(estPagePartageWakie(`/wakies/share/${id}/edit`)).toBe(false);
    expect(estPagePartageWakie(`/api/wakies/${id}/profile`)).toBe(false);
    expect(estPagePartageWakie("/wakies/share/not-an-id")).toBe(false);
  });

  it("construit le lien du domaine courant et refuse une origine invalide", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(lienPartageWakie(id, "https://preview.example", "/base")).toBe(
      `https://preview.example/base/wakies/share/${id}`
    );
    expect(() => cheminPartageWakie("../../private")).toThrow();
    expect(() => lienPartageWakie(id, "javascript:alert(1)")).toThrow();
  });
});

describe("modèles et pièces jointes", () => {
  it("suit le catalogue lorsque le défaut global a disparu", () => {
    expect(resolveWakieCatalogModel([{ id: "nouveau-modele" }])).toBe(
      "nouveau-modele"
    );
  });
  it("conserve le défaut global disponible", () => {
    expect(
      resolveWakieCatalogModel([{ id: "autre" }, { id: DEFAULT_CHAT_MODEL }])
    ).toBe(DEFAULT_CHAT_MODEL);
  });
  it("ne remplace pas un choix explicite par un modèle silencieux", () => {
    expect(
      resolveWakieCatalogModel([{ id: "autre" }], " choisi ", "wakie")
    ).toBe("choisi");
    expect(resolveWakieCatalogModel([{ id: "autre" }], null, "wakie")).toBe(
      "wakie"
    );
  });
  it("distingue images et documents", () => {
    const image = capacitesPieces({ image: true });
    expect(acceptePiece("image/png", image)).toBe(true);
    expect(acceptePiece("application/pdf", image)).toBe(false);
    expect(formatsPieces(image)).not.toContain("application/pdf");
    const document = capacitesPieces({ file: true });
    expect(acceptePiece("application/pdf", document)).toBe(true);
    expect(acceptePiece("image/png", document)).toBe(false);
  });
  it("refuse SVG, HTML et capacités inconnues", () => {
    expect(
      acceptePiece("image/svg+xml", { documents: true, images: true })
    ).toBe(false);
    expect(acceptePiece("text/html", { documents: true, images: true })).toBe(
      false
    );
    expect(formatsPieces(capacitesPieces())).toBe("");
    expect(capacitesPieces({ vision: true }).images).toBe(true);
  });
});

describe("contrats visuels des Wakies", () => {
  it("regroupe les quatre actions sous le menu et conserve la confirmation", () => {
    const source = readFileSync(
      "components/wakies/ConversationList.tsx",
      "utf8"
    );
    expect(source).toContain("<SpaceMenu");
    for (const id of ["favori", "sourdine", "renommer", "supprimer"])
      expect(source).toContain(`id: "${id}"`);
    expect(source).toContain("window.confirm");
    expect(source).not.toContain("aria-pressed");
  });
  it("conserve la navigation clavier des actions à cocher", () => {
    const source = readFileSync("components/wakies/SpaceMenu.tsx", "utf8");
    expect(source).toContain('role^="menuitem"');
    expect(source).toContain("menuitemcheckbox");
    expect(source).toContain("aria-checked={action.checked}");
  });
  it("borne les cases et conserve un accueil défilant", () => {
    const css = readFileSync("components/wakies/wakies-host.css", "utf8");
    expect(css).toContain("flex: 0 0 16px;");
    expect(css).toContain(".capability-row > input");
    const messages = readFileSync("components/chat/messages.tsx", "utf8");
    expect(messages).toContain("my-auto flex w-full max-w-3xl shrink-0");
  });
});
