import type { Metadata } from "next";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = {
  description:
    "Moteur de recherche moderne, rapide et synthétisé par l'intelligence artificielle mAI.",
  title: "mAI Search | mAI",
};

export default function SearchPage() {
  return <SearchClient />;
}
