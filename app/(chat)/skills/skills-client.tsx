"use client";

import {
  BookOpenIcon,
  DownloadIcon,
  PinIcon,
  PlusIcon,
  TagIcon,
  UploadIcon,
  WrenchIcon,
} from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Skill } from "@/lib/db/schema";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { cn } from "@/lib/utils";
import {
  type SkillParameter,
  STARTER_TEMPLATES,
  VersionHistoryList,
  SkillCard,
  SkillStarterGrid,
  SkillLibraryTemplates,
  SkillShareModal,
  SkillImportModal,
  SkillDeleteDialog,
  SkillEditorModal,
} from "@/components/skills";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SkillsClient({
  embedded = false,
  initialCreate = false,
  searchQuery = "",
}: {
  embedded?: boolean;
  initialCreate?: boolean;
  searchQuery?: string;
} = {}) {
  const _router = useRouter();
  const {
    data: skills = [],
    error: _error,
    isLoading,
    mutate,
  } = useSWR<Skill[]>("/api/skills", fetcher);

  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "library">(
    "all"
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (embedded) {
      setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
    }
  }, [embedded]);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(initialCreate);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharingSkill, setSharingSkill] = useState<Skill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [versionHistorySkill, setVersionHistorySkill] = useState<Skill | null>(
    null
  );

  // Editor Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formIcon, setFormIcon] = useState("sparkles");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formTools, setFormTools] = useState<string[]>([]);
  const [formTags, setFormTags] = useState<string>("");
  const [formParameters, setFormParameters] = useState<SkillParameter[]>([]);
  const [formMcpServerIds, setFormMcpServerIds] = useState<string[]>([]);
  const [formMcpToolFilter, setFormMcpToolFilter] = useState<
    Record<string, string[] | null>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: mcpData } = useSWR<{ servers: any[] }>("/api/mcp", fetcher);
  const mcpServers: any[] = (mcpData as any)?.servers ?? [];
  const { data: skillTplData } = useSWR<{ templates: any[] }>(
    "/api/skills/templates",
    fetcher
  );
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

  // Filtrage et tri par pertinence
  const filteredSkills = useMemo(
    () =>
      sortByRelevance(
        skills.filter((s) => {
          const matches = matchesQuery(searchQuery, {
            primary: s.name,
            secondary: [s.description ?? "", s.instructions],
            tags: Array.isArray(s.tags) ? s.tags : [],
          });
          const matchesTab = activeTab === "all" || s.pinned;
          const matchesTag =
            !selectedTag ||
            (Array.isArray(s.tags) && s.tags.includes(selectedTag));
          return matches && matchesTab && matchesTag;
        }),
        searchQuery,
        (s) => ({
          primary: s.name,
          secondary: [s.description ?? "", s.instructions],
          tags: Array.isArray(s.tags) ? s.tags : [],
        }),
        { isPinned: (s) => Boolean(s.pinned), pinnedFirst: true }
      ),
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
        mcpServerIds: includeMcp ? formMcpServerIds : [],
        mcpToolFilter: includeMcp ? formMcpToolFilter : {},
        name: formName,
        parameters: formParameters,
        tags: tagsArray,
        tools: formTools,
      };
      if (editingSkill) {
        const res = await fetch(`/api/skills/${editingSkill.id}`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!res.ok) {
          throw new Error("Erreur de sauvegarde");
        }
        toast.success("Skill mis à jour avec succès !");
      } else {
        const res = await fetch("/api/skills", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Erreur lors de la création");
        }
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
    if (!skillToDelete) return;
    try {
      const res = await fetch(`/api/skills/${skillToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
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
    if (!file) return;

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
    <div
      className={
        embedded
          ? "flex w-full flex-col text-foreground"
          : "flex flex-col min-h-screen bg-background text-foreground"
      }
    >
      {/* Boutons portés dans la rangée globale de la page Outils */}
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
                    onClick={() =>
                      window.open("/api/skills/export?format=json", "_blank")
                    }
                  >
                    Skills JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=csv", "_blank")
                    }
                  >
                    Skills CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=md", "_blank")
                    }
                  >
                    Skills MD
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=txt", "_blank")
                    }
                  >
                    Skills TXT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => setIsImportOpen(true)}
                variant="outline"
              >
                <UploadIcon className="size-3.5" />
                <span>Importer</span>
              </Button>
              <Button
                className="h-8 gap-1.5 text-xs font-medium shadow-xs"
                onClick={() => handleNewSkill()}
              >
                <PlusIcon className="size-3.5" />
                <span>Nouveau Skill</span>
              </Button>
            </div>,
            actionsAnchor
          )
        : null}

      {/* Header — masqué en mode intégré */}
      {embedded ? null : (
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div
            className={`flex items-center gap-3 ${embedded ? "justify-end" : "justify-between"}`}
          >
            {embedded ? null : (
              <div className="flex items-center gap-3">
                <PageBackButton
                  fallbackHref="/tools?tab=skills"
                  label="Retour aux Skills"
                />
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
            )}

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 gap-1.5 text-xs font-medium"
                    variant="outline"
                  >
                    <DownloadIcon className="size-3.5" />
                    <span className="hidden sm:inline">Exporter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=json", "_blank")
                    }
                  >
                    Skills JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=csv", "_blank")
                    }
                  >
                    Skills CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=md", "_blank")
                    }
                  >
                    Skills MD
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("/api/skills/export?format=txt", "_blank")
                    }
                  >
                    Skills TXT
                  </DropdownMenuItem>
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

          {/* Filtres */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0">
            <div className="flex items-center gap-2">
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
                  <span>
                    Épinglés ({skills.filter((s) => s.pinned).length})
                  </span>
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
      )}

      {/* Contenu principal */}
      <main
        className={
          embedded
            ? "w-full flex-1 px-0 pt-2 pb-4"
            : "mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6"
        }
      >
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
          <SkillLibraryTemplates
            onInstallSuccess={() => mutate()}
            onSelectStarter={(t) => handleNewSkill(t)}
            skillTemplates={skillTemplates}
          />
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <WrenchIcon className="size-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Aucun skill configuré</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Les skills permettent de prédéfinir des instructions spécialisées
              et des outils précis pour l'IA, utilisables directement dans vos
              discussions via la commande{" "}
              <span className="font-semibold text-foreground">@</span> ou le
              menu Plus.
            </p>

            <SkillStarterGrid onSelectTemplate={(tmpl) => handleNewSkill(tmpl)} />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((s) => (
              <SkillCard
                key={s.id}
                onDeleteRequest={(item) => setSkillToDelete(item)}
                onDuplicate={handleDuplicate}
                onEdit={handleEditSkill}
                onExport={handleExportSkill}
                onOpenVersions={(item) => setVersionHistorySkill(item)}
                onShare={(item) => {
                  setSharingSkill(item);
                  setIsShareOpen(true);
                }}
                onTogglePin={handleTogglePin}
                skill={s}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modale Édition / Création */}
      <SkillEditorModal
        editingSkill={editingSkill}
        formColor={formColor}
        formDescription={formDescription}
        formIcon={formIcon}
        formInstructions={formInstructions}
        formMcpServerIds={formMcpServerIds}
        formMcpToolFilter={formMcpToolFilter}
        formName={formName}
        formParameters={formParameters}
        formTags={formTags}
        formTools={formTools}
        isSaving={isSaving}
        mcpServers={mcpServers}
        onFormColorChange={setFormColor}
        onFormDescriptionChange={setFormDescription}
        onFormIconChange={setFormIcon}
        onFormInstructionsChange={setFormInstructions}
        onFormMcpServerIdsChange={setFormMcpServerIds}
        onFormMcpToolFilterChange={setFormMcpToolFilter}
        onFormNameChange={setFormName}
        onFormParametersChange={setFormParameters}
        onFormTagsChange={setFormTags}
        onFormToolsChange={setFormTools}
        onOpenChange={setIsEditorOpen}
        onOpenVersionHistory={() => {
          if (editingSkill) setVersionHistorySkill(editingSkill);
        }}
        onSaveSkill={handleSaveSkill}
        open={isEditorOpen}
      />

      {/* Modale Historique des versions */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) setVersionHistorySkill(null);
        }}
        open={Boolean(versionHistorySkill)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique des versions</DialogTitle>
            <DialogDescription>
              {versionHistorySkill?.name} — un snapshot est créé à chaque
              enregistrement qui change le contenu du skill.
            </DialogDescription>
          </DialogHeader>
          {versionHistorySkill && (
            <VersionHistoryList
              onRestored={() => {
                mutate();
                setVersionHistorySkill(null);
              }}
              skill={versionHistorySkill}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modale Import */}
      <SkillImportModal
        fileInputRef={fileInputRef}
        importJsonText={importJsonText}
        onFileUpload={handleFileUpload}
        onImportJsonChange={setImportJsonText}
        onOpenChange={setIsImportOpen}
        onProcessImport={handleProcessImport}
        open={isImportOpen}
      />

      {/* Modale Partage */}
      <SkillShareModal
        onOpenChange={setIsShareOpen}
        open={isShareOpen}
        sharingSkill={sharingSkill}
      />

      {/* Modale Confirmation Suppression */}
      <SkillDeleteDialog
        onClose={() => setSkillToDelete(null)}
        onConfirmDelete={handleDelete}
        skillToDelete={skillToDelete}
      />
    </div>
  );
}
