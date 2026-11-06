"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useEconomy } from "@/lib/resources/economy";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const appliquer = () => setReduit(media.matches);
    appliquer();
    media.addEventListener("change", appliquer);
    return () => media.removeEventListener("change", appliquer);
  }, []);
  return reduit;
}

export function ConfettisBonneReponse({ actif }: { actif: boolean }) {
  const { isEconomy } = useEconomy();
  const reduit = useMouvementReduit();
  const [taille, setTaille] = useState({ hauteur: 0, largeur: 0 });
  const [couleur, setCouleur] = useState("");

  useEffect(() => {
    const mesurer = () => {
      setTaille({
        hauteur: window.innerHeight,
        largeur: window.innerWidth,
      });
      setCouleur(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--success")
          .trim()
      );
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
  }, []);

  if (!actif || isEconomy || reduit || taille.largeur === 0 || !couleur) {
    return null;
  }

  return (
    <Confetti
      colors={[couleur]}
      gravity={0.28}
      height={taille.hauteur}
      numberOfPieces={90}
      recycle={false}
      style={{ pointerEvents: "none", position: "fixed" }}
      tweenDuration={2500}
      width={taille.largeur}
    />
  );
}
