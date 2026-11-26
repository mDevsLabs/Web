"use client";
import {
  ActivityIcon,
  BookOpenIcon,
  CpuIcon,
  DownloadIcon,
  PlusIcon,
  ServerIcon,
  SettingsIcon,
  StoreIcon,
  WrenchIcon,
} from "@mdevs/icons";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { McpInspectToolsModal } from "@/components/mcp/mcp-inspect-modal";
import { McpLibraryTab } from "@/components/mcp/mcp-library-tab";
import { McpLogsTab } from "@/components/mcp/mcp-logs-tab";
import {
  McpServerModal,
  type ParsedMcpJsonImport,
} from "@/components/mcp/mcp-server-modal";
import { McpServersTab } from "@/components/mcp/mcp-servers-tab";
import { McpSettingsTab } from "@/components/mcp/mcp-settings-tab";
import { McpStoreTab } from "@/components/mcp/mcp-store-tab";
import { McpTutorialTab } from "@/components/mcp/mcp-tutorial-tab";
import {
  MCP_APPROVALS,
  MCP_AUTH_TYPES,
  MCP_TRANSPORTS,
  type McpEnvPair,
  type McpTemplateRow,
  pickOption,
  STORE_CONNECTORS,
} from "@/components/mcp/mcp-types";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { McpLogDto, McpServerDto } from "@/lib/mcp/dto";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { cn, fetcher } from "@/lib/utils";
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
    servers: McpServerDto[];
    stats: { servers: number; totalCalls: number };
  }>("/api/mcp", fetcher);
  const [activeTab, setActiveTab] = useState<
    "store" | "servers" | "library" | "tutorial" | "logs" | "settings"
  >("servers");
  const { data: logs = [], mutate: mutateLogs } = useSWR<McpLogDto[]>(
    "/api/mcp/logs",
    fetcher,
    {
      refreshInterval: activeTab === "logs" ? 120_000 : 0,
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
  const [editingServer, setEditingServer] = useState<McpServerDto | null>(null);
  const [serverToDelete, setServerToDelete] = useState<McpServerDto | null>(
    null
  );
  const [isInspectingTools, setIsInspectingTools] =
    useState<McpServerDto | null>(null);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [refreshingServerId, setRefreshingServerId] = useState<string | null>(
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
  const [formClientId, setFormClientId] = useState("");
  const [formClientSecret, setFormClientSecret] = useState("");
  const [formTokenUrl, setFormTokenUrl] = useState("");
  const [formHeaders, setFormHeaders] = useState("");
  const [formRequireApproval, setFormRequireApproval] = useState<
    "always_allow" | "ask_permission" | "write_only"
  >("write_only");
  const [formTimeoutMs, setFormTimeoutMs] = useState(15_000);
  const [formRateLimit, setFormRateLimit] = useState(60);
  const [formEnvPairs, setFormEnvPairs] = useState<McpEnvPair[]>([]);
  const [removedSecrets, setRemovedSecrets] = useState<
    Array<{ kind: "auth" | "env" | "header"; key: string }>
  >([]);
  const [templateSecretDrafts, setTemplateSecretDrafts] = useState<
    Record<string, string>
  >({});
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
    setFormClientId("");
    setFormClientSecret("");
    setFormTokenUrl("");
    setFormHeaders("");
    setFormRequireApproval(
      pickOption(MCP_APPROVALS, template?.requireApproval, "write_only")
    );
    setFormTimeoutMs(15_000);
    setFormRateLimit(60);
    setFormEnvPairs([]);
    setRemovedSecrets([]);
    setTemplateSecretDrafts({});
    setIsServerModalOpen(true);
  };
  const handleEditServer = (s: McpServerDto) => {
    setEditingServer(s);
    setTestResult(null);
    setFormName(s.name);
    setFormDescription(s.description ?? "");
    setFormTransport(pickOption(MCP_TRANSPORTS, s.transport, "sse"));
    setFormUrl(s.url ?? "");
    setFormCommand(s.command ?? "");
    setFormArgs(Array.isArray(s.args) ? s.args.join(" ") : "");
    setFormAuthType(pickOption(MCP_AUTH_TYPES, s.authType, "none"));
    // Les secrets vivent chiffrés côté serveur : l'édition affiche les clés
    // déjà configurées via `secretKeys` et ne demande que les nouvelles valeurs.
    setFormToken("");
    setFormUsername("");
    setFormPassword("");
    setFormClientId("");
    setFormClientSecret("");
    setFormTokenUrl("");
    setFormHeaders("");
    setFormRequireApproval(
      pickOption(MCP_APPROVALS, s.requireApproval, "write_only")
    );
    setFormTimeoutMs(s.timeoutMs ?? 15_000);
    setFormRateLimit(s.rateLimitPerMin ?? 60);
    setFormEnvPairs(
      (s.secretKeys?.env ?? []).map((key) => ({
        configured: true,
        k: key,
        v: "",
      }))
    );
    setRemovedSecrets([]);
    setTemplateSecretDrafts({});
    setIsServerModalOpen(true);
  };
  const handleDuplicateServer = (s: McpServerDto) => {
    setEditingServer(null);
    setTestResult(null);
    setFormName(`${s.name} (copie)`);
    setFormDescription(s.description ?? "");
    setFormTransport(pickOption(MCP_TRANSPORTS, s.transport, "http"));
    setFormUrl(s.url ?? "");
    setFormCommand(s.command ?? "");
    setFormArgs(Array.isArray(s.args) ? s.args.join(" ") : "");
    setFormAuthType(pickOption(MCP_AUTH_TYPES, s.authType, "none"));
    setFormToken("");
    setFormUsername("");
    setFormPassword("");
    setFormClientId("");
    setFormClientSecret("");
    setFormTokenUrl("");
    setFormHeaders("");
    setFormRequireApproval(
      pickOption(MCP_APPROVALS, s.requireApproval, "write_only")
    );
    setFormTimeoutMs(s.timeoutMs ?? 15_000);
    setFormRateLimit(s.rateLimitPerMin ?? 60);
    setFormEnvPairs([]);
    setRemovedSecrets([]);
    setTemplateSecretDrafts({});
    setIsServerModalOpen(true);
  };
  const handleApplyJsonImport = (imported: ParsedMcpJsonImport) => {
    if (imported.name) setFormName(imported.name);
    if (imported.transport) setFormTransport(imported.transport);
    if (imported.url !== undefined) setFormUrl(imported.url);
    if (imported.command !== undefined) setFormCommand(imported.command);
    if (imported.args !== undefined) setFormArgs(imported.args);
    if (imported.env) setFormEnvPairs(imported.env);
    if (imported.headers) {
      setFormHeaders(imported.headers);
      setFormAuthType("custom_headers");
    }
    toast.success("Configuration JSON importée dans le formulaire.");
  };
  const handleMarkRemoveSecret = (
    kind: "auth" | "env" | "header",
    key: string
  ) => {
    setRemovedSecrets((prev) =>
      prev.some((item) => item.kind === kind && item.key === key)
        ? prev
        : [...prev, { key, kind }]
    );
  };
  const handleQuickTestServer = async (s: McpServerDto) => {
    setTestingServerId(s.id);
    try {
      const res = await fetch("/api/mcp/test", {
        body: JSON.stringify({
          authType: pickOption(MCP_AUTH_TYPES, s.authType, "none"),
          name: s.name,
          serverId: s.id,
          transport: pickOption(MCP_TRANSPORTS, s.transport, "http"),
          url: s.url ?? undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${s.name} : ${data.message}`);
      } else {
        toast.error(`${s.name} : ${data.message || "Échec du test"}`);
      }
    } catch {
      toast.error(`Échec du test de connexion pour ${s.name}`);
    } finally {
      setTestingServerId(null);
    }
  };
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    let parsedHeaders: Record<string, string> | undefined;
    if (formHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(formHeaders);
      } catch {
        toast.error("Format JSON invalide pour les en-têtes");
        setIsTesting(false);
        return;
      }
    }
    const authConfigPayload: Record<string, string> = {};
    if (formToken.trim()) authConfigPayload.token = formToken.trim();
    if (formUsername.trim()) authConfigPayload.username = formUsername.trim();
    if (formPassword.trim()) authConfigPayload.password = formPassword.trim();
    if (formClientId.trim()) authConfigPayload.clientId = formClientId.trim();
    if (formClientSecret.trim()) {
      authConfigPayload.clientSecret = formClientSecret.trim();
    }
    if (formTokenUrl.trim()) authConfigPayload.tokenUrl = formTokenUrl.trim();
    try {
      const res = await fetch("/api/mcp/test", {
        body: JSON.stringify({
          args: formArgs ? formArgs.split(" ").filter(Boolean) : [],
          ...(Object.keys(authConfigPayload).length > 0
            ? { authConfig: authConfigPayload }
            : {}),
          authType: formAuthType,
          command: formCommand,
          ...(parsedHeaders ? { headers: parsedHeaders } : {}),
          name: formName || "Test Server",
          ...(editingServer ? { serverId: editingServer.id } : {}),
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
    let parsedHeaders: Record<string, string> | undefined;
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
      if (p.k.trim() && p.v.trim()) {
        envObj[p.k.trim()] = p.v;
      }
    }
    const authConfigPayload: Record<string, string> = {};
    if (formToken.trim()) authConfigPayload.token = formToken.trim();
    if (formUsername.trim()) authConfigPayload.username = formUsername.trim();
    if (formPassword.trim()) authConfigPayload.password = formPassword.trim();
    if (formClientId.trim()) authConfigPayload.clientId = formClientId.trim();
    if (formClientSecret.trim()) {
      authConfigPayload.clientSecret = formClientSecret.trim();
    }
    if (formTokenUrl.trim()) authConfigPayload.tokenUrl = formTokenUrl.trim();
    setIsSaving(true);
    const payload: Record<string, unknown> = {
      args: formArgs ? formArgs.split(" ").filter(Boolean) : [],
      ...(Object.keys(authConfigPayload).length > 0
        ? { authConfig: authConfigPayload }
        : {}),
      authType: formAuthType,
      command: formCommand,
      description: formDescription,
      ...(Object.keys(envObj).length > 0 ? { env: envObj } : {}),
      ...(parsedHeaders ? { headers: parsedHeaders } : {}),
      name: formName,
      rateLimitPerMin: formRateLimit,
      requireApproval: formRequireApproval,
      timeoutMs: formTimeoutMs,
      transport: formTransport,
      url: formUrl,
      ...(editingServer && removedSecrets.length > 0
        ? { removeSecretKeys: removedSecrets }
        : {}),
    };
    try {
      if (editingServer) {
        const res = await fetch(`/api/mcp/${editingServer.id}`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            extractApiErrorMessage(errBody) || "Erreur de modification"
          );
        }
        const nonEmptyTemplateSecrets = Object.fromEntries(
          Object.entries(templateSecretDrafts).filter(
            ([, v]) => typeof v === "string" && v.trim().length > 0
          )
        );
        if (Object.keys(nonEmptyTemplateSecrets).length > 0) {
          const secRes = await fetch(`/api/mcp/${editingServer.id}`, {
            body: JSON.stringify({
              encryptedSecrets: nonEmptyTemplateSecrets,
            }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
          });
          if (!secRes.ok) {
            const secBody = await secRes.json().catch(() => null);
            throw new Error(
              extractApiErrorMessage(secBody) ||
                "Erreur lors de l'enregistrement des identifiants"
            );
          }
        }
        toast.success("Serveur MCP mis à jour !");
      } else {
        const res = await fetch("/api/mcp", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            extractApiErrorMessage(errBody) || "Erreur de création"
          );
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
  const handleToggleEnabled = async (s: McpServerDto) => {
    try {
      const res = await fetch(`/api/mcp/${s.id}`, {
        body: JSON.stringify({ toggleEnabled: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(
          extractApiErrorMessage(errBody) ||
            "Impossible de basculer l'état du serveur"
        );
      }
      toast.success(
        s.isEnabled
          ? `Serveur "${s.name}" désactivé`
          : `Serveur "${s.name}" activé`
      );
      await mutateServers();
    } catch (err: any) {
      toast.error(err?.message ?? "Impossible de basculer l'état du serveur");
    }
  };
  const handleRefreshTools = async (s: McpServerDto) => {
    setRefreshingServerId(s.id);
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
    } finally {
      setRefreshingServerId(null);
    }
  };
  const handleToggleTool = async (s: McpServerDto, toolName: string) => {
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
    s: McpServerDto,
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
      setServerToDelete(null);
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
    installed: McpServerDto | undefined
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
  const editingTemplateCredentials = useMemo(
    () =>
      editingServer?.templateId
        ? (templates.find((tpl) => tpl.id === editingServer.templateId)
            ?.credentials ?? [])
        : [],
    [editingServer?.templateId, templates]
  );

  // Rangée d'actions globale de la page Outils : on y porte les boutons
  // Exporter / Ajouter un serveur quand le panneau est intégré.
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (embedded) {
      setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
    }
  }, [embedded]);

  const actionsToolbar = (
    <div className="flex items-center gap-2 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 gap-1.5 text-xs font-medium" variant="outline">
            <DownloadIcon className="size-3.5" />
            <span>Exporter</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("json", "servers")}>
            Serveurs JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("csv", "servers")}>
            Serveurs CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("md", "servers")}>
            Serveurs MD
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("txt", "servers")}>
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
  );

  return (
    <div
      className={
        embedded
          ? "flex w-full flex-col text-foreground"
          : "flex flex-col min-h-screen bg-background text-foreground"
      }
    >
      {embedded && actionsAnchor
        ? createPortal(actionsToolbar, actionsAnchor)
        : null}
      <header
        className={
          embedded
            ? "hidden"
            : "sticky top-0 z-20 flex min-w-0 flex-col gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6"
        }
      >
        <div
          className={`flex flex-wrap items-center gap-3 ${embedded ? "justify-end" : "justify-between"}`}
        >
          {embedded ? null : (
            <>
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
              {actionsToolbar}
            </>
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
              <WrenchIcon className="size-3.5 text-warning" />
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
              <BookOpenIcon className="size-3.5 text-info" />
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
              <ActivityIcon className="size-3.5 text-success" />
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
              <SettingsIcon className="size-3.5 text-muted-foreground" />
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
            handleDuplicateServer={handleDuplicateServer}
            handleEditServer={handleEditServer}
            handleNewServer={handleNewServer}
            handleQuickTestServer={handleQuickTestServer}
            handleRefreshTools={handleRefreshTools}
            handleToggleEnabled={handleToggleEnabled}
            installableTemplates={installableTemplates}
            isLoading={isLoading}
            refreshingServerId={refreshingServerId}
            servers={servers}
            setIsInspectingTools={setIsInspectingTools}
            setServerToDelete={setServerToDelete}
            testingServerId={testingServerId}
          />
        )}
        {activeTab === "library" && (
          <McpLibraryTab
            handleCopyTemplate={handleCopyTemplate}
            handleInstallTemplate={handleInstallTemplate}
            handleNewServer={handleNewServer}
            installableTemplates={installableTemplates}
            mutateTpl={mutateTpl}
            servers={servers}
            templates={templates}
          />
        )}
        {activeTab === "tutorial" && <McpTutorialTab />}
        {activeTab === "logs" && (
          <McpLogsTab
            filteredLogs={filteredLogs}
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
            mcpDefaultApproval={mcpDefaultApproval}
            mcpDefaultRateLimit={mcpDefaultRateLimit}
            mcpDefaultTimeout={mcpDefaultTimeout}
            mcpKillSwitch={mcpKillSwitch}
            mcpRetention={mcpRetention}
            setMcpAllowStdio={setMcpAllowStdio}
            setMcpDefaultApproval={setMcpDefaultApproval}
            setMcpDefaultRateLimit={setMcpDefaultRateLimit}
            setMcpDefaultTimeout={setMcpDefaultTimeout}
            setMcpKillSwitch={setMcpKillSwitch}
            setMcpRetention={setMcpRetention}
          />
        )}
      </main>
      <McpServerModal
        editingServer={editingServer}
        formArgs={formArgs}
        formAuthType={formAuthType}
        formClientId={formClientId}
        formClientSecret={formClientSecret}
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
        formTokenUrl={formTokenUrl}
        formTransport={formTransport}
        formUrl={formUrl}
        formUsername={formUsername}
        handleSaveServer={handleSaveServer}
        handleTestConnection={handleTestConnection}
        isOpen={isServerModalOpen}
        isSaving={isSaving}
        isTesting={isTesting}
        onApplyJsonImport={handleApplyJsonImport}
        onMarkRemoveSecret={handleMarkRemoveSecret}
        removedSecrets={removedSecrets}
        setFormArgs={setFormArgs}
        setFormAuthType={setFormAuthType}
        setFormClientId={setFormClientId}
        setFormClientSecret={setFormClientSecret}
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
        setFormTokenUrl={setFormTokenUrl}
        setFormTransport={setFormTransport}
        setFormUrl={setFormUrl}
        setFormUsername={setFormUsername}
        setIsOpen={setIsServerModalOpen}
        setTemplateSecretDrafts={setTemplateSecretDrafts}
        templateCredentials={editingTemplateCredentials}
        templateSecretDrafts={templateSecretDrafts}
        testResult={testResult}
      />
      <McpInspectToolsModal
        handleRefreshTools={handleRefreshTools}
        handleSetToolApproval={handleSetToolApproval}
        handleToggleTool={handleToggleTool}
        isInspectingTools={isInspectingTools}
        setIsInspectingTools={setIsInspectingTools}
      />
      <AlertDialog
        onOpenChange={(open) => !open && setServerToDelete(null)}
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
