import type { Metadata } from "next";
import { PlaygroundClient } from "./playground-client";

export const metadata: Metadata = {
  description:
    "Terrain de jeu : testez les modèles mAI (texte, image, audio) directement depuis le navigateur, avec la même API que vos applications.",
  title: "Terrain de jeu | mAI",
};

export default function SitePlaygroundPage() {
  return (
    <main className="min-h-[100dvh] bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PlaygroundClient />
      </div>
    </main>
  );
}
