/**
 * Carte PNG du profil. Dessinée sur un canvas pour rester dans le
 * navigateur : pas de service d'image. Si l'avatar ne se charge pas,
 * l'initiale le remplace.
 */

import type { LeagueId } from "@/lib/quizzly/leagues";
import { libelleLigue } from "@/lib/quizzly/leagues";
import { LEAGUE_COLOR } from "@/lib/quizzly/palette";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";

export type CarteProfil = {
  avatarUrl: string | null;
  displayName: string;
  league: LeagueId;
  schoolYear: string;
  streakBest: number;
  streakCount: number;
  username: string;
  xp: number;
};

const LARGEUR = 1080;
const HAUTEUR = 1350;

async function imageLocale(url: string): Promise<HTMLImageElement | null> {
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) {
      return null;
    }
    const blob = await reponse.blob();
    const objet = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise<void>((ok, ko) => {
        image.onload = () => ok();
        image.onerror = () => ko(new Error("avatar"));
        image.src = objet;
      });
      return image;
    } finally {
      URL.revokeObjectURL(objet);
    }
  } catch {
    return null;
  }
}

export async function dessinerCarteProfil(
  donnees: CarteProfil
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = LARGEUR;
  canvas.height = HAUTEUR;
  const crayon = canvas.getContext("2d");
  if (!crayon) {
    return null;
  }
  const racine = document.querySelector(".quizzly-root");
  const style = racine ? getComputedStyle(racine) : null;
  const fond = style?.backgroundColor || "#111111";
  const encre = style?.color || "#f5f5f5";
  const ligue = LEAGUE_COLOR[donnees.league];
  crayon.fillStyle = fond;
  crayon.fillRect(0, 0, LARGEUR, HAUTEUR);
  crayon.fillStyle = ligue;
  crayon.beginPath();
  crayon.arc(540, 280, 120, 0, Math.PI * 2);
  crayon.fill();
  const avatar = donnees.avatarUrl
    ? await imageLocale(donnees.avatarUrl)
    : null;
  crayon.save();
  crayon.beginPath();
  crayon.arc(540, 280, 108, 0, Math.PI * 2);
  crayon.clip();
  if (avatar) {
    crayon.drawImage(avatar, 432, 172, 216, 216);
  } else {
    crayon.fillStyle = "#1c1c1c";
    crayon.fillRect(432, 172, 216, 216);
    crayon.fillStyle = encre;
    crayon.font = "700 96px sans-serif";
    crayon.textAlign = "center";
    crayon.textBaseline = "middle";
    crayon.fillText(
      donnees.displayName.slice(0, 1).toUpperCase() || "?",
      540,
      280
    );
  }
  crayon.restore();
  crayon.fillStyle = encre;
  crayon.textAlign = "center";
  crayon.textBaseline = "alphabetic";
  crayon.font = "700 64px sans-serif";
  crayon.fillText(donnees.displayName, 540, 500);
  crayon.font = "400 36px sans-serif";
  crayon.fillStyle = ligue;
  crayon.fillText(
    donnees.username ? `@${donnees.username}` : "Quizzly",
    540,
    560
  );
  crayon.font = "700 42px sans-serif";
  crayon.fillText(libelleLigue(donnees.league), 540, 680);
  const annee =
    donnees.schoolYear === "6e" ||
    donnees.schoolYear === "5e" ||
    donnees.schoolYear === "4e" ||
    donnees.schoolYear === "3e" ||
    donnees.schoolYear === "2nde" ||
    donnees.schoolYear === "1ere" ||
    donnees.schoolYear === "terminale"
      ? libelleAnnee(donnees.schoolYear)
      : donnees.schoolYear;
  const lignes = [
    `${donnees.xp} XP`,
    `Série ${donnees.streakCount}`,
    `Record ${donnees.streakBest}`,
    annee,
  ];
  crayon.fillStyle = encre;
  crayon.font = "600 40px sans-serif";
  lignes.forEach((ligne, index) => {
    crayon.fillText(ligne, 540, 820 + index * 80);
  });
  crayon.font = "500 28px sans-serif";
  crayon.fillText("Quizzly", 540, 1260);
  return new Promise((ok) => {
    canvas.toBlob((blob) => ok(blob), "image/png");
  });
}

export async function partagerProfil(
  donnees: CarteProfil
): Promise<"downloaded" | "failed" | "shared"> {
  const blob = await dessinerCarteProfil(donnees);
  if (!blob) {
    return "failed";
  }
  const fichier = new File([blob], "quizzly-profil.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({
        files: [fichier],
        title: "Mon profil Quizzly",
      });
      return "shared";
    } catch (erreur) {
      if (erreur instanceof DOMException && erreur.name === "AbortError") {
        return "failed";
      }
    }
  }
  const lien = document.createElement("a");
  const url = URL.createObjectURL(blob);
  lien.href = url;
  lien.download = "quizzly-profil.png";
  lien.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
