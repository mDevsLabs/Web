// Les lectures sociales ne doivent ni inventer un état vide, ni permettre d’écraser une fiche non chargée.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FriendsScreen } from "@/components/wakies/FriendsScreen";
import { MonProfilCard } from "@/components/wakies/MonProfilCard";
import { WakieProfileDrawer } from "@/components/wakies/WakieProfileDrawer";
import {
  type FichePublique,
  type InscritAnnuaire,
  WakiePublicCard,
} from "@/components/wakies/WakiePublicCard";
import type { Wakie } from "@/lib/wakies/shared/types";

const wakie = {
  avatar: "avatar33",
  id: "wakie-test",
  isPublic: false,
  name: "Wakie de test",
} as Wakie;
const inscription: InscritAnnuaire = {
  accent: null,
  avatar: null,
  bio: "Bio publique",
  estAmi: false,
  estMien: false,
  handle: "wakie",
  name: "Wakie de test",
  nombreImages: 5,
  personaPubliee: "Persona publique",
  wakieId: "wakie-test",
};
const actions = {
  onAjouter: () => {},
  onCloner: () => {},
  onDiscuter: () => {},
  onRetirer: () => {},
};

describe("fiches Wakies pendant la lecture", () => {
  it("désactive le formulaire et les images avant la lecture", () => {
    const html = renderToStaticMarkup(
      createElement(WakieProfileDrawer, { onClose: () => {}, wakie })
    );
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toContain("Chargement de la fiche");
    expect(html).toContain("limite indisponible");
    expect(html).not.toContain("illimitées");
    expect(html).toMatch(
      /<input[^>]*aria-label="Importer des images dans la fiche"[^>]*disabled=""/
    );
    expect(html).toContain('tabindex="-1"');
  });
  it("affiche une erreur de fiche sans fabriquer une galerie vide", () => {
    const html = renderToStaticMarkup(
      createElement(WakiePublicCard, {
        ...actions,
        busy: false,
        erreurFiche: "Galerie indisponible",
        fiche: null,
        inscription,
        onReessayer: () => {},
      })
    );
    expect(html).toContain("Bio publique");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Recharger la fiche");
    expect(html).not.toContain("Chargement de la galerie");
    expect(html).not.toContain("Aucune image publiée");
  });
  it("désactive le clonage sans espace de destination", () => {
    const html = renderToStaticMarkup(
      createElement(WakiePublicCard, {
        ...actions,
        busy: false,
        clonageDisponible: false,
        fiche: null,
        inscription,
      })
    );
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>Cloner et discuter<\/button>/
    );
  });
  it("compte les images réellement chargées plutôt qu’un ancien compteur", () => {
    const fiche: FichePublique = {
      images: [],
      profil: {
        avatarUrl: null,
        bannerUrl: null,
        bio: "",
        handle: null,
        links: [],
        name: "Wakie de test",
      },
    };
    const html = renderToStaticMarkup(
      createElement(WakiePublicCard, {
        ...actions,
        busy: false,
        fiche,
        inscription,
      })
    );
    expect(html).toContain("0 image publiée");
    expect(html).not.toContain("5 images publiées");
  });
  it("sépare le chargement des amis d’une liste vide", () => {
    const html = renderToStaticMarkup(
      createElement(FriendsScreen, {
        espaces: [],
        onChanged: async () => {},
        onOuvrirWakie: () => {},
      })
    );
    expect(html).toContain("Chargement de vos amis");
    expect(html).not.toContain("Aucun ami pour");
    expect(html).toContain("au moins deux caractères");
  });
  it("garde l’accès à Vibe sans imbriquer un bouton dans un lien", () => {
    const html = renderToStaticMarkup(createElement(MonProfilCard));
    expect(html).toContain('href="/vibe"');
    expect(html).toContain("Chargement de votre profil");
    expect(html).not.toMatch(/<a[^>]*>\s*<button/);
  });
});

describe("protection des réponses et brouillons", () => {
  it("isole l’annuaire par terme et la fiche par Wakie", () => {
    const source = readFileSync("components/wakies/FriendsScreen.tsx", "utf8");
    expect(source).toContain('["wakies-directory", instance, termeDiffere]');
    expect(source).toContain(
      '["wakies-public-profile", instance, inscription.wakieId]'
    );
    expect(source).toContain(
      "recherchePrete ? (annuaire?.resultats ?? []) : []"
    );
    expect(source).not.toContain("setFiche(");
  });
  it("ne remplit le formulaire que lors d’une lecture initiale ou sauvegardée", () => {
    const source = readFileSync(
      "components/wakies/WakieProfileDrawer.tsx",
      "utf8"
    );
    expect(source).toContain("if (remplir)");
    expect(source).toContain(
      "charger(!formulaireCharge.current, controleur.signal)"
    );
    expect(source).toContain("if (signal?.aborted) return;");
    expect(source).toContain(
      "data-app-update-blocked={busy || televerse || brouillonModifie}"
    );
    const workspace = readFileSync(
      "components/wakies/workspace-app.tsx",
      "utf8"
    );
    expect(workspace).toContain("key={ficheWakie.id}");
  });
  it("garde la case de visibilité de largeur fixe et alignée à gauche", () => {
    const css = readFileSync("components/wakies/wakies-host.css", "utf8");
    expect(css).toContain(
      '.wakies-root .wakies-profile-form .checkbox > input[type="checkbox"]'
    );
    expect(css).toContain(".wakies-profile-form .field-label.checkbox");
    expect(css).toContain("justify-content: flex-start;");
  });
});
