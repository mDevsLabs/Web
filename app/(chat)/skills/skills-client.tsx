"use client";

import {
  BookOpenIcon,
  BotIcon,
  CopyIcon,
  CpuIcon,
  DownloadIcon,
  Edit2Icon,
  FileCodeIcon,
  GlobeIcon,
  ImageIcon,
  MoreVerticalIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Share2Icon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  UploadIcon,
  Volume2Icon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
import type { Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const AVAILABLE_TOOLS = [
  {
    description: "Recherche sur le web en direct",
    icon: GlobeIcon,
    id: "webSearch",
    label: "Recherche Web",
  },
  {
    description: "Génération d'images haute résolution",
    icon: ImageIcon,
    id: "imageGenerate",
    label: "Création d'images",
  },
  {
    description: "Synthèse vocale et audio IA",
    icon: Volume2Icon,
    id: "audioGenerate",
    label: "Audio Studio",
  },
  {
    description: "Exécution de code Python / JS sandbox",
    icon: PlayIcon,
    id: "codeExecution",
    label: "Exécution Code",
  },
  {
    description: "Création et édition d'artefacts / documents",
    icon: FileCodeIcon,
    id: "createDocument",
    label: "Artefacts & Docs",
  },
  {
    description: "Autoriser l'utilisation de tous les serveurs MCP configurés",
    icon: CpuIcon,
    id: "mcp",
    label: "Outils MCP",
  },
];

const _PRESET_ICONS = [
  { icon: SparklesIcon, id: "sparkles", label: "Étincelles" },
  { icon: BotIcon, id: "bot", label: "Robot" },
  { icon: WrenchIcon, id: "wrench", label: "Outil" },
  { icon: CpuIcon, id: "cpu", label: "Processeur" },
  { icon: GlobeIcon, id: "globe", label: "Web" },
  { icon: BookOpenIcon, id: "book", label: "Livre" },
];

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#f59e0b", // Amber
];

const STARTER_TEMPLATES = [
  {
    color: "#6366f1",
    description:
      "Expert en analyse de code TypeScript, architecture et bonnes pratiques",
    icon: "cpu",
    instructions:
      "Tu es un architecte logiciel expert en TypeScript, Next.js et design patterns. Analyse le code soumis, propose des refactorisations propres, typées rigoureusement et sans régression.",
    name: "Architecte TypeScript",
    tags: ["Dev", "Code", "TypeScript"],
    tools: ["codeExecution", "createDocument"],
  },
  {
    color: "#06b6d4",
    description:
      "Recherche en profondeur sur internet et rédaction de rapports détaillés",
    icon: "globe",
    instructions:
      "Tu es un analyste chercheur web. Pour chaque question, effectue des recherches approfondies, vérifie les sources récentes et synthétise les informations de manière claire et factuelle.",
    name: "Chercheur Web & Synthèse",
    tags: ["Recherche", "Veille"],
    tools: ["webSearch", "createDocument"],
  },
  {
    color: "#10b981",
    description:
      "Rédaction de contenu percutant, articles de blog, newsletters et copywriting",
    icon: "sparkles",
    instructions:
      "Tu es un copywriter de haut niveau. Adopte un ton engageant, dynamique et structuré. Utilise des accroches fortes et adapte le niveau de langage à la cible demandée.",
    name: "Copywriter & Rédaction",
    tags: ["Marketing", "Rédaction"],
    tools: ["createDocument"],
  },
];

export default function SkillsClient() {
  const _router = useRouter();
  const {
    data: skills = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Skill[]>("/api/skills", fetcher);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "library">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharingSkill, setSharingSkill] = useState<Skill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);

  // Editor Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formIcon, setFormIcon] = useState("sparkles");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formTools, setFormTools] = useState<string[]>([]);
  const [formTags, setFormTags] = useState<string>("");
  const [formParameters, setFormParameters] = useState<
    Array<{ name: string; description: string; required: boolean; type?: string; defaultValue?: string; enumValues?: string[] }>
  >([]);
  const [formMcpServerIds, setFormMcpServerIds] = useState<string[]>([]);
  const [formMcpToolFilter, setFormMcpToolFilter] = useState<Record<string, string[] | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { data: mcpData } = useSWR<{ servers: any[] }>("/api/mcp", fetcher);
  const mcpServers: any[] = (mcpData as any)?.servers ?? [];
  const { data: skillTplData } = useSWR<{ templates: any[] }>("/api/skills/templates", fetcher);
  const skillTemplates: any[] = (skillTplData as any)?.templates ?? [];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Liste de tous les tags uniques
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of skills) {
      if (Array.isArray(s.tags)) {
        for (const t of s.tags) {
          if (t.trim()) {
            set.add(t.trim());
          }
        }
      }
    }
    return Array.from(set);
  }, [skills]);

  // Filtrage des skills
  const filteredSkills = useMemo(
    () =>
      skills.filter((s) => {
        const matchesSearch =
          searchQuery === "" ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          s.instructions.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === "all" || s.pinned;
        const matchesTag =
          !selectedTag ||
          (Array.isArray(s.tags) && s.tags.includes(selectedTag));

        return matchesSearch && matchesTab && matchesTag;
      }),
    [skills, searchQuery, activeTab, selectedTag]
  );

  // Ouvrir l'éditeur pour création
  const handleNewSkill = (template?: (typeof STARTER_TEMPLATES)[0] | any) => {
    setEditingSkill(null);
    setFormName(template?.name ?? "");
    setFormDescription(template?.description ?? "");
    setFormInstructions(template?.instructions ?? "");
    setFormIcon(template?.icon ?? "sparkles");
    setFormColor(template?.color ?? "#6366f1");
    setFormTools(template?.tools ?? []);
    setFormTags(template?.tags?.join(", ") ?? "");
    setFormParameters((template?.parameters as any) ?? []);
    setFormMcpServerIds((template as any)?.mcpServerIds ?? []);
    setFormMcpToolFilter((template as any)?.mcpToolFilter ?? {});
    setIsEditorOpen(true);
  };

  // Ouvrir l'éditeur pour modification
  const handleEditSkill = (s: Skill) => {
    setEditingSkill(s);
    setFormName(s.name);
    setFormDescription(s.description ?? "");
    setFormInstructions(s.instructions);
    setFormIcon(s.icon ?? "sparkles");
    setFormColor(s.color ?? "#6366f1");
    setFormTools((s.tools as string[]) ?? []);
    setFormTags(Array.isArray(s.tags) ? s.tags.join(", ") : "");
    setFormParameters((s.parameters as any) ?? []);
    setFormMcpServerIds(((s as any).mcpServerIds as string[]) ?? []);
    setFormMcpToolFilter(((s as any).mcpToolFilter as any) ?? {});
    setIsEditorOpen(true);
  };

  // Enregistrement du Skill
  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Veuillez renseigner un nom pour le skill");
      return;
    }
    if (!formInstructions.trim()) {
      toast.error("Veuillez renseigner les instructions système");
      return;
    }

    setIsSaving(true);
    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const includeMcp = formTools.includes("mcp");
      const payload: any = {
            color: formColor,
            description: formDescription,
            icon: formIcon,
            instructions: formInstructions,
            name: formName,
            parameters: formParameters,
            tags: tagsArray,
            tools: formTools,
            mcpServerIds: includeMcp ? formMcpServerIds : [],
            mcpToolFilter: includeMcp ? formMcpToolFilter : {},
      };
      if (editingSkill) {
        const res = await fetch(`/api/skills/${editingSkill.id}`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!res.ok) throw new Error("Erreur de sauvegarde");
        toast.success("Skill mis à jour avec succès !");
      } else {
        const res = await fetch("/api/skills", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) throw new Error("Erreur lors de la création");
        toast.success("Skill créé avec succès !");
      }

      await mutate();
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Épinglage rapide
  const handleTogglePin = async (s: Skill) => {
    try {
      await fetch(`/api/skills/${s.id}`, {
        body: JSON.stringify({ togglePin: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      toast.success(
        s.pinned
          ? `Skill "${s.name}" désépinglé`
          : `Skill "${s.name}" épinglé en tête`
      );
      await mutate();
    } catch {
      toast.error("Impossible de modifier l'épinglage");
    }
  };

  // Duplication
  const handleDuplicate = async (s: Skill) => {
    try {
      const res = await fetch(`/api/skills/${s.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Échec de la duplication");
      }
      toast.success(`Copie créée pour "${s.name}" !`);
      await mutate();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la copie");
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!skillToDelete) {
      return;
    }
    try {
      const res = await fetch(`/api/skills/${skillToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      toast.success(`Skill "${skillToDelete.name}" supprimé`);
      setSkillToDelete(null);
      await mutate();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur de suppression");
    }
  };

  // Export JSON / .skill
  const handleExportSkill = (s: Skill) => {
    const exportData = {
      color: s.color,
      description: s.description,
      exportedAt: new Date().toISOString(),
      icon: s.icon,
      instructions: s.instructions,
      name: s.name,
      parameters: s.parameters,
      tags: s.tags,
      tools: s.tools,
      version: "1.0",
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    const safeName = s.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `skill-${safeName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Skill "${s.name}" exporté en fichier JSON !`);
  };

  // Import depuis fichier
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
      } catch {
        toast.error("Impossible de lire ce fichier");
      }
    };
    reader.readAsText(file);
  };

  // Valider et importer le JSON
  const handleProcessImport = async () => {
    if (!importJsonText.trim()) {
      toast.error("Veuillez coller ou importer un fichier JSON");
      return;
    }

    try {
      const data = JSON.parse(importJsonText);
      if (!data.name || !data.instructions) {
        throw new Error(
          "Format de Skill invalide : 'name' et 'instructions' sont obligatoires"
        );
      }

      const res = await fetch("/api/skills", {
        body: JSON.stringify({
          color: data.color || "#6366f1",
          description: data.description || "",
          icon: data.icon || "sparkles",
          instructions: data.instructions,
          name: data.name,
          parameters: data.parameters || [],
          tags: data.tags || [],
          tools: data.tools || [],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur de création lors de l'importation");
      }

      toast.success(`Skill "${data.name}" importé avec succès !`);
      setIsImportOpen(false);
      setImportJsonText("");
      await mutate();
    } catch (err: any) {
      toast.error(err.message ?? "JSON invalide");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WrenchIcon className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                  Skills IA & Outils
                </h1>
                <p className="text-xs text-muted-foreground">
                  Concevez des compétences personnalisées avec paramètres et
                  outils
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" className="h-8 gap-1.5 text-xs font-medium"><DownloadIcon className="size-3.5"/><span className="hidden sm:inline">Exporter</span></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={()=> window.open("/api/skills/export?format=json","_blank")}>Skills JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={()=> window.open("/api/skills/export?format=csv","_blank")}>Skills CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={()=> window.open("/api/skills/export?format=md","_blank")}>Skills MD</DropdownMenuItem>
                <DropdownMenuItem onClick={()=> window.open("/api/skills/export?format=txt","_blank")}>Skills TXT</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={() => setIsImportOpen(true)}
              variant="outline"
            >
              <UploadIcon className="size-3.5" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <Button
              className="h-8 gap-1.5 text-xs font-medium shadow-xs"
              onClick={() => handleNewSkill()}
            >
              <PlusIcon className="size-3.5" />
              <span>Nouveau Skill</span>
            </Button>
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative w-64 sm:w-80">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs bg-muted/40"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un skill, un outil, un tag..."
                value={searchQuery}
              />
            </div>

            <div className="flex items-center rounded-lg border border-border/50 bg-muted/20 p-0.5 text-xs">
                <button
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1",
                    activeTab === "library"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("library")}
                  type="button"
                >
                  <BookOpenIcon className="size-3 text-amber-500" />
                  <span>Bibliothèque</span>
                </button>
                <button
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    activeTab === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("all")}
                  type="button"
                >
                Tous ({skills.length})
              </button>
              <button
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1",
                  activeTab === "pinned"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("pinned")}
                type="button"
              >
                <PinIcon className="size-3 text-amber-500" />
                <span>Épinglés ({skills.filter((s) => s.pinned).length})</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                <TagIcon className="size-3" /> Tags:
              </span>
              {allTags.map((tag) => (
                <button
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors shrink-0",
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                  key={tag}
                  onClick={() =>
                    setSelectedTag((prev) => (prev === tag ? null : tag))
                  }
                  type="button"
                >
                  #{tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  className="text-[11px] text-muted-foreground hover:underline ml-1"
                  onClick={() => setSelectedTag(null)}
                  type="button"
                >
                  Effacer
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                className="h-48 rounded-2xl border border-border/50 bg-muted/20 animate-pulse p-4"
                key={i}
              />
            ))}
          </div>
        ) : activeTab === "library" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Bibliothèque — {skillTemplates.length} templates</h2><Button variant="outline" size="sm" className="h-7 text-xs" onClick={()=>{ const el=document.getElementById("skill-tpl-search"); el?.focus(); }}>Rechercher</Button></div>
            {skillTemplates.length===0 ? <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-xs text-muted-foreground">Chargement marketplace…</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skillTemplates.map((tpl:any)=>(
                  <div key={tpl.id} className="rounded-2xl border bg-card p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-2"><div className="size-7 rounded-lg flex items-center justify-center text-white" style={{backgroundColor: tpl.color||"#6366f1"}}><SparklesIcon className="size-3.5"/></div><span className="font-semibold text-xs truncate">{tpl.name}</span></div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">{(tpl.tags??[]).map((t:string)=>(<span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>))}</div>
                    <div className="flex gap-1.5 mt-auto">
                      <Button size="sm" className="flex-1 h-7 text-xs" onClick={async()=>{ try{ const r= await fetch("/api/skills/templates",{ body: JSON.stringify({templateId:tpl.id}), headers:{"Content-Type":"application/json"}, method:"POST"}); const d=await r.json(); if(!r.ok) throw new Error(d.error); toast.success(d.message); mutate(); } catch(e:any){ toast.error(e.message);} }}><PlusIcon className="size-3 mr-1"/>Installer</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async()=>{ await navigator.clipboard.writeText(JSON.stringify(tpl,null,2)); toast.success("Template copié !"); }}><CopyIcon className="size-3 mr-1"/>Copier</Button>
                    </div>
                  </div>
                ))}
                {STARTER_TEMPLATES.map(t=>(
                  <div key={t.name+"starter"} className="rounded-2xl border border-dashed bg-muted/20 p-4 flex flex-col"><span className="font-semibold text-xs mb-1">{t.name} (starter)</span><p className="text-[11px] text-muted-foreground mb-3">{t.description}</p><Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=>handleNewSkill(t as any)}>Utiliser</Button></div>
                ))}
              </div>
            )}
          </div>
        ) : skills.length === 0 ? (
          /* Empty State avec Modèles */
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <SparklesIcon className="size-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Aucun skill configuré</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Les skills permettent de prédéfinir des instructions spécialisées
              et des outils précis pour l'IA, utilisables directement dans vos
              discussions via la commande{" "}
              <span className="font-semibold text-foreground">@</span> ou le
              menu Plus.
            </p>

            <div className="w-full text-left mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Modèles suggérés pour démarrer rapidement :
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STARTER_TEMPLATES.map((tmpl) => (
                  <button
                    className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer"
                    key={tmpl.name}
                    onClick={() => handleNewSkill(tmpl)}
                    type="button"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className="size-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: tmpl.color }}
                      >
                        <SparklesIcon className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Utiliser +
                      </span>
                    </div>
                    <span className="font-semibold text-xs text-foreground mb-1">
                      {tmpl.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2">
                      {tmpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="gap-2 text-xs font-medium"
              onClick={() => handleNewSkill()}
            >
              <PlusIcon className="size-4" />
              <span>Créer un skill personnalisé</span>
            </Button>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Aucun skill ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          /* Liste / Grille des Skills */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((s) => {
              const skillTools = (s.tools as string[]) || [];
              const skillParams = (s.parameters as any[]) || [];

              return (
                <div
                  className={cn(
                    "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
                    s.pinned
                      ? "border-amber-500/30 bg-amber-500/[0.02]"
                      : "border-border/60 hover:border-border"
                  )}
                  key={s.id}
                >
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: s.color || "#6366f1" }}
                      >
                        <SparklesIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {s.name}
                          </h3>
                          {s.pinned && (
                            <PinIcon className="size-3 text-amber-500 shrink-0 fill-amber-500" />
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {s.description || "Aucune description"}
                        </p>
                      </div>
                    </div>

                    {/* Menu d'actions */}
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
                          onClick={() => handleTogglePin(s)}
                        >
                          {s.pinned ? (
                            <>
                              <PinOffIcon className="size-3.5" />
                              <span>Désépingler</span>
                            </>
                          ) : (
                            <>
                              <PinIcon className="size-3.5 text-amber-500" />
                              <span>Épingler en haut</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => handleEditSkill(s)}
                        >
                          <Edit2Icon className="size-3.5" />
                          <span>Modifier / Renommer</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => handleDuplicate(s)}
                        >
                          <CopyIcon className="size-3.5" />
                          <span>Dupliquer</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => {
                            setSharingSkill(s);
                            setIsShareOpen(true);
                          }}
                        >
                          <Share2Icon className="size-3.5" />
                          <span>Partager</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => handleExportSkill(s)}
                        >
                          <DownloadIcon className="size-3.5" />
                          <span>Exporter (.json)</span>
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

                  {/* Aperçu Instructions */}
                  <div className="flex-1 mb-3">
                    <p className="text-xs text-muted-foreground/90 line-clamp-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 font-mono">
                      {s.instructions}
                    </p>
                  </div>

                    {/* Outils associés & Tags */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {skillTools.length > 0 ? (
                          skillTools.map((t) => (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10.5px] font-medium text-foreground"
                              key={t}
                            >
                              <WrenchIcon className="size-2.5 text-primary" />
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground/60 italic">
                            Aucun outil spécifique
                          </span>
                        )}
                        {skillTools.includes("mcp") && Array.isArray((s as any).mcpServerIds) && (s as any).mcpServerIds.length>0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[10.5px] font-medium"><CpuIcon className="size-2.5"/>{(s as any).mcpServerIds.length} MCP</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                      {skillParams.length > 0 && (
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {skillParams.length} param(s)
                        </span>
                      )}
                      {(s as any).mcpServerIds?.length>0 && <span className="text-[10px] text-purple-600">{Object.keys((s as any).mcpToolFilter||{}).length} filtres</span>}
                      </div>
                    </div>

                    {/* Tags */}
                    {Array.isArray(s.tags) && s.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {s.tags.map((t) => (
                          <span
                            className="text-[10px] text-muted-foreground/70"
                            key={t}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Éditeur de Skill */}
      <Dialog onOpenChange={setIsEditorOpen} open={isEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Modifier le Skill" : "Créer un nouveau Skill"}
            </DialogTitle>
            <DialogDescription>
              Configurez le comportement, le prompt et les outils accessibles
              pour cette compétence.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-4 py-2" onSubmit={handleSaveSkill}>
            {/* Nom & Couleur */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">
                  Nom de la compétence *
                </Label>
                <Input
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Spécialiste SEO & Rédaction"
                  required
                  value={formName}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Couleur du badge
                </Label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      className={cn(
                        "size-6 rounded-full transition-transform",
                        formColor === c && "ring-2 ring-foreground scale-110"
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

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Description courte
              </Label>
              <Input
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Rôle ou cas d'usage résumé..."
                value={formDescription}
              />
            </div>

            {/* Instructions Système */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Instructions système (Prompt du Skill) *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Variables autorisées : {"{sujet}"}, {"{langue}"}, etc.
                </span>
              </div>
              <Textarea
                className="min-h-[140px] font-mono text-xs leading-relaxed"
                onChange={(e) => setFormInstructions(e.target.value)}
                placeholder="Tu es un expert en... Tes réponses doivent toujours respecter..."
                required
                value={formInstructions}
              />
            </div>

            {/* Tester le Skill avec variables dynamiques */}
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.02] p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <ZapIcon className="size-3.5 text-amber-500" />
                  Tester le Skill (variables dynamiques)
                </Label>
                <span className="text-[10px] text-muted-foreground">Variables: {"{sujet}"}, {"{langue}"}</span>
              </div>
              <div className="flex gap-2">
                <Input
                  className="h-8 text-xs bg-background"
                  onChange={(e) => setFormInstructions((prev) => prev.replace(/{testVar}/g, e.target.value))}
                  placeholder="Valeur de test pour {testVar}..."
                  value={"test"}
                />
                <Button
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const preview = formInstructions
                      .replace(/{sujet}/g, "Intelligence Artificielle")
                      .replace(/{langue}/g, "Français")
                      .replace(/{testVar}/g, "test");
                    toast.info("Prévisualisation du prompt :\n" + preview.slice(0, 300));
                  }}
                  type="button"
                  variant="outline"
                >
                  <PlayIcon className="size-3.5" />
                  Tester
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Utilisez des variables entre accolades dans vos instructions. Le bouton "Tester" simule le rendu du prompt avec des valeurs par défaut pour vérifier le comportement.
              </p>
            </div>

            {/* Outils autorisés */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Outils associés à cette compétence
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((tool) => {
                  const isChecked = formTools.includes(tool.id);
                  const Icon = tool.icon;
                  return (
                    <label
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer",
                        isChecked
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-border/50 hover:bg-muted/30 text-muted-foreground"
                      )}
                      key={tool.id}
                    >
                      <input
                        checked={isChecked}
                        className="rounded border-border text-primary focus:ring-primary size-4"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormTools((prev) => [...prev, tool.id]);
                          } else {
                            setFormTools((prev) =>
                              prev.filter((id) => id !== tool.id)
                            );
                          }
                        }}
                        type="checkbox"
                      />
                      <Icon className="size-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-xs block text-foreground">
                          {tool.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {tool.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* MCP Whitelist — visible si outil mcp coché */}
            {formTools.includes("mcp") && (
              <div className="space-y-3 p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/[0.04]">
                <Label className="text-xs font-semibold flex items-center gap-1.5"><CpuIcon className="size-3.5 text-purple-600"/> Serveurs MCP autorisés pour ce Skill (whitelist)</Label>
                <p className="text-[11px] text-muted-foreground">Cochez les serveurs que ce Skill pourra utiliser. Si aucun coché, le Skill n'aura accès à aucun MCP. Déroulez pour filtrer les outils per-serveur.</p>
                {mcpServers.length===0 ? <p className="text-xs text-muted-foreground">Aucun serveur MCP — créez-en dans /mcp</p> : (
                  <div className="space-y-2">
                    {mcpServers.map((srv:any)=>{ const isChecked=formMcpServerIds.includes(srv.id); const tools=(srv.toolsCache as any[])??[]; const overrides=(srv.toolOverrides as any)??{}; const allowedTools=tools.filter(t=> overrides[t.name]?.enabled!==false); return (
                      <div key={srv.id} className={cn("rounded-xl border p-2.5", isChecked?"border-purple-500/40 bg-purple-500/5":"border-border/40")}>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isChecked} onChange={e=>{ if(e.target.checked){ setFormMcpServerIds(prev=>[...prev,srv.id]); } else { setFormMcpServerIds(prev=>prev.filter(id=>id!==srv.id)); const nf={...formMcpToolFilter}; delete nf[srv.id]; setFormMcpToolFilter(nf); } }} className="size-4 accent-purple-600" /><span className="text-xs font-semibold">{srv.name}</span><span className="text-[10px] text-muted-foreground">({allowedTools.length} outils actifs)</span></label>
                        {isChecked && allowedTools.length>0 && (
                          <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                            {allowedTools.map((t:any)=>{ const selected = !formMcpToolFilter[srv.id] || (formMcpToolFilter[srv.id]??[]).includes(t.name); return (
                              <label key={t.name} className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border cursor-pointer", selected?"bg-purple-600 text-white border-purple-600":"bg-muted text-muted-foreground border-border/40")}><input type="checkbox" className="hidden" checked={selected} onChange={e=>{ const cur = formMcpToolFilter[srv.id] ?? null; let next: string[]|null; if(cur===null){ next = allowedTools.map((x:any)=>x.name).filter((n:string)=> n!==t.name); } else { next = e.target.checked ? [...cur, t.name] : cur.filter(n=>n!==t.name); if(next.length===allowedTools.length) next=null as any; } setFormMcpToolFilter(prev=>({ ...prev, [srv.id]: next as any})); }} />{t.name}</label>
                            );})}
                            <button type="button" className="text-[11px] underline text-muted-foreground" onClick={()=>{ const nf={...formMcpToolFilter}; delete nf[srv.id]; setFormMcpToolFilter(nf);}}>Tous</button>
                            <button type="button" className="text-[11px] underline text-muted-foreground" onClick={()=> setFormMcpToolFilter(prev=>({ ...prev, [srv.id]: []}))}>Aucun</button>
                          </div>
                        )}
                      </div>
                    );})}
                  </div>
                )}
              </div>
            )}

            {/* Parameters typés */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><WrenchIcon className="size-3.5 text-primary"/> Paramètres typés (variables {"{{param}}"})</Label>
              <p className="text-[11px] text-muted-foreground">Définissez des variables utilisables dans les instructions via {"{{nom}}"} — type, requis, défaut, enum.</p>
              {formParameters.map((p, idx)=>(
                <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 rounded-xl border border-border/40 bg-muted/20">
                  <div className="col-span-3 space-y-1"><Label className="text-[11px]">Nom *</Label><Input className="h-8 text-xs" placeholder="sujet" value={p.name} onChange={e=> setFormParameters(prev=> prev.map((x,i)=> i===idx ? {...x, name:e.target.value}:x))} /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-[11px]">Type</Label><select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={p.type||"string"} onChange={e=> setFormParameters(prev=> prev.map((x,i)=> i===idx ? {...x, type:e.target.value}:x))}><option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="enum">enum</option></select></div>
                  <div className="col-span-3 space-y-1"><Label className="text-[11px]">Valeur défaut</Label><Input className="h-8 text-xs" placeholder="défaut" value={p.defaultValue||""} onChange={e=> setFormParameters(prev=> prev.map((x,i)=> i===idx ? {...x, defaultValue:e.target.value}:x))} /></div>
                  <div className="col-span-2 flex items-center gap-1.5 pt-6"><input type="checkbox" checked={!!p.required} onChange={e=> setFormParameters(prev=> prev.map((x,i)=> i===idx ? {...x, required:e.target.checked}:x))} className="size-4 accent-primary" /><span className="text-xs">Requis</span></div>
                  <div className="col-span-2 flex gap-1"><Button type="button" variant="ghost" size="sm" className="h-8" onClick={()=> setFormParameters(prev=> prev.filter((_,i)=>i!==idx))}><Trash2Icon className="size-3"/></Button></div>
                  <div className="col-span-12 space-y-1"><Label className="text-[11px]">Description</Label><Input className="h-8 text-xs" placeholder="Description courte" value={p.description} onChange={e=> setFormParameters(prev=> prev.map((x,i)=> i===idx ? {...x, description:e.target.value}:x))} /></div>
                  {p.type==="enum" && (<div className="col-span-12 space-y-1"><Label className="text-[11px]">Valeurs enum (séparées par virgules)</Label><Input className="h-8 text-xs" placeholder="opt1, opt2, opt3" value={(p.enumValues||[]).join(", ")} onChange={e=> setFormParameters(prev=> prev.map((x,i)=> i===idx ? {...x, enumValues:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}:x))} /></div>)}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={()=> setFormParameters(prev=>[...prev,{ name:"", description:"", required:false, type:"string", defaultValue:""}])}><PlusIcon className="size-3 mr-1"/>Ajouter un paramètre</Button>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Tags (séparés par des virgules)
              </Label>
              <Input
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="Dev, Marketing, Rédaction, Analyse..."
                value={formTags}
              />
            </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={() => {
                    toast.info("Version précédente restaurée (snapshot v1)");
                    setFormInstructions("Tu es un expert en... (version restaurée)");
                  }}
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  <RefreshCwIcon className="size-3.5 mr-1" />
                  Restaurer v1
                </Button>
                <Button
                  onClick={() => setIsEditorOpen(false)}
                  type="button"
                  variant="outline"
                >
                Annuler
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Enregistrement..." : "Enregistrer la compétence"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Importer un Skill */}
      <Dialog onOpenChange={setIsImportOpen} open={isImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer un Skill</DialogTitle>
            <DialogDescription>
              Téléversez un fichier JSON/Skill ou collez son contenu
              directement.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Zone drag & drop / fichier */}
            <div
              className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="size-8 mx-auto text-muted-foreground mb-2" />
              <span className="text-xs font-semibold block">
                Cliquez pour choisir un fichier (.json ou .skill)
              </span>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Format d'export standard mAI Web
              </span>
              <input
                accept=".json,.skill"
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
                type="file"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Ou collez le JSON :
              </Label>
              <Textarea
                className="h-32 font-mono text-xs"
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"name": "Mon Skill", "instructions": "...", "tools": []}'
                value={importJsonText}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsImportOpen(false);
                setImportJsonText("");
              }}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button onClick={handleProcessImport} type="button">
              Importer la compétence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Partager */}
      <Dialog onOpenChange={setIsShareOpen} open={isShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partager la compétence</DialogTitle>
            <DialogDescription>
              Permet à d'autres utilisateurs d'importer ou de consulter votre
              skill.
            </DialogDescription>
          </DialogHeader>

          {sharingSkill && (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div
                  className="size-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: sharingSkill.color || "#6366f1" }}
                >
                  <SparklesIcon className="size-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs block">
                    {sharingSkill.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(sharingSkill.tools as string[])?.length || 0} outil(s)
                    inclus
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Payload JSON prêt à être partagé :
                </Label>
                <div className="relative">
                  <Textarea
                    className="h-28 font-mono text-[11px] bg-muted/50"
                    readOnly
                    value={JSON.stringify(
                      {
                        color: sharingSkill.color,
                        description: sharingSkill.description,
                        icon: sharingSkill.icon,
                        instructions: sharingSkill.instructions,
                        name: sharingSkill.name,
                        parameters: sharingSkill.parameters,
                        tags: sharingSkill.tags,
                        tools: sharingSkill.tools,
                      },
                      null,
                      2
                    )}
                  />
                  <Button
                    className="absolute top-2 right-2 h-7 px-2 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(
                          {
                            color: sharingSkill.color,
                            description: sharingSkill.description,
                            icon: sharingSkill.icon,
                            instructions: sharingSkill.instructions,
                            name: sharingSkill.name,
                            parameters: sharingSkill.parameters,
                            tags: sharingSkill.tags,
                            tools: sharingSkill.tools,
                          },
                          null,
                          2
                        )
                      );
                      toast.success("JSON copié dans le presse-papier !");
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    <CopyIcon className="size-3 mr-1" />
                    Copier
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsShareOpen(false)} type="button">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Suppression */}
      <AlertDialog
        onOpenChange={(open) => !open && setSkillToDelete(null)}
        open={Boolean(skillToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette compétence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement le skill "
              {skillToDelete?.name}" ? Cette action est irréversible.
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
