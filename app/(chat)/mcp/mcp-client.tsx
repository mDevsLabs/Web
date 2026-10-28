"use client";
import type { IconProps } from "@mdevs/icons";
import {
  ActivityIcon,
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleIcon,
  CopyIcon,
  CpuIcon,
  CreditCardIcon,
  DatabaseIcon,
  DownloadIcon,
  Edit2Icon,
  FileTextIcon,
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
  StoreIcon,
  TerminalIcon,
  Trash2Icon,
  WrenchIcon,
  ZapIcon,
} from "@mdevs/icons";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { McpInspectToolsModal } from "@/components/mcp/mcp-inspect-modal";
import { McpLibraryTab } from "@/components/mcp/mcp-library-tab";
import { McpLogsTab } from "@/components/mcp/mcp-logs-tab";
import { McpServerModal } from "@/components/mcp/mcp-server-modal";
import { McpServersTab } from "@/components/mcp/mcp-servers-tab";
import { McpSettingsTab } from "@/components/mcp/mcp-settings-tab";
import { McpStoreTab } from "@/components/mcp/mcp-store-tab";
import { McpTutorialTab } from "@/components/mcp/mcp-tutorial-tab";
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
import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { McpLog, McpServer } from "@/lib/db/schema";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { cn, fetcher } from "@/lib/utils";

// Catalogue MCP servi par /api/mcp/templates : il provient du catalogue statique
// (lib/mcp-templates), source de vérité unique. Aucune liste locale de modèles
// n'est maintenue ici, sinon elle diverge (c'était le cas des presets et du
// Store, dont 5 connecteurs sur 6 ne résolvaient aucun template).
type McpTemplateRow = {
  activation: "ready" | "requires_oauth_flow" | "requires_vetted_stdio";
  args: string;
  authType: string;
  command: string;
  description: string;
  icon: string;
  id: string;
  minTier: string;
  name: string;
  readOnly: boolean;
  requireApproval: string;
  tags: string[];
  transport: string;
  url: string;
};

// Visuel des connecteurs mis en avant dans le Store : appariement par
// identifiant de catalogue (et non par nom, qui n'était pas stable).
const STORE_CONNECTORS: ReadonlyArray<{
  color: string;
  highlight: string;
  icon: React.ComponentType<any>;
  templateId: string;
  tint: string;
}> = [
  {
    color: "text-violet-600 dark:text-violet-400",
    highlight: "Docs & bases Notion",
    icon: FileTextIcon,
    templateId: "notion",
    tint: "bg-violet-500/10",
  },
  {
    color: "text-orange-600 dark:text-orange-400",
    highlight: "Recherche web privée",
    icon: SearchIcon,
    templateId: "brave-search",
    tint: "bg-orange-500/10",
  },
  {
    color: "text-cyan-600 dark:text-cyan-400",
    highlight: "PostgreSQL hébergé",
    icon: DatabaseIcon,
    templateId: "supabase",
    tint: "bg-cyan-500/10",
  },
  {
    color: "text-sky-600 dark:text-sky-400",
    highlight: "Paiements & factures",
    icon: CreditCardIcon,
    templateId: "stripe",
    tint: "bg-sky-500/10",
  },
];

// Garde-fous de typage pour les valeurs libres du catalogue (aucun `any`).
const MCP_TRANSPORTS = ["sse", "http", "stdio", "websocket"] as const;
const MCP_AUTH_TYPES = [
  "none",
  "bearer",
  "basic",
  "oauth2",
  "custom_headers",
] as const;
const MCP_APPROVALS = ["always_allow", "ask_permission", "write_only"] as const;

function pickOption<T extends readonly string[]>(
  options: T,
  value: unknown,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && options.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}
export default function McpClient({
  embedded = false,
  initialCreate = false,
  searchQuery = "",
}: {
  embedded?: boolean;
  initialCreate?: boolean;
  searchQuery?: string;
} = {}) {
  const {
    data,
    isLoading,
    mutate: mutateServers,
  } = useSWR<{
    servers: McpServer[];
    stats: { servers: number; totalCalls: number };
  }>("/api/mcp", fetcher);
  const [activeTab, setActiveTab] = useState<
    "store" | "servers" | "library" | "tutorial" | "logs" | "settings"
  >("servers");
  const { data: logs = [], mutate: mutateLogs } = useSWR<McpLog[]>(
    "/api/mcp/logs",
    fetcher,
    {
      refreshInterval: activeTab === "logs" ? 10_000 : 0,
      revalidateOnFocus: false,
    }
  );
  const { data: tplData, mutate: mutateTpl } = useSWR<{
    templates: McpTemplateRow[];
  }>("/api/mcp/templates", fetcher);
  const templates = useMemo(() => tplData?.templates ?? [], [tplData]);
  // Modèles réellement installables : les autres restent visibles avec leur
  // badge, sans bouton actif. Le serveur refuse de toute façon leur
  // installation.
  const installableTemplates = useMemo(
    () => templates.filter((tpl) => tpl.activation === "ready"),
    [templates]
  );
  // Store : uniquement les connecteurs dont le modèle existe réellement dans le
  // catalogue (sinon la carte n'est pas affichée du tout).
  const storeConnectors = useMemo(
    () =>
      STORE_CONNECTORS.flatMap((connector) => {
        const tpl = templates.find(
          (candidate) => candidate.id === connector.templateId
        );
        return tpl && tpl.activation === "ready" ? [{ connector, tpl }] : [];
      }),
    [templates]
  );
  const servers = data?.servers ?? [];
  const stats = data?.stats ?? { servers: 0, totalCalls: 0 };
  // Recherche fournie par la barre globale de la page Outils ; l'ancienne
  // recherche « serveurs » et « store » locale a été supprimée.
  const [installingConnector, setInstallingConnector] = useState<string | null>(
    null
  );
  const [isServerModalOpen, setIsServerModalOpen] = useState(initialCreate);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [serverToDelete, setSkillToDelete] = useState<McpServer | null>(null);
  const [isInspectingTools, setIsInspectingTools] = useState<McpServer | null>(
    null
  );
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTransport, setFormTransport] = useState<
    "sse" | "http" | "stdio" | "websocket"
  >("http");
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
    fetcher,
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
        setMcpRetention(Math.min(mcpPrefsData.retentionDays, 50));
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
          retentionDays: Math.min(Math.max(Math.round(mcpRetention), 1), 50),
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
    if (
      !(await confirmInApp(
        "Purger TOUS les journaux d'appels MCP ? Cette action est irréversible."
      ))
    ) {
      return;
    }
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
  const handleNewServer = (template?: McpTemplateRow | null) => {
    setEditingServer(null);
    setTestResult(null);
    setFormName(template?.name ?? "");
    setFormDescription(template?.description ?? "");
    setFormTransport(pickOption(MCP_TRANSPORTS, template?.transport, "http"));
    setFormUrl(template?.url ?? "");
    setFormCommand(template?.command ?? "");
    setFormArgs(template?.args ?? "");
    setFormAuthType(pickOption(MCP_AUTH_TYPES, template?.authType, "none"));
    setFormToken("");
    setFormUsername("");
    setFormPassword("");
    setFormHeaders("");
    setFormRequireApproval(
      pickOption(MCP_APPROVALS, template?.requireApproval, "write_only")
    );
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
        throw new Error(
          extractApiErrorMessage(data) || "Erreur lors du rafraîchissement"
        );
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
  const handleInstallTemplate = async (tpl: McpTemplateRow) => {
    if (tpl.activation !== "ready") {
      toast.error(
        tpl.activation === "requires_vetted_stdio"
          ? `${tpl.name} attend un wrapper stdio vérifié par l'infrastructure.`
          : `${tpl.name} utilise un flux OAuth interactif non pris en charge pour le moment.`
      );
      return;
    }
    try {
      const res = await fetch("/api/mcp/templates", {
        body: JSON.stringify({ templateId: tpl.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractApiErrorMessage(data) || "Erreur installation");
      }
      toast.success(data.message);
      await mutateServers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur installation");
    }
  };
  const handleCopyTemplate = async (tpl: McpTemplateRow) => {
    await navigator.clipboard.writeText(JSON.stringify(tpl, null, 2));
    toast.success("Template copié !");
  };
  // Store : activation en un clic — installe le template, ou active/désactive si déjà connecté
  const handleStoreConnector = async (
    connector: (typeof STORE_CONNECTORS)[number],
    installed: McpServer | undefined
  ) => {
    const tpl = templates.find(
      (candidate) => candidate.id === connector.templateId
    );
    if (installed) {
      if (installingConnector) {
        return;
      }
      setInstallingConnector(tpl?.name ?? connector.templateId);
      await handleToggleEnabled(installed);
      setInstallingConnector(null);
      return;
    }
    if (!tpl) {
      // Le catalogue ne propose plus ce modèle : on ne laisse pas un bouton
      // inerte, on explique pourquoi.
      toast.error(
        `Le modèle « ${connector.templateId} » n'est plus proposé par le catalogue MCP.`
      );
      return;
    }
    setInstallingConnector(tpl.name);
    try {
      await handleInstallTemplate(tpl);
    } finally {
      setInstallingConnector(null);
    }
  };
  const handleExport = (fmt: string, scope: "servers" | "logs") => {
    const url =
      scope === "servers"
        ? `/api/mcp/export?format=${fmt}`
        : `/api/mcp/logs/export?format=${fmt}`;
    window.open(url, "_blank");
  };
  const handlePurgeLogs = async () => {
    if (
      !(await confirmInApp(
        "Purger TOUS les journaux d'appels MCP ? Cette action est irréversible."
      ))
    ) {
      return;
    }
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
  // Recherche globale : filtrage puis tri par pertinence (nom > description >
  // transport) et alphabétiquement.
  const filteredServers = useMemo(
    () =>
      sortByRelevance(
        servers.filter((s) =>
          matchesQuery(searchQuery, {
            primary: s.name,
            secondary: [s.description ?? "", s.transport],
          })
        ),
        searchQuery,
        (s) => ({
          primary: s.name,
          secondary: [s.description ?? "", s.transport],
        })
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
  // Rangée d'actions globale de la page Outils : on y porte les boutons
  // Exporter / Ajouter un serveur quand le panneau est intégré.
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (embedded) {
      setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
    }
  }, [embedded]);

  return (
    <div
      className={
        embedded
          ? "flex w-full flex-col text-foreground"
          : "flex flex-col min-h-screen bg-background text-foreground"
      }
    >
      {embedded && actionsAnchor
        ? createPortal(
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 gap-1.5 text-xs font-medium"
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
                  <DropdownMenuItem
                    onClick={() => handleExport("md", "servers")}
                  >
                    Serveurs MD
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("txt", "servers")}
                  >
                    Serveurs TXT
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleExport("json", "logs")}
                  >
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
            </div>,
            actionsAnchor
          )
        : null}
      <header
        className={
          embedded
            ? "hidden"
            : "sticky top-0 z-20 flex min-w-0 flex-col gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6"
        }
      >
        <div
          className={`flex items-center gap-3 ${embedded ? "justify-end" : "justify-between"}`}
        >
          {embedded ? null : (
            <div className="flex items-center gap-3">
              <PageBackButton
                fallbackHref="/tools?tab=plugins"
                label="Retour aux serveurs MCP"
              />
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CpuIcon className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
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
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex max-w-full items-center overflow-x-auto rounded-lg border border-border/50 bg-muted/20 p-0.5 text-xs [&>button]:shrink-0">
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === "store"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("store")}
              type="button"
            >
              <StoreIcon className="size-3.5 text-primary" />
              <span>Store ({STORE_CONNECTORS.length})</span>
            </button>
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
          {/* Recherche locale supprimée : la barre globale de la page Outils
              filtre le Store et la liste des serveurs. */}
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {activeTab === "store" && (
          <McpStoreTab
            handleStoreConnector={handleStoreConnector}
            installingConnector={installingConnector}
            searchQuery={searchQuery}
            servers={servers}
            setActiveTab={setActiveTab}
            storeConnectors={storeConnectors}
            templates={templates}
          />
        )}
        {activeTab === "servers" && (
          <McpServersTab
            filteredServers={filteredServers}
            handleEditServer={handleEditServer}
            handleNewServer={handleNewServer}
            handleRefreshTools={handleRefreshTools}
            handleToggleEnabled={handleToggleEnabled}
            installableTemplates={installableTemplates}
            isLoading={isLoading}
            servers={servers}
            setIsInspectingTools={setIsInspectingTools}
            setSkillToDelete={setSkillToDelete}
          />
        )}
        {activeTab === "library" && (
          <McpLibraryTab
            handleCopyTemplate={handleCopyTemplate}
            handleInstallTemplate={handleInstallTemplate}
            handleNewServer={handleNewServer}
            installableTemplates={installableTemplates}
            mutateTpl={mutateTpl}
            templates={templates}
          />
        )}
        {activeTab === "tutorial" && <McpTutorialTab />}
        {activeTab === "logs" && (
          <McpLogsTab
            filteredLogs={filteredLogs as any}
            handleExport={handleExport}
            handlePurgeLogs={handlePurgeLogs}
            logActionFilter={logActionFilter}
            logServerFilter={logServerFilter}
            logToolFilter={logToolFilter}
            mutateLogs={mutateLogs}
            setLogActionFilter={setLogActionFilter}
            setLogServerFilter={setLogServerFilter}
            setLogToolFilter={setLogToolFilter}
          />
        )}
        {activeTab === "settings" && (
          <McpSettingsTab
            handlePurgeMcp={handlePurgeMcp}
            handleSaveMcpPrefs={handleSaveMcpPrefs}
            isSavingMcpPrefs={isSavingMcpPrefs}
            mcpAllowStdio={mcpAllowStdio}
            mcpDefaultApproval={mcpDefaultApproval as any}
            mcpDefaultRateLimit={mcpDefaultRateLimit}
            mcpDefaultTimeout={mcpDefaultTimeout}
            mcpKillSwitch={mcpKillSwitch}
            mcpRetention={mcpRetention}
            setMcpAllowStdio={setMcpAllowStdio}
            setMcpDefaultApproval={setMcpDefaultApproval as any}
            setMcpDefaultRateLimit={setMcpDefaultRateLimit}
            setMcpDefaultTimeout={setMcpDefaultTimeout}
            setMcpKillSwitch={setMcpKillSwitch}
            setMcpRetention={setMcpRetention}
          />
        )}
      </main>
      <McpServerModal
        editingServer={editingServer as any}
        formArgs={formArgs}
        formAuthType={formAuthType}
        formCommand={formCommand}
        formDescription={formDescription}
        formEnvPairs={formEnvPairs}
        formHeaders={formHeaders}
        formName={formName}
        formPassword={formPassword}
        formRateLimit={formRateLimit}
        formRequireApproval={formRequireApproval}
        formTimeoutMs={formTimeoutMs}
        formToken={formToken}
        formTransport={formTransport}
        formUrl={formUrl}
        formUsername={formUsername}
        handleSaveServer={handleSaveServer}
        handleTestConnection={handleTestConnection}
        isOpen={isServerModalOpen}
        isSaving={isSaving}
        isTesting={isTesting}
        setFormArgs={setFormArgs}
        setFormAuthType={setFormAuthType}
        setFormCommand={setFormCommand}
        setFormDescription={setFormDescription}
        setFormEnvPairs={setFormEnvPairs}
        setFormHeaders={setFormHeaders}
        setFormName={setFormName}
        setFormPassword={setFormPassword}
        setFormRateLimit={setFormRateLimit}
        setFormRequireApproval={setFormRequireApproval}
        setFormTimeoutMs={setFormTimeoutMs}
        setFormToken={setFormToken}
        setFormTransport={setFormTransport}
        setFormUrl={setFormUrl}
        setFormUsername={setFormUsername}
        setIsOpen={setIsServerModalOpen}
        testResult={testResult}
      />
      <McpInspectToolsModal
        handleRefreshTools={handleRefreshTools as any}
        handleSetToolApproval={handleSetToolApproval as any}
        handleToggleTool={handleToggleTool as any}
        isInspectingTools={isInspectingTools as any}
        setIsInspectingTools={(s) => setIsInspectingTools(s as any)}
      />
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
