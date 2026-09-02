"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  OptionSelector,
  type OptionSelectorItem,
} from "@/components/settings/option-selector";

/**
 * Menu déroulant unifié des voix IA — mêmes primitives que le sélecteur de
 * modèles (components/ai-elements/model-selector.tsx). Regroupe les voix du
 * modèle sélectionné par catégorie quand la méta est disponible.
 */

export type VoiceOption = {
  category?: string;
  description?: string;
  gender?: string;
  id: string;
  name: string;
};

export type VoiceOptionSelectorProps = {
  /** Voix proposées par le modèle sélectionné. */
  voices: VoiceOption[];
  value: string;
  onChange: (voiceId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function VoiceOptionSelector({
  voices,
  value,
  onChange,
  placeholder = "Voix par défaut du modèle",
  disabled,
}: VoiceOptionSelectorProps) {
  const items = useMemo<OptionSelectorItem[]>(
    () =>
      voices.map((v) => ({
        description: v.description,
        id: v.id,
        label: v.id === v.name ? v.name : `${v.name} — ${v.id}`,
        meta: v.gender || v.category,
      })),
    [voices]
  );

  return (
    <OptionSelector
      disabled={disabled}
      groupBy={(item) =>
        voices.find((v) => v.id === item.id)?.category ?? "Voix"
      }
      items={items}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une voix…"
      value={value}
    />
  );
}

/**
 * Menu déroulant unifié du format/dimensions des images générées — même
 * design que le sélecteur de modèles.
 */
export type ImageSizeOption = {
  height: number;
  id: string;
  label: string;
  width: number;
};

export const DEFAULT_IMAGE_SIZES: ImageSizeOption[] = [
  { height: 1024, id: "1024x1024", label: "1:1 Carré", width: 1024 },
  { height: 768, id: "1344x768", label: "16:9 Paysage", width: 1344 },
  { height: 1344, id: "768x1344", label: "9:16 Story / Mobile", width: 768 },
  { height: 864, id: "1152x864", label: "4:3 Standard", width: 1152 },
  { height: 1152, id: "864x1152", label: "3:4 Portrait", width: 864 },
];

export function ImageSizeOptionSelector({
  sizes = DEFAULT_IMAGE_SIZES,
  value,
  onChange,
  placeholder = "Format et taille",
}: {
  sizes?: ImageSizeOption[];
  value: string;
  onChange: (sizeId: string) => void;
  placeholder?: string;
}) {
  const items = useMemo<OptionSelectorItem[]>(
    () =>
      sizes.map((s) => ({
        id: s.id,
        label: s.label,
        meta: `${s.width}x${s.height}`,
      })),
    [sizes]
  );

  return (
    <OptionSelector
      items={items}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un format…"
      value={value}
    />
  );
}

/**
 * Catalogue de voix récupéré depuis l'API /api/audio/voices (source unique,
 * partagé entre la page Audio et les paramètres). L'API renvoie toujours des
 * données : catalogue upstream, ou repli serveur si l'upstream est indisponible.
 */
export function useVoicePresets(): VoiceOption[] {
  const { data } = useSWR<{ data: VoiceOption[] }>(
    "/api/audio/voices",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );
  return useMemo(() => data?.data ?? [], [data]);
}

export function mapVoicesForModel(
  modelVoiceIds: string[] | undefined,
  presets: VoiceOption[]
): VoiceOption[] {
  if (!modelVoiceIds || modelVoiceIds.length === 0) {
    return [];
  }
  return modelVoiceIds.map((voiceId) => {
    const preset = presets.find((v) => v.id === voiceId);
    return preset ?? { id: voiceId, name: voiceId };
  });
}
