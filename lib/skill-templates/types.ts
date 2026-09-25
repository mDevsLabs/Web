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
  /**
   * Outils autorisés : identifiants Chat, identifiants fournis par un plugin ou
   * la sentinelle `mcp`. Les identifiants de plugin sont validés avec
   * `pluginIds` ci-dessous.
   */
  tools: string[];
  /**
   * Plugins dont les outils sont utilisés par le skill. Cette liste est une
   * métadonnée du template statique : elle permet une validation stricte sans
   * ajouter de colonne ou de migration à la table Skill.
   */
  pluginIds: string[];
  /**
   * Serveurs MCP explicitement autorisés. Une liste vide signifie « aucun
   * serveur » ; aucune valeur générique (« all », « * ») n'est acceptée.
   */
  mcpServerNames: string[];
  /** Les dépendances MCP doivent être résolues avant l'installation. */
  strictMcp?: boolean;
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
