"use client";

import { Button } from "@mdevs/ui/primitives/button";
import Link from "next/link";

export default function WakieShareError({ reset }: { reset: () => void }) {
  return (
    <main className="wakies-shared-page">
      <h1>La fiche n’a pas pu être chargée</h1>
      <p role="alert">
        Le service est temporairement indisponible. Réessayez dans un instant.
      </p>
      <Button onClick={reset}>Réessayer</Button>
      <Link href="/site">Découvrir mAI</Link>
    </main>
  );
}
