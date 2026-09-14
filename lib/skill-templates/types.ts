// Modèles de Skills (templates) — format aligné sur lib/plugins et
// lib/mcp-templates. Un "modèle de skill" est une compétence prête à l'emploi
// (instructions système, outils autorisés, paramètres) installable en un clic.

export type SkillTemplateCategory = {
  id: string;
  label: string;
  icon: string;
};

export type SkillTemplateParameter = {
  name: string;
  description?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  enumValues?: string[];
};

export type SkillTemplateManifest = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  /** Icône lucide-react (même mécanique que les plugins). */
  icon: { type: "lucide"; name: string };
  /** Couleur d'accent (hex) utilisée par les cartes de skills. */
  color: string;
  minTier: "free" | "plus" | "pro" | "max";

  /** Instructions système injectées lors de l'usage du skill. */
  instructions: string;
  /** Outils natifs autorisés (identifiants de lib/ai/tools/config.ts) ou "mcp". */
  tools: string[];
  /** Serveurs MCP auxquels le skill peut accéder (vides = tous ceux installés). */
  mcpServerNames: string[];
  parameters: SkillTemplateParameter[];
};

export type SkillTemplateDefinition = {
  manifest: SkillTemplateManifest;
};

// Vue client : manifeste + état d'installation pour l'utilisateur courant.
export type SkillTemplateCatalogEntry = SkillTemplateManifest & {
  installed: boolean;
  installedSkillId: string | null;
};
