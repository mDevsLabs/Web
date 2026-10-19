"use client";

/**
 * Aides du composer : autocomplétion `/slash` uniquement.
 *
 * `@` a son propre composant (`ComposerMentions.tsx`) depuis qu'il invoque des
 * capacités, des documents et des agents : un menu ancré sur le caret, avec
 * navigation clavier et insertion atomique, ne se bricole pas dans une liste
 * statique sous le champ.
 *
 * Les deux composants partagent `motEnCours` (`composer-caret.ts`) : deux
 * analyseurs concurrents sur la même `textarea` pourraient désigner deux
 * positions de début différentes pour une même frappe, et l'insertion
 * écraserait le mauvais morceau du brouillon.
 *
 * `/` réutilise les commandes du compte (`GET /api/wakies/slash?q=`) ;
 * l'insertion remplace le mot en cours, jamais tout le brouillon.
 */

import { Button } from "@mdevs/ui/primitives/button";
import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import { motEnCours } from "@/components/wakies/composer-caret";

type Commande = {
  actionType: string;
  description: string | null;
  trigger: string;
};

export function ComposerAides({
  brouillon,
  onChoisir,
  textareaRef,
}: {
  brouillon: string;
  onChoisir: (suivant: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [mot, setMot] = useState<ReturnType<typeof motEnCours> | null>(null);

  useEffect(() => {
    const zone = textareaRef.current;
    if (!zone) return;
    const relever = () => {
      const trouve = motEnCours(
        zone.value,
        zone.selectionStart ?? zone.value.length
      );
      // Une commande est un mot qui commence par `/` ; le reste appartient à `@`.
      setMot(trouve?.mot.startsWith("/") ? trouve : null);
    };
    relever();
    zone.addEventListener("input", relever);
    zone.addEventListener("click", relever);
    // La fin d'une composition IME est relevée aussi : pendant la composition,
    // `selectionStart` n'est pas encore la position finale.
    zone.addEventListener("compositionend", relever);
    return () => {
      zone.removeEventListener("input", relever);
      zone.removeEventListener("click", relever);
      zone.removeEventListener("compositionend", relever);
    };
  }, [brouillon, textareaRef]);

  const commandeEnCours = mot?.mot;

  useEffect(() => {
    if (!commandeEnCours?.startsWith("/")) {
      setCommandes([]);
      return;
    }
    const q = commandeEnCours.slice(1);
    if (!q) {
      setCommandes([]);
      return;
    }
    let annule = false;
    const minuteur = setTimeout(async () => {
      try {
        const data = await api<{ commandes: Commande[] }>(
          `/slash?q=${encodeURIComponent(q)}`
        );
        if (!annule) setCommandes(data.commandes);
      } catch {
        if (!annule) setCommandes([]);
      }
    }, 250);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [commandeEnCours]);

  if (!mot || mot.mot.length < 2 || commandes.length === 0) return null;

  return (
    <ul aria-label="Commandes disponibles" className="composer-pieces">
      {commandes.map((c) => (
        <li className="composer-piece is-pret" key={c.trigger}>
          <span className="composer-piece-name">/{c.trigger}</span>
          <span className="composer-piece-meta">
            {c.description ?? c.actionType}
          </span>
          <Button
            onClick={() =>
              onChoisir(
                `${brouillon.slice(0, mot.debut)}/${c.trigger} ${brouillon.slice(mot.fin)}`
              )
            }
            type="button"
            variant="outline"
          >
            Insérer
          </Button>
        </li>
      ))}
    </ul>
  );
}
