import { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { FALLBACK_MAI_TOOLS, type MAITool } from '../data/maiTools';

/** Catalogue serveur → forme frontend (une seule conversion). */
function mapServerTool(tool: {
  id: string;
  name: string;
  slash_command: string;
  mention_tag: string;
  description: string;
  icon_name: string;
  category: string;
}): MAITool {
  return {
    id: tool.id,
    name: tool.name,
    slashCommand: tool.slash_command,
    mentionTag: tool.mention_tag,
    description: tool.description,
    iconName: tool.icon_name,
    category: (tool.category as MAITool['category']) || 'account',
    // Prompt d'exemple riche de la liste statique quand l'outil y existe,
    // sinon commande seule (ex. « /audience »)
    samplePrompt:
      FALLBACK_MAI_TOOLS.find((f) => f.id === tool.id)?.samplePrompt || `${tool.slash_command} `,
  };
}

/**
 * Liste des outils mAI disponibles (GET /v1/mai/tools, filtré par les outils
 * activés de l'utilisateur). Repli statique si le serveur est injoignable.
 * Aucun cache module : chaque montage reflète les réglages courants
 * (le client ApiService déduplique déjà les GET pendant 15 s).
 */
export function useAvailableMAITools(): MAITool[] {
  const [tools, setTools] = useState<MAITool[]>(FALLBACK_MAI_TOOLS);

  useEffect(() => {
    let alive = true;
    ApiService.getMAITools()
      .then((res) => {
        if (!alive) return;
        if (Array.isArray(res?.tools)) {
          setTools(res.tools.map(mapServerTool));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return tools;
}
