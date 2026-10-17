/** La visibilité est relue à chaque requête : retirer une publication rend son lien indisponible. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { WakieSharedProfile } from "@/components/wakies/WakieSharedProfile";
import { lireFicheWakiePartagee } from "@/lib/wakies/public-profile";

type Props = { params: Promise<{ id: string }> };
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const fiche = await lireFicheWakiePartagee(id);
  return {
    description:
      fiche?.profil.bio || "Découvrez la fiche publique d’un Wakie sur mAI.",
    robots: { follow: false, index: false },
    title: fiche ? `${fiche.profil.name} — Wakies` : "Wakie indisponible",
  };
}

export default async function WakieSharePage({ params }: Props) {
  await connection();
  const { id } = await params;
  const fiche = await lireFicheWakiePartagee(id);
  if (!fiche) notFound();
  return <WakieSharedProfile fiche={fiche} />;
}
