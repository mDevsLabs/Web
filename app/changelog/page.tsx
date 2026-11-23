import { readFile } from "node:fs/promises";
import path from "node:path";
import MarkdownIt, { type Token } from "markdown-it";
import type { Metadata } from "next";
import Link from "next/link";
import ChangelogView, { type ChangelogVersion } from "./changelog-view";

// Le Markdown versionné reste l'unique source des notes. Le rendu serveur
// échappe le HTML brut et ne dépend ni de la session ni d'un appel à l'API.
//
// Chaque « ## x.y.z » du fichier devient une section autonome : c'est elle
// qui alimente un accordéon du journal et sa recherche locale. Le contenu
// est rendu par morceaux (par version) au lieu d'un document monobloc, sans
// changer la source : le fichier CHANGELOG.md garde sa forme navigable.
export const metadata: Metadata = {
  description: "Découvrez les nouveautés et corrections de mAI.",
  title: "Notes de version | mAI",
};

// Texte brut d'un jeton inline : seuls les textes et le code inline sont
// conservés, les URL et la syntaxe d'emphase sont abandonnées — la
// recherche vise les mots, pas le balisage.
function texteBrut(jeton: Token): string {
  const enfants = jeton.children ?? [];
  const éléments = enfants.filter(
    (enfant) => enfant.type === "text" || enfant.type === "code_inline"
  );
  return (
    éléments.length > 0
      ? éléments.map((enfant) => enfant.content).join(" ")
      : jeton.content
  ).trim();
}

function parserVersions(markdown: string): ChangelogVersion[] {
  const md = new MarkdownIt({ html: false, linkify: true });
  const jetons = md.parse(markdown, {});
  const sections: Array<{ version: string; jetons: Token[] }> = [];
  let courante: { version: string; jetons: Token[] } | null = null;

  for (let i = 0; i < jetons.length; i++) {
    const jeton = jetons[i];
    if (jeton.type === "heading_open" && jeton.tag === "h2") {
      // Un titre de version vaut trois jetons (open, inline, close) : les
      // deux suivants sont sautés, la section ne commence qu'après le titre.
      courante = {
        version: (jetons[i + 1]?.content ?? "").trim(),
        jetons: [],
      };
      sections.push(courante);
      i += 2;
      continue;
    }
    // Tout ce qui précède le premier « ## » (le titre du document, le h1)
    // ne fait partie d'aucune section : la page écrit son propre h1.
    if (courante) {
      courante.jetons.push(jeton);
    }
  }

  return (
    sections
      .map((section) => ({
        version: section.version,
        html: md.renderer.render(section.jetons, md.options, {}),
        text: section.jetons
          .filter((jeton) => jeton.type === "inline")
          .map(texteBrut)
          .filter(Boolean)
          .join(" "),
      }))
      .filter((section) => section.html.trim() !== "")
      // L'accordéon exige des valeurs uniques : quand le fichier contient deux
      // fois le même numéro (deux sections « 0.9.1 » coexistent), les
      // occurrences suivantes sont suffixées, sans toucher au numéro affiché.
      .map((section, index, toutes) => {
        const duplique = toutes.findIndex(
          (autre) => autre.version === section.version
        );
        return {
          ...section,
          id:
            index === duplique
              ? section.version
              : `${section.version}#${index}`,
        };
      })
  );
}

export default async function ChangelogPage() {
  "use cache";
  const markdown = await readFile(
    path.join(process.cwd(), "CHANGELOG.md"),
    "utf8"
  );
  const versions = parserVersions(markdown);
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="mb-6 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href="/"
        >
          Retour à mAI
        </Link>
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Notes de version
          </h1>
          <p className="mt-2 text-muted-foreground">
            L&apos;historique des évolutions de mAI : nouveautés, améliorations
            et corrections, publication après publication.
          </p>
        </header>
        <ChangelogView versions={versions} />
      </div>
    </main>
  );
}
