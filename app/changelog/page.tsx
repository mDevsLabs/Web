import { readFile } from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";
import type { Metadata } from "next";
import Link from "next/link";

// Le Markdown versionné reste l'unique source des notes. Le rendu serveur
// échappe le HTML brut et ne dépend ni de la session ni d'un appel à l'API.
export const metadata: Metadata = {
  description: "Découvrez les nouveautés et corrections de mAI.",
  title: "Notes de version | mAI",
};

export default async function ChangelogPage() {
  "use cache";
  const markdown = await readFile(
    path.join(process.cwd(), "CHANGELOG.md"),
    "utf8"
  );
  const html = new MarkdownIt({ html: false, linkify: true }).render(markdown);
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="mb-6 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href="/"
        >
          Retour à mAI
        </Link>
        {/* Le HTML provient exclusivement du fichier local avec html:false. */}
        <article
          className="prose prose-sm max-w-none break-words text-foreground dark:prose-invert sm:prose-base prose-headings:text-foreground prose-a:text-foreground prose-pre:overflow-x-auto"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown local versionné, HTML brut désactivé.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
