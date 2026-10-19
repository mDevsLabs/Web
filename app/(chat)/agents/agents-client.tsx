"use client";

import {
  BarChart3Icon,
  LayoutGridIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  AgentCard,
  AgentDeleteDialog,
  AgentEditorDialog,
  AgentIcon,
  AgentsStats,
  AgentTemplateGrid,
  BotAvatar,
  BotGlyph,
  DEFAULT_AGENT_COLOR,
} from "@/components/agents";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveChat } from "@/hooks/use-active-chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { Agent, AgentTemplate, McpServer, Skill } from "@/lib/db/schema";
import { cn, fetcher } from "@/lib/utils";

export default function AgentsClient() {
  const {
    data: agentsData,
    mutate,
    isLoading,
  } = useSWR<{ agents: Agent[]; limit: number | null }>("/api/agents", fetcher);
  const agents = useMemo(() => agentsData?.agents ?? [], [agentsData]);

  // Quota d'agents du forfait : Free 8 / Plus 15 / Pro 25 / Max illimité (`null`).
  // La limite vient de l'API, jamais d'un calcul ici : le client affiche ce que
  // le serveur applique.
  const agentLimit = agentsData?.limit ?? null;
  const isAtAgentLimit = agentLimit !== null && agents.length >= agentLimit;

  const { data: templates = [] } = useSWR<AgentTemplate[]>(
    "/api/agents/templates",
    fetcher
  );
  const { data: skills = [] } = useSWR<Skill[]>("/api/skills", fetcher);
  const { data: mcpData } = useSWR<{ servers: McpServer[] }>(
    "/api/mcp",
    fetcher
  );
  const mcpServers = useMemo(
    () => (Array.isArray(mcpData?.servers) ? mcpData.servers : []),
    [mcpData]
  );

  // `capabilities` est indexé par identifiant de modèle : permet de savoir si le modèle du bot raisonne
  const { data: modelsData } = useSWR<{
    capabilities: Record<string, ModelCapabilities>;
    models: unknown[];
  }>("/api/models", fetcher);
  const models: any[] = modelsData?.models || [];

  const { activeAgent, setActiveAgent, clearActiveAgent } = useActiveChat();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"agents" | "templates" | "stats">(
    "agents"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateTag, setTemplateTag] = useState<string | null>(null);
  const [templateModel, setTemplateModel] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formIcon, setFormIcon] = useState("sparkles");
  const [formColor, setFormColor] = useState(DEFAULT_AGENT_COLOR);
  const [formModelId, setFormModelId] = useState(DEFAULT_CHAT_MODEL);
  const [formSkillIds, setFormSkillIds] = useState<string[]>([]);
  const [formMcpIds, setFormMcpIds] = useState<string[]>([]);
  const [formCloudUrls, setFormCloudUrls] = useState<string[]>([]);
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formTopP, setFormTopP] = useState(0.9);
  const [formMaxTokens, setFormMaxTokens] = useState("");
  const [formStarterPrompts, setFormStarterPrompts] = useState<string[]>([]);
  const [formWelcomeMessage, setFormWelcomeMessage] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [formMemoryMode, setFormMemoryMode] = useState<"global" | "custom">(
    "global"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);
  const [cloudFileNames, setCloudFileNames] = useState<Record<string, string>>(
    {}
  );

  const handleStartChatWithAgent = useCallback(
    (a: Agent) => {
      setActiveAgent(a);
      toast.success(`Bot activé : ${a.name}`);
      router.push("/");
    },
    [router, setActiveAgent]
  );

  const filteredAgents = useMemo(
    () =>
      agents
        .filter(
          (a) =>
            !searchQuery ||
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.description || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
        .sort(
          (a, b) =>
            Number(Boolean((b as any).pinned)) -
            Number(Boolean((a as any).pinned))
        ),
    [agents, searchQuery]
  );

  // Filtres de l'onglet « Modèles »
  const templateTags = useMemo(() => {
    const tags = new Set<string>();
    for (const template of templates) {
      for (const tag of template.tags ?? []) {
        tags.add(tag);
      }
    }
    return [...tags].sort((a, b) => a.localeCompare(b, "fr"));
  }, [templates]);

  const templateModelIds = useMemo(
    () => [...new Set(templates.map((t) => t.defaultModelId))].sort(),
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const query = templateQuery.trim().toLowerCase();
    return templates.filter((template) => {
      if (templateModel && template.defaultModelId !== templateModel) {
        return false;
      }
      if (templateTag && !(template.tags ?? []).includes(templateTag)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        template.name.toLowerCase().includes(query) ||
        (template.description || "").toLowerCase().includes(query) ||
        (template.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [templateModel, templateQuery, templateTag, templates]);

  const handleNewAgent = useCallback((template?: AgentTemplate) => {
    setEditingAgent(null);
    setFormName(template?.name ?? "");
    setFormDescription(template?.description ?? "");
    setFormInstructions(template?.instructions ?? "");
    setFormIcon(template?.icon ?? "sparkles");
    setFormColor(template?.color ?? DEFAULT_AGENT_COLOR);
    setFormModelId(template?.defaultModelId ?? DEFAULT_CHAT_MODEL);
    setFormSkillIds([]);
    setFormMcpIds([]);
    setFormCloudUrls([]);
    setFormTemperature(0.7);
    setFormTopP(0.9);
    setFormMaxTokens("");
    setFormStarterPrompts([]);
    setFormWelcomeMessage("");
    setFormPinned(false);
    setFormMemoryMode("global");
    setSaveError(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditAgent = (a: Agent) => {
    setEditingAgent(a);
    setFormName(a.name);
    setFormDescription(a.description || "");
    setFormInstructions(a.instructions || "");
    setFormIcon(a.icon || "sparkles");
    setFormColor(a.color || DEFAULT_AGENT_COLOR);
    setFormModelId((a as any).defaultModelId || DEFAULT_CHAT_MODEL);
    setFormSkillIds((a.skillIds as string[]) || []);
    setFormMcpIds((a.mcpServerIds as string[]) || []);
    setFormCloudUrls((a.cloudFileUrls as string[]) || []);
    setFormTemperature((a as any).temperature ?? 0.7);
    setFormTopP((a as any).topP ?? 0.9);
    setFormMaxTokens((a as any).maxTokens ? String((a as any).maxTokens) : "");
    setFormStarterPrompts((a as any).starterPrompts || []);
    setFormWelcomeMessage((a as any).welcomeMessage || "");
    setFormPinned(Boolean((a as any).pinned));
    setFormMemoryMode((a as any).memoryMode === "custom" ? "custom" : "global");
    setSaveError(null);
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!formName.trim()) {
      const msg = "Nom du bot requis";
      setSaveError(msg);
      toast.error(msg);
      return;
    }
    if (!formInstructions.trim()) {
      const msg = "Instructions requises pour définir le comportement du bot";
      setSaveError(msg);
      toast.error(msg);
      return;
    }
    if (formInstructions.length > 5000) {
      const msg = "Instructions limitées à 5000 caractères";
      setSaveError(msg);
      toast.error(msg);
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        cloudFileUrls: formCloudUrls,
        color: formColor,
        defaultModelId: formModelId,
        description: formDescription,
        icon: formIcon,
        instructions: formInstructions.slice(0, 5000),
        maxTokens: formMaxTokens ? Number(formMaxTokens) : null,
        mcpServerIds: formMcpIds,
        memoryMode: formMemoryMode,
        name: formName,
        pinned: formPinned,
        skillIds: formSkillIds,
        starterPrompts: formStarterPrompts
          .map((p) => p.trim())
          .filter(Boolean)
          .slice(0, 10),
        temperature: formTemperature,
        topP: formTopP,
        welcomeMessage: formWelcomeMessage.trim() || null,
      };
      const url = editingAgent
        ? `/api/agents/${editingAgent.id}`
        : "/api/agents";
      const method = editingAgent ? "PATCH" : "POST";
      const res = await fetch(url, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          extractApiErrorMessage(data) || "Erreur lors de la sauvegarde du bot"
        );
      }
      toast.success(
        editingAgent ? "Bot mis à jour avec succès !" : "Bot créé avec succès !"
      );
      await mutate();
      setIsEditorOpen(false);
    } catch (err: any) {
      const errMsg = err.message || "Erreur inconnue lors de l'enregistrement";
      setSaveError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agentToDelete) {
      return;
    }
    const res = await fetch(`/api/agents/${agentToDelete.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Suppression échouée");
      return;
    }
    toast.success(`Bot "${agentToDelete.name}" supprimé`);
    setAgentToDelete(null);
    await mutate();
    if (activeAgent?.id === agentToDelete.id) {
      clearActiveAgent();
    }
  };

  const handleDuplicate = async (a: Agent) => {
    const res = await fetch(`/api/agents/${a.id}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(extractApiErrorMessage(d) || "Duplication échouée");
      return;
    }
    toast.success(`Copie créée pour "${a.name}"`);
    await mutate();
  };

  const handleActivate = (a: Agent) => {
    setActiveAgent(a);
    toast.success(`Bot activé : ${a.name} — modèle ${a.defaultModelId}`);
  };

  const handleTogglePin = async (a: Agent) => {
    const next = !(a as any).pinned;
    try {
      const res = await fetch(`/api/agents/${a.id}`, {
        body: JSON.stringify({ pinned: next }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Erreur épinglage");
      }
      toast.success(
        next ? `Bot "${a.name}" épinglé` : `Bot "${a.name}" désépinglé`
      );
      await mutate();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const updateStarterPrompt = (idx: number, val: string) =>
    setFormStarterPrompts((prev) => prev.map((p, i) => (i === idx ? val : p)));
  const removeStarterPrompt = (idx: number) =>
    setFormStarterPrompts((prev) => prev.filter((_, i) => i !== idx));
  const addStarterPrompt = () => {
    if (formStarterPrompts.length < 10) {
      setFormStarterPrompts((prev) => [...prev, ""]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <BotAvatar size={36} />
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                  Bots IA
                </h1>
                <p className="text-xs text-muted-foreground">
                  {agents.length}/{agentLimit ?? "∞"} bots • Sélection globale •{" "}
                  <span className="font-mono text-[10px]">
                    Instructions : 5 000 caractères maximum
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Button
            className="h-8 self-start gap-1.5 text-xs font-medium shadow-xs sm:self-auto"
            disabled={isAtAgentLimit}
            onClick={() => handleNewAgent()}
            title={
              isAtAgentLimit
                ? `Limite du forfait atteinte (${agentLimit} bots)`
                : undefined
            }
          >
            <PlusIcon className="size-3.5" />
            <span>Créer un bot</span>
          </Button>
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border/40 sm:border-0 pb-2 sm:pb-0">
            <button
              aria-pressed={activeTab === "agents"}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "agents"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("agents")}
              type="button"
            >
              <BotGlyph className="size-3.5" />
              <span>Mes bots ({agents.length})</span>
            </button>
            <button
              aria-pressed={activeTab === "templates"}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "templates"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("templates")}
              type="button"
            >
              <LayoutGridIcon className="size-3.5" />
              <span>Types de bots ({templates.length})</span>
            </button>
            <button
              aria-pressed={activeTab === "stats"}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "stats"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("stats")}
              type="button"
            >
              <BarChart3Icon className="size-3.5" />
              <span>Statistiques d'utilisation</span>
            </button>
          </div>

          {activeTab === "agents" && (
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  aria-label="Rechercher un bot"
                  className="h-8 pl-8 text-xs bg-muted/40"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un bot..."
                  value={searchQuery}
                />
              </div>
              {activeAgent && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium shrink-0">
                  <AgentIcon
                    color={activeAgent.color}
                    icon={activeAgent.icon}
                    size={14}
                    variant="plain"
                  />{" "}
                  Actif : {activeAgent.name}
                  <button
                    aria-label="Désactiver le bot sélectionné"
                    className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                    onClick={() => clearActiveAgent()}
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {activeTab === "stats" ? (
          <AgentsStats />
        ) : activeTab === "templates" ? (
          <AgentTemplateGrid
            filteredTemplates={filteredTemplates}
            onSelectTemplate={handleNewAgent}
            onTemplateModelChange={setTemplateModel}
            onTemplateQueryChange={setTemplateQuery}
            onTemplateTagChange={setTemplateTag}
            templateModel={templateModel}
            templateModelIds={templateModelIds}
            templateQuery={templateQuery}
            templates={templates}
            templateTag={templateTag}
            templateTags={templateTags}
          />
        ) : (
          <>
            {/* Grille bots utilisateur */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    className="h-48 rounded-2xl border border-border/50 bg-muted/20 animate-pulse p-4"
                    key={i}
                  />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
                <BotAvatar className="mb-4" size={64} />
                <h2 className="text-xl font-bold mb-2">Aucun bot créé</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Parcourez les types de bots prêts à l'emploi ou créez un bot
                  personnalisé : instructions système, modèle, skills, MCP et
                  fichiers.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    className="gap-2 text-xs font-medium"
                    onClick={() => setActiveTab("templates")}
                    variant="outline"
                  >
                    <LayoutGridIcon className="size-4" />
                    Parcourir les modèles
                  </Button>
                  <Button
                    className="gap-2 text-xs font-medium"
                    disabled={isAtAgentLimit}
                    onClick={() => handleNewAgent()}
                  >
                    <PlusIcon className="size-4" />
                    Créer mon premier bot
                  </Button>
                </div>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Aucun bot ne correspond à “{searchQuery}”.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((a) => (
                  <AgentCard
                    agent={a}
                    isActive={activeAgent?.id === a.id}
                    key={a.id}
                    onActivate={handleActivate}
                    onDelete={setAgentToDelete}
                    onDuplicate={handleDuplicate}
                    onEdit={handleEditAgent}
                    onStartChat={handleStartChatWithAgent}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modale Édition / Création de bot */}
      <AgentEditorDialog
        addStarterPrompt={addStarterPrompt}
        cloudFileNames={cloudFileNames}
        editingAgent={editingAgent}
        formCloudUrls={formCloudUrls}
        formColor={formColor}
        formDescription={formDescription}
        formIcon={formIcon}
        formInstructions={formInstructions}
        formMaxTokens={formMaxTokens}
        formMcpIds={formMcpIds}
        formMemoryMode={formMemoryMode}
        formModelId={formModelId}
        formName={formName}
        formPinned={formPinned}
        formSkillIds={formSkillIds}
        formStarterPrompts={formStarterPrompts}
        formTemperature={formTemperature}
        formTopP={formTopP}
        formWelcomeMessage={formWelcomeMessage}
        isCloudPickerOpen={isCloudPickerOpen}
        isSaving={isSaving}
        mcpServers={mcpServers}
        models={models}
        modelsData={modelsData}
        onOpenChange={setIsEditorOpen}
        onSave={handleSave}
        open={isEditorOpen}
        removeStarterPrompt={removeStarterPrompt}
        saveError={saveError}
        setCloudFileNames={setCloudFileNames}
        setFormCloudUrls={setFormCloudUrls}
        setFormColor={setFormColor}
        setFormDescription={setFormDescription}
        setFormIcon={setFormIcon}
        setFormInstructions={setFormInstructions}
        setFormMaxTokens={setFormMaxTokens}
        setFormMcpIds={setFormMcpIds}
        setFormMemoryMode={setFormMemoryMode}
        setFormModelId={setFormModelId}
        setFormName={setFormName}
        setFormPinned={setFormPinned}
        setFormSkillIds={setFormSkillIds}
        setFormTemperature={setFormTemperature}
        setFormTopP={setFormTopP}
        setFormWelcomeMessage={setFormWelcomeMessage}
        setIsCloudPickerOpen={setIsCloudPickerOpen}
        skills={skills}
        updateStarterPrompt={updateStarterPrompt}
      />

      {/* Confirmation de suppression */}
      <AgentDeleteDialog
        agentToDelete={agentToDelete}
        onClose={() => setAgentToDelete(null)}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}
