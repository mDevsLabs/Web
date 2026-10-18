import type { Metadata } from "next";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = {
  description:
    "Moteur de recherche moderne, minimaliste et instantané propulsé par You.com et l'intelligence artificielle mAI.",
  title: "mAI Search | mAI",
};

export default function SearchPage() {
  return <SearchClient />;
}
