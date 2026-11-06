// Contrat JSON des routes /api/pages. Importable par le client : aucune
// requête, aucun secret. Les dates sont des chaînes ISO.

export type PageIntent = "edit" | "propose";

export type PageSummary = {
  canDetach: boolean;
  canEdit: boolean;
  excerpt: string;
  id: string;
  projectId: string | null;
  projectName: string | null;
  revision: number;
  title: string;
  updatedAt: string;
};

export type PageProposalView = {
  baseHash: string;
  createdAt: string;
  description: string | null;
  id: string;
};

export type PageMessageView = {
  id: string;
  parts: unknown[];
  role: "assistant" | "system" | "user";
};

export type PageDetail = PageSummary & {
  content: string;
  createdAt: string;
  customPrompt: string | null;
  messages: PageMessageView[];
  modelId: string | null;
  pendingProposals: PageProposalView[];
  wordCount: number;
};

export type PageListResponse = {
  limit: number | null;
  pages: PageSummary[];
  used: number;
};

export type PageUpdatedEvent = {
  content: string;
  revision: number;
  title: string;
};

export type PageRevisionView = {
  createdAt: string;
  id: string;
  source: "assistant" | "manual" | "restore";
  title: string;
};
