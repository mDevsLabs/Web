import Link from "next/link";

export default async function WakieShareNotFound() {
  return (
    <main className="wakies-shared-page">
      <h1>Wakie indisponible</h1>
      <p>Cette fiche n’est pas publique ou n’existe plus.</p>
      <Link className="md-button md-button-outline md-button-md" href="/site">
        Découvrir mAI
      </Link>
    </main>
  );
}
