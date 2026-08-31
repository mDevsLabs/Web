"use client";

import {
  BarChart3Icon,
  BotIcon,
  BrainIcon,
  CheckIcon,
  CloudIcon,
  CopyIcon,
  Edit2Icon,
  MessageSquareIcon,
  MessageSquareTextIcon,
  MoreVerticalIcon,
  PinIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  ThermometerIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { AgentIcon, EMOJI_PRESETS } from "@/components/agents/agent-icon";
import { AGENT_COLORS, AGENT_ICONS } from "@/components/agents/agent-presets";
import { AgentsStats } from "@/components/agents/agents-stats";
import { CloudFilePickerDialog } from "@/components/chat/cloud-file-picker-dialog";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { PageBackButton } from "@/components/chat/page-back-button";
import { MemoryCard } from "@/components/settings/memory-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActiveChat } from "@/hooks/use-active-chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { Agent, AgentTemplate, McpServer, Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AgentsClient() {
  const {
    data: agents = [],
    mutate,
    isLoading,
  } = useSWR<Agent[]>("/api/agents", fetcher);
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
  const { data: modelsData } = useSWR("/api/models", fetcher);
  const models: any[] = modelsData?.models || [];

  const { activeAgent, setActiveAgent, clearActiveAgent } = useActiveChat();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"agents" | "stats">("agents");
  const [editorTab, setEditorTab] = useState<"config" | "playground">("config");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Playground state
  const [playgroundMessages, setPlaygroundMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([]);
  const [playgroundInput, setPlaygroundInput] = useState("");
  const [isPlaygroundLoading, setIsPlaygroundLoading] = useState(false);

  // form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formIcon, setFormIcon] = useState("sparkles");
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [formIconType, setFormIconType] = useState<"lucide" | "emoji">(
    "lucide"
  );
  const [formColor, setFormColor] = useState("#6366f1");
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
  // Map url -> nom affiché (pour les fichiers sélectionnés via cloud picker)
  const [cloudFileNames, setCloudFileNames] = useState<Record<string, string>>(
    {}
  );

  const handleStartChatWithAgent = useCallback(
    (a: Agent) => {
      setActiveAgent(a);
      toast.success(`Agent activé : ${a.name}`);
      router.push("/");
    },
    [router, setActiveAgent]
  );

  const handleSendPlaygroundMessage = async () => {
    const text = playgroundInput.trim();
    if (!text || isPlaygroundLoading) {
      return;
    }

    const userMsg = {
      content: text,
      id: `user-${Date.now()}`,
      role: "user" as const,
    };
    const newMessages = [...playgroundMessages, userMsg];
    setPlaygroundMessages(newMessages);
    setPlaygroundInput("");
    setIsPlaygroundLoading(true);

    try {
      // Envoyer au endpoint chat avec les instructions en direct
      const res = await fetch("/api/chat", {
        body: JSON.stringify({
          agentId: editingAgent?.id || null,
          customInstructions: formInstructions,
          id: `playground-${Date.now()}`,
          isGhostMode: true,
          message: {
            content: text,
            id: `msg-${Date.now()}`,
            role: "user",
          },
          selectedChatModel: formModelId,
          selectedVisibilityType: "private",
          temperatureOverride: formTemperature,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: réponse du serveur`);
      }

      // Lecture du stream de réponse (format text/stream)
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = `assistant-${Date.now()}`;

      setPlaygroundMessages((prev) => [
        ...prev,
        { content: "", id: assistantId, role: "assistant" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          // Filtrer et accumuler le texte (les chunks de stream ai-sdk commencent souvent par 0:"texte")
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith('0:"')) {
              try {
                const parsed = JSON.parse(line.slice(2));
                assistantText += parsed;
              } catch {
                // simple concaténation brute si échec de parsing
                assistantText += line.slice(3, -1);
              }
            } else if (!line.startsWith("d:") && !line.startsWith("e:") && !line.startsWith("2:") && line.trim()) {
              // Nettoyage basique pour formats directs
              const clean = line.replace(/^[0-9]+:/, "").replace(/^"/, "").replace(/"$/, "");
              if (clean) {
                assistantText += clean;
              }
            }
          }

          setPlaygroundMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantText || "..." } : m
            )
          );
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur dans le playground");
      setPlaygroundMessages((prev) => [
        ...prev,
        {
          content: `⚠️ Erreur lors du test de l'agent : ${err.message || "inconnue"}`,
          id: `err-${Date.now()}`,
          role: "assistant",
        },
      ]);
    } finally {
      setIsPlaygroundLoading(false);
    }
  };

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

  const handleNewAgent = useCallback((template?: AgentTemplate) => {
    setEditingAgent(null);
    setFormName(template?.name ?? "");
    setFormDescription(template?.description ?? "");
    setFormInstructions(template?.instructions ?? "");
    setFormIcon(template?.icon ?? "sparkles");
    setFormEmoji((template as any)?.emoji ?? null);
    setFormIconType((template as any)?.emoji ? "emoji" : "lucide");
    setFormColor(template?.color ?? "#6366f1");
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
    setEditorTab("config");
    setPlaygroundMessages([]);
    setPlaygroundInput("");
    setIsEditorOpen(true);
  }, []);

  const handleEditAgent = (a: Agent) => {
    setEditingAgent(a);
    setFormName(a.name);
    setFormDescription(a.description || "");
    setFormInstructions(a.instructions || "");
    setFormIcon(a.icon || "sparkles");
    setFormEmoji((a as any).emoji || null);
    setFormIconType((a as any).emoji ? "emoji" : "lucide");
    setFormColor(a.color || "#6366f1");
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
    setEditorTab("config");
    setPlaygroundMessages([]);
    setPlaygroundInput("");
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!formName.trim()) {
      const msg = "Nom de l'agent requis";
      setSaveError(msg);
      toast.error(msg);
      return;
    }
    if (!formInstructions.trim()) {
      const msg =
        "Instructions requises pour définir le comportement de l'agent";
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
        emoji: formIconType === "emoji" ? formEmoji || null : null,
        icon: formIconType === "lucide" ? formIcon : "sparkles",
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
          data.error || "Erreur lors de la sauvegarde de l'agent"
        );
      }
      toast.success(
        editingAgent
          ? "Agent mis à jour avec succès !"
          : "Agent créé avec succès !"
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
    toast.success(`Agent "${agentToDelete.name}" supprimé`);
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
      toast.error(d.error || "Duplication échouée");
      return;
    }
    toast.success(`Copie créée pour "${a.name}"`);
    await mutate();
  };

  const handleActivate = (a: Agent) => {
    setActiveAgent(a);
    toast.success(
      `Agent activé : ${a.emoji ? `${a.emoji} ` : ""}${a.name} — modèle ${a.defaultModelId}`
    );
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
        next ? `Agent "${a.name}" épinglé` : `Agent "${a.name}" désépinglé`
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <BotIcon className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                  Agents IA
                </h1>
                <p className="text-xs text-muted-foreground">
                  {agents.length}/10 agents • Sélection globale •{" "}
                  <span className="font-mono text-[10px]">
                    5000c max instructions
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Button
            className="h-8 gap-1.5 text-xs font-medium shadow-xs"
            disabled={agents.length >= 10}
            onClick={() => handleNewAgent()}
          >
            <PlusIcon className="size-3.5" />
            <span>Créer un agent</span>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 border-b border-border/40 sm:border-0 pb-2 sm:pb-0">
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "agents"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("agents")}
              type="button"
            >
              <BotIcon className="size-3.5" />
              <span>Mes agents ({agents.length})</span>
            </button>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
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
                  className="h-8 pl-8 text-xs bg-muted/40"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un agent..."
                  value={searchQuery}
                />
              </div>
              {activeAgent && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium shrink-0">
                  <AgentIcon
                    color={activeAgent.color}
                    emoji={activeAgent.emoji}
                    icon={activeAgent.icon}
                    size={14}
                    variant="plain"
                  />{" "}
                  Actif : {activeAgent.name}
                  <button
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
        ) : (
          <>
            {/* Templates */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Modèles d'agents — choisir pour démarrer
              </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {templates.map((t) => (
              <button
                className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer"
                key={t.id}
                onClick={() => handleNewAgent(t)}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className="size-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: t.color || "#6366f1" }}
                  >
                    <AgentIcon
                      emoji={(t as any).emoji}
                      icon={t.icon}
                      size={16}
                      variant="plain"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Utiliser +
                  </span>
                </div>
                <span className="font-semibold text-xs text-foreground mb-1 truncate">
                  {t.name}
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-2">
                  {t.description}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 truncate">
                  {t.defaultModelId}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grille agents utilisateur */}
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
            <div className="size-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4">
              <BotIcon className="size-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Aucun agent créé</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choisissez un modèle ci-dessus ou créez un agent personnalisé avec
              instructions, skills, MCP et fichiers.
            </p>
            <Button
              className="gap-2 text-xs font-medium"
              onClick={() => handleNewAgent()}
            >
              <PlusIcon className="size-4" />
              Créer mon premier agent
            </Button>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Aucun agent ne correspond à “{searchQuery}”.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((a) => (
              <div
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
                  activeAgent?.id === a.id
                    ? "border-indigo-500/40 ring-1 ring-indigo-500/20 bg-indigo-500/[0.03]"
                    : "border-border/60 hover:border-border"
                )}
                key={a.id}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: a.color || "#6366f1" }}
                    >
                      <AgentIcon
                        emoji={(a as any).emoji}
                        icon={a.icon}
                        size={20}
                        variant="plain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                        {a.name}{" "}
                        {(a as any).pinned && (
                          <PinIcon className="size-3 text-indigo-500 shrink-0" />
                        )}{" "}
                        {activeAgent?.id === a.id && (
                          <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                            Actif
                          </span>
                        )}
                      </h3>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {a.description || "Aucune description"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="size-7 p-0 text-muted-foreground hover:text-foreground"
                        variant="ghost"
                      >
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs"
                        onClick={() => handleActivate(a)}
                      >
                        <CheckIcon className="size-3.5" />
                        Activer (global)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs"
                        onClick={() => handleTogglePin(a)}
                      >
                        <PinIcon className="size-3.5" />
                        {(a as any).pinned ? "Désépingler" : "Épingler"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs"
                        onClick={() => handleEditAgent(a)}
                      >
                        <Edit2Icon className="size-3.5" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs"
                        onClick={() => handleDuplicate(a)}
                      >
                        <CopyIcon className="size-3.5" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                        onClick={() => setAgentToDelete(a)}
                      >
                        <Trash2Icon className="size-3.5" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex-1 mb-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 overflow-hidden">
                  <p className="text-xs text-muted-foreground/90 line-clamp-3 font-mono break-words leading-relaxed">
                    {a.instructions}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-[11px]">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                      {(a as any).defaultModelId}
                    </span>
                    {(a.skillIds as string[] | null)?.length ? (
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        Skills {(a.skillIds as any).length}
                      </span>
                    ) : null}
                    {(a.mcpServerIds as string[] | null)?.length ? (
                      <span className="bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">
                        MCP {(a.mcpServerIds as any).length}
                      </span>
                    ) : null}
                    {(a.cloudFileUrls as string[] | null)?.length ? (
                      <span className="bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                        Fichiers {(a.cloudFileUrls as any).length}
                      </span>
                    ) : null}
                    {((a as any).temperature !== null ||
                      (a as any).topP !== null ||
                      (a as any).maxTokens !== null) && (
                      <span className="bg-cyan-500/10 text-cyan-600 px-1.5 py-0.5 rounded">
                        Params modèle
                      </span>
                    )}
                    {(a as any).starterPrompts?.length ? (
                      <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">
                        Démarrage {(a as any).starterPrompts.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="h-7 text-xs flex-1 gap-1.5"
                      onClick={() => handleStartChatWithAgent(a)}
                      size="sm"
                      variant="default"
                    >
                      <MessageSquareTextIcon className="size-3.5" />
                      <span>Discuter</span>
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={() => handleActivate(a)}
                      size="sm"
                      variant={activeAgent?.id === a.id ? "secondary" : "outline"}
                    >
                      {activeAgent?.id === a.id ? "Activé" : "Activer"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Dialog éditeur */}
      <Dialog onOpenChange={setIsEditorOpen} open={isEditorOpen}>
        <DialogContent className="max-w-5xl sm:max-w-4xl lg:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle>
                  {editingAgent ? "Modifier l'agent" : "Créer un agent"}
                </DialogTitle>
                <DialogDescription>
                  Instructions ≤5000c, icône/emoji, paramètres du modèle, skills, MCP et fichiers.
                </DialogDescription>
              </div>
              <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5 text-xs self-start sm:self-auto shrink-0">
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer",
                    editorTab === "config"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setEditorTab("config")}
                  type="button"
                >
                  <SlidersHorizontalIcon className="size-3.5" />
                  <span>Configuration</span>
                </button>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer",
                    editorTab === "playground"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setEditorTab("playground")}
                  type="button"
                >
                  <PlayIcon className="size-3.5 text-indigo-500" />
                  <span>Test en direct (Chat)</span>
                </button>
              </div>
            </div>
          </DialogHeader>

          {editorTab === "playground" ? (
            <div className="flex flex-col h-[520px] rounded-2xl border border-border/60 bg-muted/10 overflow-hidden my-2">
              {/* Header du playground */}
              <div className="p-3 bg-card border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="size-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0 shadow-xs"
                    style={{ backgroundColor: formColor }}
                  >
                    <AgentIcon
                      emoji={formIconType === "emoji" ? formEmoji : null}
                      icon={formIconType === "lucide" ? formIcon : "sparkles"}
                      size={14}
                      variant="plain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {formName || "Agent en cours de configuration"}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Modèle : {formModelId} • Temp : {formTemperature}
                    </span>
                  </div>
                </div>
                <Button
                  className="h-6 text-[10px]"
                  onClick={() => setPlaygroundMessages([])}
                  size="sm"
                  variant="ghost"
                >
                  Effacer
                </Button>
              </div>

              {/* Messages du playground */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {playgroundMessages.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-2">
                    <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <SparklesIcon className="size-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Testez votre agent en conditions réelles
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Discutez avec lui pour vérifier qu'il suit fidèlement vos instructions système et réglages avant d'enregistrer.
                    </p>
                    {formStarterPrompts.filter(Boolean).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                        {formStarterPrompts.filter(Boolean).map((p, i) => (
                          <button
                            className="text-[11px] bg-card border border-border/50 hover:border-primary/50 text-foreground px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            key={i}
                            onClick={() => {
                              setPlaygroundInput(p);
                            }}
                            type="button"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  playgroundMessages.map((m) => (
                    <div
                      className={cn(
                        "flex gap-2.5 max-w-[85%]",
                        m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                      key={m.id}
                    >
                      <div
                        className={cn(
                          "size-6 rounded-md flex items-center justify-center text-[10px] shrink-0",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "text-white"
                        )}
                        style={m.role === "assistant" ? { backgroundColor: formColor } : undefined}
                      >
                        {m.role === "user" ? (
                          "Vous"
                        ) : (
                          <AgentIcon
                            emoji={formIconType === "emoji" ? formEmoji : null}
                            icon={formIconType === "lucide" ? formIcon : "sparkles"}
                            size={12}
                            variant="plain"
                          />
                        )}
                      </div>
                      <div
                        className={cn(
                          "p-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-card border border-border/50 text-foreground rounded-tl-xs shadow-xs"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {isPlaygroundLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                    <span className="size-2 rounded-full bg-primary animate-ping" />
                    L'agent formule sa réponse...
                  </div>
                )}
              </div>

              {/* Saisie du playground */}
              <div className="p-2.5 bg-card border-t border-border/50 flex items-center gap-2">
                <Input
                  className="h-9 text-xs"
                  disabled={isPlaygroundLoading}
                  onChange={(e) => setPlaygroundInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPlaygroundMessage();
                    }
                  }}
                  placeholder="Posez une question de test à votre agent..."
                  value={playgroundInput}
                />
                <Button
                  className="h-9 px-3 gap-1.5 text-xs"
                  disabled={!playgroundInput.trim() || isPlaygroundLoading}
                  onClick={handleSendPlaygroundMessage}
                  type="button"
                >
                  <SendIcon className="size-3.5" />
                  <span>Tester</span>
                </Button>
              </div>
            </div>
          ) : (
          <form className="flex flex-col gap-4 py-2" onSubmit={handleSave}>
            {saveError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
                <TriangleAlertIcon className="size-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Colonne formulaire */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Nom *</Label>
                    <Input
                      maxLength={100}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Assistant Code"
                      required
                      value={formName}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Couleur du badge
                    </Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {AGENT_COLORS.map((c) => (
                        <button
                          className={cn(
                            "size-6 rounded-full transition-transform",
                            formColor === c &&
                              "ring-2 ring-foreground scale-110"
                          )}
                          key={c}
                          onClick={() => setFormColor(c)}
                          style={{ backgroundColor: c }}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Description courte
                  </Label>
                  <Input
                    maxLength={500}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Rôle ou cas d'usage résumé..."
                    value={formDescription}
                  />
                </div>

                {/* Toggle icône / emoji */}
                <div className="space-y-2 rounded-xl border border-border/50 p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Icône / Emoji — affiché partout (sidebar, @, cartes,
                      dropdown)
                    </Label>
                    <div className="flex items-center rounded-lg border border-border/50 bg-background p-0.5 text-xs">
                      <button
                        className={cn(
                          "px-2.5 py-1 rounded-md font-medium",
                          formIconType === "lucide"
                            ? "bg-foreground text-background"
                            : "text-muted-foreground"
                        )}
                        onClick={() => setFormIconType("lucide")}
                        type="button"
                      >
                        Icône
                      </button>
                      <button
                        className={cn(
                          "px-2.5 py-1 rounded-md font-medium",
                          formIconType === "emoji"
                            ? "bg-foreground text-background"
                            : "text-muted-foreground"
                        )}
                        onClick={() => setFormIconType("emoji")}
                        type="button"
                      >
                        Emoji Unicode
                      </button>
                    </div>
                  </div>
                  {formIconType === "lucide" ? (
                    <div className="grid grid-cols-5 gap-2">
                      {AGENT_ICONS.map((o) => (
                        <button
                          className={cn(
                            "flex w-full flex-col items-center gap-1 p-2 rounded-xl border text-xs",
                            formIcon === o.id
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:bg-muted"
                          )}
                          key={o.id}
                          onClick={() => setFormIcon(o.id)}
                          type="button"
                        >
                          <span
                            className="size-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: formColor }}
                          >
                            <AgentIcon icon={o.id} size={16} variant="plain" />
                          </span>
                          <span className="text-[10px]">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {EMOJI_PRESETS.map((e) => (
                          <button
                            className={cn(
                              "size-9 rounded-xl border flex items-center justify-center text-lg hover:bg-muted",
                              formEmoji === e
                                ? "border-primary bg-primary/10 ring-1 ring-primary"
                                : "border-border/50"
                            )}
                            key={e}
                            onClick={() => setFormEmoji(e)}
                            style={
                              formEmoji === e
                                ? { backgroundColor: `${formColor}18` }
                                : {}
                            }
                            type="button"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-8 text-sm max-w-[140px]"
                          maxLength={10}
                          onChange={(e) =>
                            setFormEmoji(e.target.value.slice(0, 10) || null)
                          }
                          placeholder="Colle un emoji (ex: 🤖)"
                          value={formEmoji || ""}
                        />
                        {formEmoji && (
                          <span
                            className="size-8 rounded-lg flex items-center justify-center text-white text-lg"
                            style={{ backgroundColor: formColor }}
                          >
                            {formEmoji}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Utilise un emoji Unicode (1–4 glyphes). L'emoji remplace
                        l'icône Lucide partout, la couleur reste en fond de
                        badge.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    Instructions système *{" "}
                    <span
                      className={cn(
                        "text-[11px] font-normal",
                        formInstructions.length > 4800
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {formInstructions.length}/5000
                    </span>
                  </Label>
                  <Textarea
                    className="min-h-[140px] font-mono text-xs leading-relaxed"
                    maxLength={5000}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    placeholder="Tu es un expert en... Tes réponses doivent toujours respecter..."
                    required
                    value={formInstructions}
                  />
                </div>

                {/* Mémoire de l'agent */}
                <div className="space-y-2 p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <BrainIcon className="size-3.5 text-sky-600 dark:text-sky-400" />
                    Mémoire de l'agent
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={cn(
                        "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs",
                        formMemoryMode === "global"
                          ? "border-sky-500/50 bg-sky-500/10"
                          : "border-border/40 hover:bg-muted/30"
                      )}
                    >
                      <input
                        checked={formMemoryMode === "global"}
                        className="mt-0.5 size-3.5 accent-sky-600"
                        name="agent-memory-mode"
                        onChange={() => setFormMemoryMode("global")}
                        type="radio"
                      />
                      <span className="flex flex-col">
                        <span className="font-semibold">Mémoire globale</span>
                        <span className="text-[11px] text-muted-foreground">
                          Partage la mémoire de vos Préférences IA
                        </span>
                      </span>
                    </label>
                    <label
                      className={cn(
                        "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs",
                        formMemoryMode === "custom"
                          ? "border-sky-500/50 bg-sky-500/10"
                          : "border-border/40 hover:bg-muted/30"
                      )}
                    >
                      <input
                        checked={formMemoryMode === "custom"}
                        className="mt-0.5 size-3.5 accent-sky-600"
                        name="agent-memory-mode"
                        onChange={() => setFormMemoryMode("custom")}
                        type="radio"
                      />
                      <span className="flex flex-col">
                        <span className="font-semibold">Mémoire dédiée</span>
                        <span className="text-[11px] text-muted-foreground">
                          Mémoire propre à cet agent uniquement
                        </span>
                      </span>
                    </label>
                  </div>
                  {formMemoryMode === "custom" &&
                    (editingAgent ? (
                      <MemoryCard agentId={editingAgent.id} />
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Enregistrez d'abord l'agent pour gérer sa mémoire
                        dédiée.
                      </p>
                    ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Modèle IA par défaut — à l'activation, le modèle switch
                    automatiquement
                  </Label>
                  <ModelSelectorCompact
                    capabilities={modelsData?.capabilities}
                    fallbackModels={models}
                    modal
                    onModelChange={setFormModelId}
                    selectedModelId={formModelId}
                    variant="block"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Ce modèle sera appliqué automatiquement dès que l'agent est
                    activé.
                  </span>
                </div>

                {/* Paramètres du modèle */}
                <div className="space-y-3 rounded-xl border border-border/50 p-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontalIcon className="size-4 text-primary" />
                    <Label className="text-xs font-semibold">
                      Paramètres du modèle
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center justify-between">
                        Température{" "}
                        <span className="font-mono text-muted-foreground">
                          {formTemperature.toFixed(1)}
                        </span>
                      </Label>
                      <input
                        className="w-full accent-primary"
                        max={2}
                        min={0}
                        onChange={(e) =>
                          setFormTemperature(Number(e.target.value))
                        }
                        step={0.1}
                        type="range"
                        value={formTemperature}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center justify-between">
                        Top P{" "}
                        <span className="font-mono text-muted-foreground">
                          {formTopP.toFixed(2)}
                        </span>
                      </Label>
                      <input
                        className="w-full accent-primary"
                        max={1}
                        min={0}
                        onChange={(e) => setFormTopP(Number(e.target.value))}
                        step={0.05}
                        type="range"
                        value={formTopP}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Max tokens{" "}
                        <span className="text-muted-foreground font-normal">
                          (vide = défaut)
                        </span>
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        max={1_000_000}
                        min={1}
                        onChange={(e) => setFormMaxTokens(e.target.value)}
                        placeholder="4096"
                        step={1}
                        type="number"
                        value={formMaxTokens}
                      />
                    </div>
                  </div>
                </div>

                {/* Messages de démarrage */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MessageSquareTextIcon className="size-3.5 text-primary" />
                    Messages de démarrage (max 10)
                  </Label>
                  {formStarterPrompts.map((p, idx) => (
                    <div className="flex items-center gap-2" key={idx}>
                      <Input
                        className="h-8 text-xs"
                        maxLength={500}
                        onChange={(e) =>
                          updateStarterPrompt(idx, e.target.value)
                        }
                        placeholder={`Ex: Peux-tu m'aider à... (${idx + 1})`}
                        value={p}
                      />
                      <Button
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeStarterPrompt(idx)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    className="h-7 text-xs"
                    disabled={formStarterPrompts.length >= 10}
                    onClick={addStarterPrompt}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PlusIcon className="size-3 mr-1" />
                    Ajouter un message
                  </Button>
                </div>

                {/* Message de bienvenue */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Message de bienvenue
                  </Label>
                  <Textarea
                    className="min-h-[70px] text-xs"
                    maxLength={2000}
                    onChange={(e) => setFormWelcomeMessage(e.target.value)}
                    placeholder="Bonjour ! Je suis ton assistant dédié. Comment puis-je t'aider ?"
                    value={formWelcomeMessage}
                  />
                </div>

                {/* Épingler */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <PinIcon className="size-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">
                        Épingler cet agent
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        L'agent épinglé apparaît en tête de liste
                      </span>
                    </div>
                  </div>
                  <input
                    checked={formPinned}
                    className="size-4 accent-primary"
                    onChange={(e) => setFormPinned(e.target.checked)}
                    type="checkbox"
                  />
                </label>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Skills associées (max 10)
                  </Label>
                  {skills.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Aucune skill — crée-en dans /skills
                    </span>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 bg-muted/10">
                      {skills.map((s) => (
                        <label
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs",
                            formSkillIds.includes(s.id)
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/30 hover:bg-muted/30"
                          )}
                          key={s.id}
                        >
                          <input
                            checked={formSkillIds.includes(s.id)}
                            className="size-4 rounded border-border accent-primary"
                            onChange={(e) =>
                              e.target.checked
                                ? setFormSkillIds((prev) => [...prev, s.id])
                                : setFormSkillIds((prev) =>
                                    prev.filter((id) => id !== s.id)
                                  )
                            }
                            type="checkbox"
                          />
                          <span className="truncate">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Serveurs MCP (max 10)
                  </Label>
                  {mcpServers.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Aucun serveur MCP — configure dans /mcp
                    </span>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 bg-muted/10">
                      {mcpServers.map((m) => (
                        <label
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs",
                            formMcpIds.includes(m.id)
                              ? "border-purple-500/40 bg-purple-500/5"
                              : "border-border/30 hover:bg-muted/30"
                          )}
                          key={m.id}
                        >
                          <input
                            checked={formMcpIds.includes(m.id)}
                            className="size-4 rounded border-border accent-primary"
                            onChange={(e) =>
                              e.target.checked
                                ? setFormMcpIds((prev) => [...prev, m.id])
                                : setFormMcpIds((prev) =>
                                    prev.filter((id) => id !== m.id)
                                  )
                            }
                            type="checkbox"
                          />
                          <span className="truncate">{m.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {m.transport}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <CloudIcon className="size-3.5 text-muted-foreground" />
                      Fichiers (max 10)
                    </span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {formCloudUrls.length}/10
                    </span>
                  </Label>
                  <Button
                    className="w-full h-8 text-[12px] border border-dashed border-border/60 bg-muted/40 hover:bg-muted/70 text-muted-foreground"
                    disabled={formCloudUrls.length >= 10}
                    onClick={() => setIsCloudPickerOpen(true)}
                    type="button"
                    variant="ghost"
                  >
                    <CloudIcon className="size-3.5 mr-1.5" />
                    Depuis la bibliothèque
                  </Button>
                  {formCloudUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {formCloudUrls.map((url, i) => (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] border border-border/40 max-w-[220px]"
                          key={i}
                        >
                          <CloudIcon className="size-2.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {cloudFileNames[url] || url.split("/").pop() || url}
                          </span>
                          <button
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                            onClick={() => {
                              setFormCloudUrls((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              );
                              setCloudFileNames((prev) => {
                                const copy = { ...prev };
                                delete copy[url];
                                return copy;
                              });
                            }}
                            type="button"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Dialog cloud picker */}
                <CloudFilePickerDialog
                  onOpenChange={setIsCloudPickerOpen}
                  onSelectAttachments={(attachments) => {
                    const toAdd = attachments.filter(
                      (a) => !formCloudUrls.includes(a.url)
                    );
                    const remaining = 10 - formCloudUrls.length;
                    const slice = toAdd.slice(0, remaining);
                    if (slice.length > 0) {
                      setFormCloudUrls((prev) => [
                        ...prev,
                        ...slice.map((a) => a.url),
                      ]);
                      setCloudFileNames((prev) => {
                        const copy = { ...prev };
                        for (const a of slice) {
                          copy[a.url] = a.name;
                        }
                        return copy;
                      });
                    }
                  }}
                  open={isCloudPickerOpen}
                />
              </div>

              {/* Colonne aperçu en direct */}
              <div className="lg:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Aperçu en direct
                </Label>
                <div
                  className={cn(
                    "mt-2 rounded-2xl border bg-card p-4 transition-colors",
                    formPinned &&
                      "border-indigo-500/40 ring-1 ring-indigo-500/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: formColor }}
                      >
                        <AgentIcon
                          emoji={formIconType === "emoji" ? formEmoji : null}
                          icon={
                            formIconType === "lucide" ? formIcon : "sparkles"
                          }
                          size={20}
                          variant="plain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                          {formName || "Nom de l'agent"}{" "}
                          {formPinned && (
                            <PinIcon className="size-3 text-indigo-500 shrink-0" />
                          )}
                        </h3>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {formDescription || "Aucune description"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 overflow-hidden">
                    <p className="text-xs text-muted-foreground/90 line-clamp-3 font-mono break-words leading-relaxed">
                      {formInstructions || "Instructions système..."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-[11px]">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                        {formModelId}
                      </span>
                      {formSkillIds.length ? (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          Skills {formSkillIds.length}
                        </span>
                      ) : null}
                      {formMcpIds.length ? (
                        <span className="bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">
                          MCP {formMcpIds.length}
                        </span>
                      ) : null}
                      {formCloudUrls.length ? (
                        <span className="bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                          Fichiers {formCloudUrls.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <ThermometerIcon className="size-3 text-cyan-600" /> temp{" "}
                      {formTemperature.toFixed(1)} · topP {formTopP.toFixed(2)}
                      {formMaxTokens ? ` · max ${formMaxTokens}` : ""}
                    </div>
                    {formWelcomeMessage && (
                      <p className="text-[11px] italic text-muted-foreground line-clamp-2">
                        💬 {formWelcomeMessage}
                      </p>
                    )}
                    {formStarterPrompts.filter(Boolean).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formStarterPrompts
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((p, i) => (
                            <span
                              className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-full truncate max-w-full"
                              key={i}
                            >
                              {p}
                            </span>
                          ))}
                        {formStarterPrompts.filter(Boolean).length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{formStarterPrompts.filter(Boolean).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setIsEditorOpen(false)}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving
                  ? "Enregistrement..."
                  : editingAgent
                    ? "Mettre à jour"
                    : "Créer l'agent"}
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => !open && setAgentToDelete(null)}
        open={Boolean(agentToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet agent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement l'agent "
              {agentToDelete?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
