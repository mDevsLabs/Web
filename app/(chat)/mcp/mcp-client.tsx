"use client";
import {
  ActivityIcon,
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleIcon,
  CopyIcon,
  CpuIcon,
  DownloadIcon,
  Edit2Icon,
  KeyIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TerminalIcon,
  Trash2Icon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
    url: "https://api.githubcopilot.com/mcp/",
  },
  {
    authType: "none",
    command: "npx",
    description: "Interroger et manipuler des données en toute sécurité",
    icon: "database",
    name: "Base de données",
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
export default function McpClient() {
  const {
    data,
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
  const { data: tplData, mutate: mutateTpl } = useSWR<{ templates: any[] }>(
    "/api/mcp/templates",
    fetcher
  );
  const templates = tplData?.templates ?? [];
  const servers = data?.servers ?? [];
  const stats = data?.stats ?? { servers: 0, totalCalls: 0 };
  const [activeTab, setActiveTab] = useState<
    "servers" | "library" | "tutorial" | "logs" | "settings"
  >("servers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [serverToDelete, setSkillToDelete] = useState<McpServer | null>(null);
  const [isInspectingTools, setIsInspectingTools] = useState<McpServer | null>(
    null
  );
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
  const [formTimeoutMs, setFormTimeoutMs] = useState(15_000);
  const [formRateLimit, setFormRateLimit] = useState(60);
  const [formEnvPairs, setFormEnvPairs] = useState<
    Array<{ k: string; v: string }>
  >([]);
  const [logServerFilter, setLogServerFilter] = useState("");
  const [logToolFilter, setLogToolFilter] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    message: string;
    success: boolean;
    toolsCount: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Préférences globales MCP (onglet Paramètres)
  const [mcpKillSwitch, setMcpKillSwitch] = useState(false);
  const [mcpDefaultApproval, setMcpDefaultApproval] = useState<
    "always_allow" | "write_only" | "ask_permission"
  >("write_only");
  const [mcpDefaultTimeout, setMcpDefaultTimeout] = useState(15_000);
  const [mcpDefaultRateLimit, setMcpDefaultRateLimit] = useState(60);
  const [mcpAllowStdio, setMcpAllowStdio] = useState(true);
  const [mcpRetention, setMcpRetention] = useState(30);
  const [isSavingMcpPrefs, setIsSavingMcpPrefs] = useState(false);
  const { data: mcpPrefsData, mutate: mutateMcpPrefs } = useSWR(
    "/api/user/mcp-preferences",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 10_000 }
  );
  useEffect(() => {
    if (mcpPrefsData) {
      if (typeof mcpPrefsData.globalKillSwitch === "boolean") {
        setMcpKillSwitch(mcpPrefsData.globalKillSwitch);
      }
      if (mcpPrefsData.defaultRequireApproval) {
        setMcpDefaultApproval(mcpPrefsData.defaultRequireApproval);
      }
      if (mcpPrefsData.defaultTimeoutMs) {
        setMcpDefaultTimeout(mcpPrefsData.defaultTimeoutMs);
      }
      if (mcpPrefsData.defaultRateLimitPerMin) {
        setMcpDefaultRateLimit(mcpPrefsData.defaultRateLimitPerMin);
      }
      if (typeof mcpPrefsData.allowStdio === "boolean") {
        setMcpAllowStdio(mcpPrefsData.allowStdio);
      }
      if (mcpPrefsData.retentionDays) {
        setMcpRetention(mcpPrefsData.retentionDays);
      }
    }
  }, [mcpPrefsData]);
  const handleSaveMcpPrefs = async () => {
    setIsSavingMcpPrefs(true);
    try {
      const res = await fetch("/api/user/mcp-preferences", {
        body: JSON.stringify({
          allowStdio: mcpAllowStdio,
          defaultRateLimitPerMin: mcpDefaultRateLimit,
          defaultRequireApproval: mcpDefaultApproval,
          defaultTimeoutMs: mcpDefaultTimeout,
          globalKillSwitch: mcpKillSwitch,
          retentionDays: mcpRetention,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Erreur sauvegarde");
      }
      toast.success("Préférences MCP enregistrées !");
      mutateMcpPrefs();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setIsSavingMcpPrefs(false);
    }
  };
  const handlePurgeMcp = async () => {
    try {
      const r = await fetch("/api/mcp/purge", {
        body: JSON.stringify({ retentionDays: 0 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const d = await r.json();
      toast.success(`${d.deleted} logs purgés`);
      await mutateLogs();
    } catch {
      toast.error("Erreur purge");
    }
  };
  const handleNewServer = (template?: (typeof PRESET_TEMPLATES)[0] | any) => {
    setEditingServer(null);
    setTestResult(null);
    setFormName(template?.name ?? "");
    setFormDescription(template?.description ?? "");
    setFormTransport((template?.transport as any) ?? "sse");
    setFormUrl(template?.url ?? "");
    setFormCommand(template?.command ?? "");
    setFormArgs(template?.args ?? "");
    setFormAuthType((template?.authType as any) ?? "none");
    setFormToken("");
    setFormUsername("");
    setFormPassword("");
    setFormHeaders("");
    setFormRequireApproval((template?.requireApproval as any) ?? "write_only");
    setFormTimeoutMs(15_000);
    setFormRateLimit(60);
    setFormEnvPairs([]);
    setIsServerModalOpen(true);
  };
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
    setFormTimeoutMs((s as any).timeoutMs ?? 15_000);
    setFormRateLimit((s as any).rateLimitPerMin ?? 60);
    const env = (s.env as Record<string, string>) ?? {};
    setFormEnvPairs(Object.entries(env).map(([k, v]) => ({ k, v: String(v) })));
    setIsServerModalOpen(true);
  };
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
    const envObj: Record<string, string> = {};
    for (const p of formEnvPairs) {
      if (p.k.trim()) {
        envObj[p.k.trim()] = p.v;
      }
    }
    setIsSaving(true);
    const payload: any = {
      args: formArgs ? formArgs.split(" ").filter(Boolean) : [],
      authConfig: {
        password: formPassword,
        token: formToken,
        username: formUsername,
      },
      authType: formAuthType,
      command: formCommand,
      description: formDescription,
      env: envObj,
      headers: parsedHeaders,
      name: formName,
      rateLimitPerMin: formRateLimit,
      requireApproval: formRequireApproval,
      timeoutMs: formTimeoutMs,
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
        toast.success("Serveur MCP mis à jour !");
      } else {
        const res = await fetch("/api/mcp", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Erreur de création");
        }
        toast.success("Serveur MCP connecté et enregistré !");
      }
      await mutateServers();
      setIsServerModalOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };
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
          : `Serveur "${s.name}" activé`
      );
      await mutateServers();
    } catch {
      toast.error("Impossible de basculer l'état du serveur");
    }
  };
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
  const handleToggleTool = async (s: McpServer, toolName: string) => {
    try {
      await fetch(`/api/mcp/${s.id}`, {
        body: JSON.stringify({ toggleTool: toolName }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      toast.success(`Outil ${toolName} basculé`);
      await mutateServers();
      const upd = await fetch(`/api/mcp/${s.id}`).then((r) => r.json());
      if (isInspectingTools && isInspectingTools.id === s.id) {
        setIsInspectingTools(upd);
      }
    } catch {
      toast.error("Erreur toggle outil");
    }
  };
  const handleSetToolApproval = async (
    s: McpServer,
    toolName: string,
    val: string | null
  ) => {
    try {
      await fetch(`/api/mcp/${s.id}`, {
        body: JSON.stringify({
          setToolApproval: { requireApproval: val, toolName },
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      toast.success("Permission outil mise à jour");
      await mutateServers();
      const upd = await fetch(`/api/mcp/${s.id}`).then((r) => r.json());
      if (isInspectingTools && isInspectingTools.id === s.id) {
        setIsInspectingTools(upd);
      }
    } catch {
      toast.error("Erreur maj approval");
    }
  };
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
  const handleInstallTemplate = async (tpl: any) => {
    try {
      const res = await fetch("/api/mcp/templates", {
        body: JSON.stringify({ templateId: tpl.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      toast.success(data.message);
      await mutateServers();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur installation");
    }
  };
  const handleCopyTemplate = async (tpl: any) => {
    await navigator.clipboard.writeText(JSON.stringify(tpl, null, 2));
    toast.success("Template copié !");
  };
  const handleExport = (fmt: string, scope: "servers" | "logs") => {
    const url =
      scope === "servers"
        ? `/api/mcp/export?format=${fmt}`
        : `/api/mcp/logs/export?format=${fmt}`;
    window.open(url, "_blank");
  };
  const handlePurgeLogs = async () => {
    try {
      const res = await fetch("/api/mcp/purge", {
        body: JSON.stringify({ retentionDays: 0 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const d = await res.json();
      toast.success(`${d.deleted} logs purgés`);
      mutateLogs();
    } catch {
      toast.error("Erreur purge");
    }
  };
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
  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (l) =>
          (!logServerFilter ||
            l.serverName
              .toLowerCase()
              .includes(logServerFilter.toLowerCase())) &&
          (!logToolFilter ||
            l.toolName.toLowerCase().includes(logToolFilter.toLowerCase())) &&
          (!logActionFilter || l.actionType === logActionFilter)
      ),
    [logs, logServerFilter, logToolFilter, logActionFilter]
  );
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 gap-1.5 text-xs font-medium shadow-xs"
                  variant="outline"
                >
                  <DownloadIcon className="size-3.5" />
                  <span>Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleExport("json", "servers")}
                >
                  Serveurs JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport("csv", "servers")}
                >
                  Serveurs CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("md", "servers")}>
                  Serveurs MD
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport("txt", "servers")}
                >
                  Serveurs TXT
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("json", "logs")}>
                  Logs JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv", "logs")}>
                  Logs CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("md", "logs")}>
                  Logs MD
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("txt", "logs")}>
                  Logs TXT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="h-8 gap-1.5 text-xs font-medium shadow-xs"
              onClick={() => handleNewServer()}
            >
              <PlusIcon className="size-3.5" />
              <span>Ajouter un serveur MCP</span>
            </Button>
          </div>
        </div>
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
              <span>Serveurs ({servers.length})</span>
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === "library"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("library")}
              type="button"
            >
              <WrenchIcon className="size-3.5 text-amber-500" />
              <span>Bibliothèque ({templates.length})</span>
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
              <span>Tutoriel</span>
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
              <span>Journal ({stats.totalCalls})</span>
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("settings")}
              type="button"
            >
              <SettingsIcon className="size-3.5 text-slate-500" />
              <span>Paramètres</span>
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
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
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
                    Modèles préconfigurés :
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
                  const overrides =
                    ((s as any).toolOverrides as Record<string, any>) ?? {};
                  const enabledCount = ((s.toolsCache as any[]) || []).filter(
                    (t) => overrides[t.name]?.enabled !== false
                  ).length;
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
                              <span>Gérer les outils ({toolsCount})</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs"
                              onClick={() => handleEditServer(s)}
                            >
                              <Edit2Icon className="size-3.5" />
                              <span>Modifier</span>
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
                      <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[10.5px] text-muted-foreground">
                        <span>⏱ {(s as any).avgLatencyMs ?? 0}ms</span>
                        <span>·</span>
                        <span>📞 {(s as any).callCount ?? 0} appel(s)</span>
                        <span>·</span>
                        <span
                          className={cn(
                            (s as any).uptimeStatus === "online"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          ● {(s as any).uptimeStatus ?? "unknown"}
                        </span>
                        <span>·</span>
                        <span>{enabledCount}/{toolsCount} actifs</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <Badge
                          className="text-[10px] uppercase font-semibold px-2 py-0.5"
                          variant="outline"
                        >
                          {s.transport}
                        </Badge>
                        <Badge
                          className="text-[10px] px-2 py-0.5"
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
                            "text-[10px] px-2 py-0.5",
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
                            ? "Toujours demander"
                            : s.requireApproval === "write_only"
                              ? "Accord écriture"
                              : "Auto-approuvé"}
                        </Badge>
                        <Badge className="text-[10px] px-2 py-0.5" variant="outline">
                          ⏱ {(s as any).timeoutMs ?? 15_000}ms ·{" "}
                          {(s as any).rateLimitPerMin ?? 60}/min
                        </Badge>
                      </div>
                      <div className="pt-2 border-t border-border/40 mt-auto flex items-center justify-between text-xs text-muted-foreground">
                        <button
                          className="hover:underline flex items-center gap-1 text-[11px] font-medium text-foreground"
                          onClick={() => setIsInspectingTools(s)}
                          type="button"
                        >
                          <WrenchIcon className="size-3 text-primary" />
                          <span>
                            {enabledCount}/{toolsCount} outil(s) actif(s)
                          </span>
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
        {activeTab === "library" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Bibliothèque MCP — Templates installables (50+)
              </h2>
              <Button onClick={() => mutateTpl()} size="sm" variant="outline">
                Actualiser
              </Button>
            </div>
            {templates.length === 0 ? (
              <div className="text-xs text-muted-foreground p-8 border rounded-xl text-center">
                Chargement marketplace...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((tpl: any) => (
                  <div
                    className="rounded-2xl border bg-card p-4 flex flex-col"
                    key={tpl.id}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs">{tpl.name}</span>
                      <Badge className="text-[10px]" variant="outline">
                        {tpl.transport}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                      {tpl.description}
                    </p>
                    <div className="flex gap-1.5 mt-auto">
                      <Button
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleInstallTemplate(tpl)}
                        size="sm"
                      >
                        <PlusIcon className="size-3 mr-1" />
                        Installer
                      </Button>
                      <Button
                        className="h-7 text-xs"
                        onClick={() => handleCopyTemplate(tpl)}
                        size="sm"
                        variant="outline"
                      >
                        <CopyIcon className="size-3 mr-1" />
                        Copier
                      </Button>
                    </div>
                  </div>
                ))}
                {PRESET_TEMPLATES.map((t) => (
                  <div
                    className="rounded-2xl border border-dashed bg-muted/20 p-4 flex flex-col"
                    key={`${t.name}preset`}
                  >
                    <span className="font-semibold text-xs mb-1">
                      {t.name} (preset)
                    </span>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      {t.description}
                    </p>
                    <Button
                      className="h-7 text-xs"
                      onClick={() => handleNewServer(t as any)}
                      size="sm"
                      variant="outline"
                    >
                      Utiliser
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
                protocole standardisé via JSON-RPC 2.0. Ajoutez un serveur,
                cochez les outils autorisés, liez-le à un Skill, et contrôlez
                chaque appel via les permissions per-tool.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs">
                  <span className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Connectez</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  URL SSE/HTTP ou commande stdio + timeout/rate-limit.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2 text-sky-500 font-semibold text-xs">
                  <span className="size-5 rounded-full bg-sky-500/10 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Autorisez per-tool</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Activez/désactivez chaque outil + son niveau d'approbation.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2 text-purple-500 font-semibold text-xs">
                  <span className="size-5 rounded-full bg-purple-500/10 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Liez à un Skill</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dans Skills, whitelist les serveurs/outils pour ce Skill.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <TerminalIcon className="size-4 text-purple-500" />
                <span>Exemples</span>
              </h3>
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 font-mono">
                  <span className="text-muted-foreground block mb-1">
                    # SSE GitHub
                  </span>
                  <span className="text-primary block font-semibold">
                    URL: https://github-mcp.company.com/sse
                  </span>
                  <span className="text-muted-foreground block">
                    Auth: bearer • timeout 15000ms • rate 60/min
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 font-mono">
                  <span className="text-muted-foreground block mb-1">
                    # Stdio Postgres (vars chiffrées)
                  </span>
                  <span className="text-primary block font-semibold">
                    Commande: npx -y @modelcontextprotocol/server-postgres
                  </span>
                  <span className="text-muted-foreground block">
                    Env: PGPASSWORD=••••
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">Historique d'audit</h2>
                <p className="text-xs text-muted-foreground">
                  Filtres + export 4 formats
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  className="h-7 text-xs w-28"
                  onChange={(e) => setLogServerFilter(e.target.value)}
                  placeholder="Serveur"
                  value={logServerFilter}
                />
                <Input
                  className="h-7 text-xs w-28"
                  onChange={(e) => setLogToolFilter(e.target.value)}
                  placeholder="Outil"
                  value={logToolFilter}
                />
                <select
                  className="h-7 rounded-md border bg-background px-2 text-xs"
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  value={logActionFilter}
                >
                  <option value="">Tous actions</option>
                  <option value="read">read</option>
                  <option value="write">write</option>
                  <option value="delete">delete</option>
                  <option value="execute">execute</option>
                </select>
                <Button
                  className="h-7 text-xs"
                  onClick={() => mutateLogs()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCwIcon className="size-3 mr-1" />
                  Actualiser
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-7 text-xs" size="sm" variant="outline">
                      <DownloadIcon className="size-3 mr-1" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleExport("json", "logs")}
                    >
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("csv", "logs")}
                    >
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("md", "logs")}
                    >
                      MD
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("txt", "logs")}
                    >
                      TXT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="h-7 text-xs"
                  onClick={handlePurgeLogs}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2Icon className="size-3 mr-1" />
                  Purger
                </Button>
              </div>
            </div>
            {filteredLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center text-muted-foreground text-xs">
                Aucun log correspondant.
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Serveur</th>
                        <th className="py-2.5 px-3">Outil</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Statut</th>
                        <th className="py-2.5 px-3">Latence</th>
                        <th className="py-2.5 px-3 text-right">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredLogs.map((log) => (
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
        {activeTab === "settings" && (
          <div className="py-2 max-w-3xl">
            <div className="p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                  <SettingsIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    Contrôle global MCP
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Kill-switch, timeout, rate-limit et permissions par défaut.
                  </p>
                </div>
                <span
                  className={`ml-auto text-xs px-2 py-1 rounded-full border font-medium ${mcpKillSwitch ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}`}
                >
                  {mcpKillSwitch ? "MCP OFF" : "MCP ON"}
                </span>
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border border-red-500/20 bg-red-500/5 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-red-600">
                    Kill-switch global
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Désactive tous les appels MCP instantanément
                  </span>
                </div>
                <input
                  checked={mcpKillSwitch}
                  className="size-5 accent-red-600"
                  onChange={(e) => setMcpKillSwitch(e.target.checked)}
                  type="checkbox"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Permission par défaut
                  </Label>
                  <select
                    className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm"
                    onChange={(e) =>
                      setMcpDefaultApproval(e.target.value as any)
                    }
                    value={mcpDefaultApproval}
                  >
                    <option value="always_allow">always_allow (auto)</option>
                    <option value="write_only">write_only (recommandé)</option>
                    <option value="ask_permission">
                      ask_permission (strict)
                    </option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Timeout par défaut (ms)
                  </Label>
                  <Input
                    max={120_000}
                    min={1000}
                    onChange={(e) =>
                      setMcpDefaultTimeout(Number(e.target.value))
                    }
                    step={1000}
                    type="number"
                    value={mcpDefaultTimeout}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Rate limit par défaut (/min)
                  </Label>
                  <Input
                    max={1000}
                    min={1}
                    onChange={(e) =>
                      setMcpDefaultRateLimit(Number(e.target.value))
                    }
                    type="number"
                    value={mcpDefaultRateLimit}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Rétention logs (jours)
                  </Label>
                  <Input
                    max={365}
                    min={1}
                    onChange={(e) => setMcpRetention(Number(e.target.value))}
                    type="number"
                    value={mcpRetention}
                  />
                </div>
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Autoriser transport stdio (local)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Si désactivé, toute création stdio sera bloquée (403)
                  </span>
                </div>
                <input
                  checked={mcpAllowStdio}
                  className="size-5 accent-primary"
                  onChange={(e) => setMcpAllowStdio(e.target.checked)}
                  type="checkbox"
                />
              </label>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  className="h-8 text-xs"
                  onClick={handlePurgeMcp}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2Icon className="size-3 mr-1" />
                  Purger tous les logs
                </Button>
                <Button
                  className="h-8 text-xs"
                  disabled={isSavingMcpPrefs}
                  onClick={handleSaveMcpPrefs}
                  size="sm"
                >
                  {isSavingMcpPrefs ? (
                    <>
                      <Loader2Icon className="size-3 mr-1 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer préférences MCP"
                  )}
                </Button>
              </div>
              <div className="p-3 rounded-xl border border-border/40 bg-muted/20 text-[11px] text-muted-foreground">
                Ces réglages s'appliquent à tous les serveurs. Exports
                disponibles en JSON/CSV/MD/TXT depuis /mcp et /skills.
              </div>
            </div>
          </div>
        )}
      </main>
      <Dialog onOpenChange={setIsServerModalOpen} open={isServerModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingServer
                ? "Modifier le serveur MCP"
                : "Connecter un nouveau serveur MCP"}
            </DialogTitle>
            <DialogDescription>
              Configurez transport, auth, timeout, rate-limit, variables
              d'environnement et permissions.
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
                  placeholder="Ex: GitHub MCP"
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
                  <option value="sse">Distant SSE</option>
                  <option value="http">Distant HTTP</option>
                  <option value="stdio">Local Stdio</option>
                  <option value="websocket">WebSocket</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Rôle ou données exposées..."
                value={formDescription}
              />
            </div>
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
                  <Label className="text-xs font-semibold">Arguments</Label>
                  <Input
                    onChange={(e) => setFormArgs(e.target.value)}
                    placeholder="-y @modelcontextprotocol/server-postgres ..."
                    value={formArgs}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Variables d'environnement
                  </Label>
                  {formEnvPairs.map((p, idx) => (
                    <div className="flex gap-2" key={idx}>
                      <Input
                        className="h-8 text-xs flex-1"
                        onChange={(e) =>
                          setFormEnvPairs((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, k: e.target.value } : x
                            )
                          )
                        }
                        placeholder="CLÉ"
                        value={p.k}
                      />
                      <Input
                        className="h-8 text-xs flex-1"
                        onChange={(e) =>
                          setFormEnvPairs((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, v: e.target.value } : x
                            )
                          )
                        }
                        placeholder="valeur (chiffrée)"
                        value={p.v}
                      />
                      <Button
                        onClick={() =>
                          setFormEnvPairs((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2Icon className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    className="h-7 text-xs"
                    onClick={() =>
                      setFormEnvPairs((prev) => [...prev, { k: "", v: "" }])
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PlusIcon className="size-3 mr-1" />
                    Ajouter variable
                  </Button>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Timeout (ms)</Label>
                <Input
                  max={120_000}
                  min={1000}
                  onChange={(e) => setFormTimeoutMs(Number(e.target.value))}
                  step={1000}
                  type="number"
                  value={formTimeoutMs}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Rate limit /min</Label>
                <Input
                  max={1000}
                  min={1}
                  onChange={(e) => setFormRateLimit(Number(e.target.value))}
                  type="number"
                  value={formRateLimit}
                />
              </div>
            </div>
            <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyIcon className="size-4 text-primary" />
                  <Label className="text-xs font-semibold">
                    Authentification
                  </Label>
                </div>
                <select
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                  onChange={(e) => setFormAuthType(e.target.value as any)}
                  value={formAuthType}
                >
                  <option value="none">Aucune</option>
                  <option value="bearer">Bearer</option>
                  <option value="basic">Basic</option>
                  <option value="custom_headers">En-têtes JSON</option>
                </select>
              </div>
              {formAuthType === "bearer" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Jeton Bearer</Label>
                  <Input
                    onChange={(e) => setFormToken(e.target.value)}
                    placeholder="eyJ..."
                    type="password"
                    value={formToken}
                  />
                </div>
              )}
              {formAuthType === "basic" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Utilisateur</Label>
                    <Input
                      onChange={(e) => setFormUsername(e.target.value)}
                      value={formUsername}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mot de passe</Label>
                    <Input
                      onChange={(e) => setFormPassword(e.target.value)}
                      type="password"
                      value={formPassword}
                    />
                  </div>
                </div>
              )}
              {formAuthType === "custom_headers" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">En-têtes JSON</Label>
                  <Textarea
                    className="font-mono text-xs h-20"
                    onChange={(e) => setFormHeaders(e.target.value)}
                    placeholder='{"X-API-Key":"..."}'
                    value={formHeaders}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-2">
                <ShieldAlertIcon className="size-4 text-primary" />
                <Label className="text-xs font-semibold">
                  Politique globale (héritée par les outils)
                </Label>
              </div>
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
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <CircleIcon className="size-2.5 fill-emerald-500 text-emerald-500" />
                    Automatique
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Sans confirmation
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
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <CircleIcon className="size-2.5 fill-sky-500 text-sky-500" />
                    Écriture
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Lecture directe
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
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <CircleIcon className="size-2.5 fill-amber-500 text-amber-500" />
                    Systématique
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Toujours demander
                  </span>
                </button>
              </div>
            </div>
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
                    Test...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="size-3.5 mr-1.5" />
                    Tester
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
                  {isSaving ? "Enregistrement..." : "Sauvegarder"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(open) => !open && setIsInspectingTools(null)}
        open={Boolean(isInspectingTools)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Outils : {isInspectingTools?.name}</DialogTitle>
            <DialogDescription>
              {((isInspectingTools?.toolsCache as any[]) || []).length} outil(s)
              — cochez per-tool + permission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {((isInspectingTools?.toolsCache as any[]) || []).length === 0 && (
              <div className="text-xs text-muted-foreground text-center p-4">
                Aucun outil — synchronisez.
              </div>
            )}
            {((isInspectingTools?.toolsCache as any[]) || []).map(
              (t: any, idx: number) => {
                const overrides =
                  ((isInspectingTools as any)?.toolOverrides as Record<
                    string,
                    any
                  >) ?? {};
                const ov = overrides[t.name];
                const enabled = ov?.enabled !== false;
                const approval = ov?.requireApproval ?? null;
                return (
                  <div
                    className={cn(
                      "p-3 rounded-xl border",
                      enabled
                        ? "border-border/50 bg-muted/10"
                        : "border-border/30 bg-muted/5 opacity-60"
                    )}
                    key={idx}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {t.name}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          checked={enabled}
                          className="size-4 accent-primary"
                          onChange={() =>
                            handleToggleTool(isInspectingTools!, t.name)
                          }
                          type="checkbox"
                        />
                        <span>{enabled ? "Activé" : "Désactivé"}</span>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t.description || "Aucune description"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px]">Permission outil:</Label>
                      <select
                        className="h-7 rounded-md border bg-background px-2 text-xs"
                        onChange={(e) =>
                          handleSetToolApproval(
                            isInspectingTools!,
                            t.name,
                            e.target.value || null
                          )
                        }
                        value={approval ?? ""}
                      >
                        <option value="">
                          Hérite (
                          {(isInspectingTools as any)?.requireApproval ??
                            "write_only"}
                          )
                        </option>
                        <option value="always_allow">always_allow</option>
                        <option value="write_only">write_only</option>
                        <option value="ask_permission">ask_permission</option>
                      </select>
                    </div>
                    {t.inputSchema?.properties && (
                      <div className="pt-2 border-t border-border/30 text-[11px] font-mono">
                        <span className="block font-sans font-medium text-[10px] uppercase mb-1">
                          Params:
                        </span>
                        {Object.entries(t.inputSchema.properties).map(
                          ([k, p]: [string, any]) => (
                            <div className="flex gap-1.5" key={k}>
                              <span className="text-foreground">{k}</span>
                              <span className="text-muted-foreground/60">
                                ({p.type})
                              </span>
                              <span className="truncate">{p.description}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                isInspectingTools && handleRefreshTools(isInspectingTools)
              }
              size="sm"
              variant="outline"
            >
              Resynchroniser
            </Button>
            <Button onClick={() => setIsInspectingTools(null)} size="sm">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        onOpenChange={(open) => !open && setSkillToDelete(null)}
        open={Boolean(serverToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce serveur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{serverToDelete?.name}" ?
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
