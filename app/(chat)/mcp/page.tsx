"use client";

import {
  ActivityIcon,
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CpuIcon,
  Edit2Icon,
  KeyIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TerminalIcon,
  Trash2Icon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
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
import { Badge } from "@/components/ui/badge";
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
import type { McpLog, McpServer } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PRESET_TEMPLATES = [
  {
    authType: "bearer",
    description: "Interagir avec les dépôts, issues, pull requests et commits",
    icon: "github",
    name: "GitHub MCP",
    requireApproval: "write_only",
    transport: "sse",
    url: "https://mcp-github-server.example.com/sse",
  },
  {
    authType: "none",
    command: "npx",
    description:
      "Interroger et manipuler une base de données PostgreSQL en toute sécurité",
    icon: "database",
    name: "PostgreSQL Database",
    requireApproval: "write_only",
    transport: "stdio",
  },
  {
    authType: "none",
    command: "npx",
    description:
      "Lecture et écriture sécurisée dans un répertoire de fichiers local",
    icon: "folder",
    name: "Filesystem Local",
    requireApproval: "write_only",
    transport: "stdio",
  },
  {
    authType: "none",
    description:
      "Effectuer des requêtes HTTP GET et POST vers des API externes",
    icon: "globe",
    name: "Fetch Web Server",
    requireApproval: "always_allow",
    transport: "http",
    url: "https://mcp-fetch.example.com/api",
  },
];

export default function McpPage() {
  const {
    data,
    error,
    isLoading,
    mutate: mutateServers,
  } = useSWR<{
    servers: McpServer[];
    stats: { servers: number; totalCalls: number };
  }>("/api/mcp", fetcher);

  const { data: logs = [], mutate: mutateLogs } = useSWR<McpLog[]>(
    "/api/mcp/logs",
    fetcher,
    { refreshInterval: 5000 }
  );

  const servers = data?.servers ?? [];
  const stats = data?.stats ?? { servers: 0, totalCalls: 0 };

  const [activeTab, setActiveTab] = useState<"servers" | "tutorial" | "logs">(
    "servers"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [serverToDelete, setSkillToDelete] = useState<McpServer | null>(null);
  const [isInspectingTools, setIsInspectingTools] = useState<McpServer | null>(
    null
  );

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTransport, setFormTransport] = useState<
    "sse" | "http" | "stdio" | "websocket"
  >("sse");
  const [formUrl, setFormUrl] = useState("");
  const [formCommand, setFormCommand] = useState("");
  const [formArgs, setFormArgs] = useState("");
  const [formAuthType, setFormAuthType] = useState<
    "none" | "bearer" | "basic" | "oauth2" | "custom_headers"
  >("none");
  const [formToken, setFormToken] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formHeaders, setFormHeaders] = useState("");
  const [formRequireApproval, setFormRequireApproval] = useState<
    "always_allow" | "ask_permission" | "write_only"
  >("write_only");

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    message: string;
    success: boolean;
    toolsCount: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ouvrir modal pour nouveau serveur
  const handleNewServer = (template?: (typeof PRESET_TEMPLATES)[0]) => {
    setEditingServer(null);
    setTestResult(null);
    setFormName(template?.name ?? "");
    setFormDescription(template?.description ?? "");
    setFormTransport((template?.transport as any) ?? "sse");
    setFormUrl(template?.url ?? "");
    setFormCommand(template?.command ?? "");
    setFormArgs("");
    setFormAuthType((template?.authType as any) ?? "none");
    setFormToken("");
    setFormUsername("");
    setFormPassword("");
    setFormHeaders("");
    setFormRequireApproval((template?.requireApproval as any) ?? "write_only");
    setIsServerModalOpen(true);
  };

  // Ouvrir modal pour modifier serveur
  const handleEditServer = (s: McpServer) => {
    setEditingServer(s);
    setTestResult(null);
    setFormName(s.name);
    setFormDescription(s.description ?? "");
    setFormTransport((s.transport as any) ?? "sse");
    setFormUrl(s.url ?? "");
    setFormCommand(s.command ?? "");
    setFormArgs(Array.isArray(s.args) ? (s.args as string[]).join(" ") : "");
    setFormAuthType((s.authType as any) ?? "none");
    setFormToken((s.authConfig as any)?.token ?? "");
    setFormUsername((s.authConfig as any)?.username ?? "");
    setFormPassword((s.authConfig as any)?.password ?? "");
    setFormHeaders(
      s.headers && Object.keys(s.headers).length > 0
        ? JSON.stringify(s.headers, null, 2)
        : ""
    );
    setFormRequireApproval((s.requireApproval as any) ?? "write_only");
    setIsServerModalOpen(true);
  };

  // Tester la connexion
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    let parsedHeaders = {};
    if (formHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(formHeaders);
      } catch {
        toast.error("Format JSON invalide pour les en-têtes");
        setIsTesting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/mcp/test", {
        body: JSON.stringify({
          args: formArgs ? formArgs.split(" ").filter(Boolean) : [],
          authConfig: {
            password: formPassword,
            token: formToken,
            username: formUsername,
          },
          authType: formAuthType,
          command: formCommand,
          headers: parsedHeaders,
          name: formName || "Test Server",
          transport: formTransport,
          url: formUrl,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      setTestResult({
        message: err.message ?? "Erreur lors du test",
        success: false,
        toolsCount: 0,
      });
      toast.error("Échec du test de connexion");
    } finally {
      setIsTesting(false);
    }
  };

  // Enregistrer le serveur
  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Le nom du serveur est obligatoire");
      return;
    }
    if (formTransport !== "stdio" && !formUrl.trim()) {
      toast.error("L'URL du serveur MCP est requise");
      return;
    }
    if (formTransport === "stdio" && !formCommand.trim()) {
      toast.error("La commande stdio est requise");
      return;
    }

    let parsedHeaders = {};
    if (formHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(formHeaders);
      } catch {
        toast.error("Format JSON invalide pour les en-têtes");
        return;
      }
    }

    setIsSaving(true);
    const payload = {
      args: formArgs ? formArgs.split(" ").filter(Boolean) : [],
      authConfig: {
        password: formPassword,
        token: formToken,
        username: formUsername,
      },
      authType: formAuthType,
      command: formCommand,
      description: formDescription,
      headers: parsedHeaders,
      name: formName,
      requireApproval: formRequireApproval,
      transport: formTransport,
      url: formUrl,
    };

    try {
      if (editingServer) {
        const res = await fetch(`/api/mcp/${editingServer.id}`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!res.ok) {
          throw new Error("Erreur de modification");
        }
        toast.success("Serveur MCP mis à jour ! 🔌✨");
      } else {
        const res = await fetch("/api/mcp", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Erreur de création");
        }
        toast.success("Serveur MCP connecté et enregistré ! 🚀");
      }

      await mutateServers();
      setIsServerModalOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Bascule activation rapide
  const handleToggleEnabled = async (s: McpServer) => {
    try {
      await fetch(`/api/mcp/${s.id}`, {
        body: JSON.stringify({ toggleEnabled: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      toast.success(
        s.isEnabled
          ? `Serveur "${s.name}" désactivé`
          : `Serveur "${s.name}" activé ! 🟢`
      );
      await mutateServers();
    } catch {
      toast.error("Impossible de basculer l'état du serveur");
    }
  };

  // Rafraîchir les outils
  const handleRefreshTools = async (s: McpServer) => {
    try {
      toast.info(`Synchronisation des outils pour ${s.name}...`);
      const res = await fetch(`/api/mcp/${s.id}`, {
        body: JSON.stringify({ refreshTools: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors du rafraîchissement");
      }
      toast.success(data.message ?? "Outils synchronisés avec succès !");
      await mutateServers();
    } catch (err: any) {
      toast.error(err.message ?? "Impossible de rafraîchir les outils");
    }
  };

  // Suppression
  const handleDeleteServer = async () => {
    if (!serverToDelete) {
      return;
    }
    try {
      const res = await fetch(`/api/mcp/${serverToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Erreur de suppression");
      }
      toast.success(`Serveur "${serverToDelete.name}" supprimé`);
      setSkillToDelete(null);
      await mutateServers();
    } catch (err: any) {
      toast.error(err.message ?? "Impossible de supprimer le serveur");
    }
  };

  // Filtrage des serveurs
  const filteredServers = useMemo(
    () =>
      servers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          s.transport.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [servers, searchQuery]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CpuIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                    Model Context Protocol (MCP)
                  </h1>
                  <Badge
                    className="text-[10px] font-semibold"
                    variant="secondary"
                  >
                    Standard Anthropic / Open Protocol
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connectez vos bases de données, APIs et outils locaux
                  directement à l'IA
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-8 gap-1.5 text-xs font-medium shadow-xs"
              onClick={() => handleNewServer()}
            >
              <PlusIcon className="size-3.5" />
              <span>Ajouter un serveur MCP</span>
            </Button>
          </div>
        </div>

        {/* Barre d'onglets & Recherche */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/20 p-0.5 text-xs">
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === "servers"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("servers")}
              type="button"
            >
              <ServerIcon className="size-3.5" />
              <span>Serveurs connectés ({servers.length})</span>
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === "tutorial"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("tutorial")}
              type="button"
            >
              <BookOpenIcon className="size-3.5 text-sky-500" />
              <span>Tutoriel & Guide</span>
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === "logs"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("logs")}
              type="button"
            >
              <ActivityIcon className="size-3.5 text-emerald-500" />
              <span>Journal & Audit IA ({stats.totalCalls})</span>
            </button>
          </div>

          {activeTab === "servers" && (
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs bg-muted/40"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer les serveurs..."
                value={searchQuery}
              />
            </div>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Onglet 1: Serveurs connectés */}
        {activeTab === "servers" && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    className="h-44 rounded-2xl border border-border/50 bg-muted/20 animate-pulse p-4"
                    key={i}
                  />
                ))}
              </div>
            ) : servers.length === 0 ? (
              /* Empty state avec presets */
              <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
                <div className="size-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                  <CpuIcon className="size-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  Aucun serveur MCP configuré
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Le protocole MCP permet à l'IA d'interagir directement avec
                  vos outils, fichiers et bases de données, avec un contrôle
                  strict des autorisations.
                </p>

                <div className="w-full text-left mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Modèles préconfigurés prêts à l'emploi :
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRESET_TEMPLATES.map((tmpl) => (
                      <button
                        className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer"
                        key={tmpl.name}
                        onClick={() => handleNewServer(tmpl)}
                        type="button"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-semibold text-xs text-foreground">
                            {tmpl.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium bg-muted text-muted-foreground">
                            {tmpl.transport}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                          {tmpl.description}
                        </span>
                        <span className="text-[11px] font-semibold text-primary">
                          Connecter +
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="gap-2 text-xs font-medium"
                  onClick={() => handleNewServer()}
                >
                  <PlusIcon className="size-4" />
                  <span>Configurer un serveur personnalisé</span>
                </Button>
              </div>
            ) : filteredServers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Aucun serveur ne correspond à votre recherche.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServers.map((s) => {
                  const toolsCount = (s.toolsCache as any[])?.length || 0;

                  return (
                    <div
                      className={cn(
                        "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
                        s.isEnabled
                          ? "border-border/60"
                          : "border-border/40 opacity-70 bg-muted/20"
                      )}
                      key={s.id}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <ServerIcon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {s.name}
                              </h3>
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  s.isEnabled
                                    ? "bg-emerald-500"
                                    : "bg-muted-foreground/40"
                                )}
                                title={s.isEnabled ? "Actif" : "Inactif"}
                              />
                            </div>
                            <p className="text-[11.5px] text-muted-foreground truncate">
                              {s.description ||
                                (s.transport === "stdio" ? s.command : s.url) ||
                                "Aucune description"}
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
                              onClick={() => handleToggleEnabled(s)}
                            >
                              <ZapIcon className="size-3.5" />
                              <span>
                                {s.isEnabled ? "Désactiver" : "Activer"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs"
                              onClick={() => handleRefreshTools(s)}
                            >
                              <RefreshCwIcon className="size-3.5" />
                              <span>Synchroniser les outils</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs"
                              onClick={() => setIsInspectingTools(s)}
                            >
                              <WrenchIcon className="size-3.5" />
                              <span>Voir les outils ({toolsCount})</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs"
                              onClick={() => handleEditServer(s)}
                            >
                              <Edit2Icon className="size-3.5" />
                              <span>Modifier la configuration</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                              onClick={() => setSkillToDelete(s)}
                            >
                              <Trash2Icon className="size-3.5" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Métadonnées Transport & Sécurité */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <Badge
                          className="text-[10px] uppercase font-semibold"
                          variant="outline"
                        >
                          {s.transport}
                        </Badge>
                        <Badge
                          className="text-[10px]"
                          variant={
                            s.authType === "none" ? "outline" : "secondary"
                          }
                        >
                          {s.authType === "none"
                            ? "Pas d'auth"
                            : `Auth: ${s.authType}`}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-[10px]",
                            s.requireApproval === "ask_permission"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : s.requireApproval === "write_only"
                                ? "bg-sky-500/10 text-sky-600 border-sky-500/30"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          )}
                          variant="outline"
                        >
                          <ShieldCheckIcon className="size-2.5 mr-1" />
                          {s.requireApproval === "ask_permission"
                            ? "Toujours demander accord"
                            : s.requireApproval === "write_only"
                              ? "Accord pour écriture"
                              : "Auto-approuvé"}
                        </Badge>
                      </div>

                      {/* Outils découverts */}
                      <div className="pt-2 border-t border-border/40 mt-auto flex items-center justify-between text-xs text-muted-foreground">
                        <button
                          className="hover:underline flex items-center gap-1 text-[11px] font-medium text-foreground"
                          onClick={() => setIsInspectingTools(s)}
                          type="button"
                        >
                          <WrenchIcon className="size-3 text-primary" />
                          <span>{toolsCount} outil(s) disponible(s)</span>
                        </button>
                        <Button
                          className="h-6 px-2 text-[10.5px]"
                          onClick={() => handleRefreshTools(s)}
                          size="sm"
                          variant="ghost"
                        >
                          <RefreshCwIcon className="size-2.5 mr-1" />
                          Synchro
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Onglet 2: Tutoriel & Guide MCP */}
        {activeTab === "tutorial" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <BookOpenIcon className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    Qu'est-ce que le Model Context Protocol (MCP) ?
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Le standard ouvert pour connecter l'IA à vos systèmes
                    d'information
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Le <strong>Model Context Protocol (MCP)</strong> est un
                protocole standardisé (développé initialement par Anthropic)
                fonctionnant via JSON-RPC 2.0. Il permet aux modèles de langage
                d'interagir de manière unifiée et sécurisée avec des serveurs
                d'outils, qu'ils soient distants (APIs cloud via SSE / HTTP) ou
                locaux (scripts Node/Python via Stdio).
              </p>
            </div>

            {/* Étapes clés */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs">
                  <span className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Connectez un serveur</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Renseignez l'URL d'un serveur SSE/HTTP distant ou la commande
                  d'un outil local. Configurez les en-têtes ou clés d'API
                  requises.
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2 text-sky-500 font-semibold text-xs">
                  <span className="size-5 rounded-full bg-sky-500/10 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Définissez les permissions</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Activez la politique "Accord pour écriture" pour que l'IA vous
                  demande votre consentement explicite avant toute action
                  modifiant des données.
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2 text-purple-500 font-semibold text-xs">
                  <span className="size-5 rounded-full bg-purple-500/10 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Invoquez dans le Chat</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Utilisez la commande{" "}
                  <span className="font-semibold text-foreground">@</span> ou le
                  menu{" "}
                  <span className="font-semibold text-foreground">Plus</span>{" "}
                  pour cibler vos outils MCP directement dans la conversation.
                </p>
              </div>
            </div>

            {/* Exemples de configuration */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <TerminalIcon className="size-4 text-purple-500" />
                <span>Exemples de configurations prêtes à l'emploi</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 font-mono">
                  <span className="text-muted-foreground block mb-1">
                    # 1. GitHub MCP distant (SSE)
                  </span>
                  <span className="text-primary block font-semibold">
                    URL: https://github-mcp.company.com/sse
                  </span>
                  <span className="text-muted-foreground block">
                    Authentification: Bearer Token (votre jeton GitHub PAT)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 font-mono">
                  <span className="text-muted-foreground block mb-1">
                    # 2. Serveur PostgreSQL local (Stdio)
                  </span>
                  <span className="text-primary block font-semibold">
                    Commande: npx -y @modelcontextprotocol/server-postgres
                    postgresql://user:pass@localhost:5432/mabase
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 3: Journal & Audit IA */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">
                  Historique d'audit des appels MCP
                </h2>
                <p className="text-xs text-muted-foreground">
                  Suivez en temps réel chaque utilisation des outils MCP par
                  l'IA
                </p>
              </div>
              <Button
                className="h-7 text-xs"
                onClick={() => mutateLogs()}
                size="sm"
                variant="outline"
              >
                <RefreshCwIcon className="size-3 mr-1" />
                Actualiser
              </Button>
            </div>

            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center text-muted-foreground text-xs">
                Aucun appel d'outil MCP enregistré pour le moment.
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Date / Heure</th>
                        <th className="py-2.5 px-3">Serveur</th>
                        <th className="py-2.5 px-3">Outil</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Statut</th>
                        <th className="py-2.5 px-3">Latence</th>
                        <th className="py-2.5 px-3 text-right">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {logs.map((log) => (
                        <tr className="hover:bg-muted/30" key={log.id}>
                          <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                            {log.serverName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-primary whitespace-nowrap">
                            {log.toolName}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              className={cn(
                                "text-[10px] uppercase font-semibold",
                                log.actionType === "write" ||
                                  log.actionType === "delete"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                              )}
                              variant="outline"
                            >
                              {log.actionType}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              {log.error ? (
                                <span className="text-destructive font-medium">
                                  Erreur
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2Icon className="size-3" />
                                  Succès
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {log.durationMs} ms
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <Button
                              className="h-6 px-2 text-[10.5px]"
                              onClick={() => {
                                toast.info(
                                  `Arguments: ${JSON.stringify(log.inputPayload ?? {})}`
                                );
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              Voir payload
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Ajout / Modification Serveur MCP */}
      <Dialog onOpenChange={setIsServerModalOpen} open={isServerModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingServer
                ? "Modifier le serveur MCP"
                : "Connecter un nouveau serveur MCP"}
            </DialogTitle>
            <DialogDescription>
              Configurez le moyen d'appel (transport), l'authentification et les
              règles de permission.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-col gap-4 py-2"
            onSubmit={handleSaveServer}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">
                  Nom du serveur *
                </Label>
                <Input
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: GitHub MCP, Postgres DB, Notion..."
                  required
                  value={formName}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Moyen d'appel *</Label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onChange={(e) => setFormTransport(e.target.value as any)}
                  value={formTransport}
                >
                  <option value="sse">Distant SSE (Server-Sent Events)</option>
                  <option value="http">Distant HTTP (JSON-RPC POST)</option>
                  <option value="stdio">Local Stdio (CLI Node/Python)</option>
                  <option value="websocket">WebSocket (WSS)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Rôle ou données exposées par ce serveur..."
                value={formDescription}
              />
            </div>

            {/* Transport details */}
            {formTransport === "stdio" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Commande système *
                  </Label>
                  <Input
                    onChange={(e) => setFormCommand(e.target.value)}
                    placeholder="npx ou python"
                    required
                    value={formCommand}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Arguments (séparés par des espaces)
                  </Label>
                  <Input
                    onChange={(e) => setFormArgs(e.target.value)}
                    placeholder="-y @modelcontextprotocol/server-postgres ..."
                    value={formArgs}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  URL du serveur MCP *
                </Label>
                <Input
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://votre-serveur-mcp.com/sse"
                  required
                  value={formUrl}
                />
              </div>
            )}

            {/* Authentification */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyIcon className="size-4 text-primary" />
                  <Label className="text-xs font-semibold">
                    Méthode d'authentification
                  </Label>
                </div>
                <select
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                  onChange={(e) => setFormAuthType(e.target.value as any)}
                  value={formAuthType}
                >
                  <option value="none">Aucune (Public)</option>
                  <option value="bearer">Bearer Token / API Key</option>
                  <option value="basic">
                    Basic Auth (Utilisateur / Mot de passe)
                  </option>
                  <option value="custom_headers">
                    En-têtes personnalisés (JSON)
                  </option>
                </select>
              </div>

              {formAuthType === "bearer" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Jeton / Clé API (Bearer)</Label>
                  <Input
                    onChange={(e) => setFormToken(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    type="password"
                    value={formToken}
                  />
                </div>
              )}

              {formAuthType === "basic" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom d'utilisateur</Label>
                    <Input
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="admin"
                      value={formUsername}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mot de passe</Label>
                    <Input
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      type="password"
                      value={formPassword}
                    />
                  </div>
                </div>
              )}

              {formAuthType === "custom_headers" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    En-têtes HTTP additionnels (format JSON)
                  </Label>
                  <Textarea
                    className="font-mono text-xs h-20"
                    onChange={(e) => setFormHeaders(e.target.value)}
                    placeholder='{"X-API-Key": "...", "X-Custom": "..."}'
                    value={formHeaders}
                  />
                </div>
              )}
            </div>

            {/* Politique de Permissions & Données (Human in the loop) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-2">
                <ShieldAlertIcon className="size-4 text-primary" />
                <Label className="text-xs font-semibold">
                  Politique de confirmation des données (Human-in-the-loop)
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Contrôlez si l'IA peut lire, modifier ou supprimer des données
                en toute autonomie ou avec votre accord préalable.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  className={cn(
                    "flex flex-col text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                    formRequireApproval === "always_allow"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border/50 hover:bg-muted/30"
                  )}
                  onClick={() => setFormRequireApproval("always_allow")}
                  type="button"
                >
                  <span className="font-semibold text-xs text-foreground mb-0.5">
                    🟢 Automatique
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Exécution directe sans confirmation
                  </span>
                </button>

                <button
                  className={cn(
                    "flex flex-col text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                    formRequireApproval === "write_only"
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-border/50 hover:bg-muted/30"
                  )}
                  onClick={() => setFormRequireApproval("write_only")}
                  type="button"
                >
                  <span className="font-semibold text-xs text-foreground mb-0.5">
                    🟡 Accord pour écriture
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Lecture directe, confirmation pour modifier
                  </span>
                </button>

                <button
                  className={cn(
                    "flex flex-col text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                    formRequireApproval === "ask_permission"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border/50 hover:bg-muted/30"
                  )}
                  onClick={() => setFormRequireApproval("ask_permission")}
                  type="button"
                >
                  <span className="font-semibold text-xs text-foreground mb-0.5">
                    🔴 Accord systématique
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Confirmation demandée pour chaque appel
                  </span>
                </button>
              </div>
            </div>

            {/* Résultat du test de connexion */}
            {testResult && (
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs flex items-center gap-2",
                  testResult.success
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                {testResult.success ? (
                  <CheckCircle2Icon className="size-4 shrink-0" />
                ) : (
                  <AlertCircleIcon className="size-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
              <Button
                disabled={isTesting}
                onClick={handleTestConnection}
                type="button"
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="size-3.5 mr-1.5" />
                    Tester la connexion
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsServerModalOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button disabled={isSaving} type="submit">
                  {isSaving ? "Enregistrement..." : "Sauvegarder le serveur"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Inspection des outils d'un serveur */}
      <Dialog
        onOpenChange={(open) => !open && setIsInspectingTools(null)}
        open={Boolean(isInspectingTools)}
      >
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Outils exposés : {isInspectingTools?.name}
            </DialogTitle>
            <DialogDescription>
              {(isInspectingTools?.toolsCache as any[])?.length || 0} outil(s)
              détecté(s) sur ce serveur MCP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {((isInspectingTools?.toolsCache as any[]) || []).map((t, idx) => (
              <div
                className="p-3 rounded-xl border border-border/50 bg-muted/20"
                key={idx}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {t.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t.description || "Aucune description fournie"}
                </p>
                {t.inputSchema?.properties && (
                  <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground font-mono">
                    <span className="block font-sans font-medium text-[10px] text-foreground uppercase mb-1">
                      Paramètres acceptés :
                    </span>
                    {Object.entries(t.inputSchema.properties).map(
                      ([key, prop]: [string, any]) => (
                        <div className="flex items-center gap-1.5" key={key}>
                          <span className="text-foreground">{key}</span>
                          <span className="text-muted-foreground/60">
                            ({prop.type || "any"})
                          </span>
                          {prop.description && (
                            <span className="truncate">
                              - {prop.description}
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Suppression Serveur */}
      <AlertDialog
        onOpenChange={(open) => !open && setSkillToDelete(null)}
        open={Boolean(serverToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce serveur MCP ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{serverToDelete?.name}" ? L'IA
              ne pourra plus appeler ses outils.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteServer}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
