"use client";

import {
  DownloadIcon,
  FilesIcon,
  LightbulbIcon,
  Loader2Icon,
  MessageSquareIcon,
  PinIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { ProjectIcon } from "@/components/chat/project-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { fetcher } from "@/lib/utils";

type ProjectDetail = {
  color: string | null;
  createdAt: string;
  customInstructions: string | null;
  defaultModel: string | null;
  description: string | null;
  icon: string | null;
  id: string;
  isArchived: boolean;
  name: string;
  role?: "member" | "owner";
};

type ProjectChat = {
  createdAt: string;
  id: string;
  isArchived: boolean;
  pinned: boolean;
  projectId: string | null;
  tags: string[];
  title: string;
  userId: string;
  visibility: string;
};

type ProjectFile = {
  contentType: string;
  createdAt: string;
  extractionStatus: string;
  fileName: string;
  fileSize: number | null;
  id: string;
  storageUrl: string;
  uploadedBy: string;
};

type ProjectMemberRow = {
  joinedAt: string;
  role: string;
  userId: string;
};

type Invite = {
  code: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
} | null;

function formatBytes(bytes: number | null): string {
  if (!bytes) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data, mutate, isLoading, error } = useSWR(
    id ? `/api/projects/${id}` : null,
    fetcher
  );
  const project: ProjectDetail | undefined = data?.project;
  const chats: ProjectChat[] = data?.recentChats ?? [];
  const files: ProjectFile[] = data?.files ?? [];
  const members: ProjectMemberRow[] = data?.members ?? [];
  const isOwner = project?.role !== "member"; // défaut owner (compat legacy)

  const { data: filesData, mutate: mutateFiles } = useSWR(
    id && isOwner !== undefined ? `/api/projects/${id}/files` : null,
    fetcher
  );
  const projectFiles: ProjectFile[] = filesData?.files ?? files;

  const { data: inviteData, mutate: mutateInvite } = useSWR<Invite>(
    id && isOwner ? `/api/projects/${id}/invites` : null,
    fetcher
  );
  const invite = inviteData?.invite ?? null;

  const { data: modelsData } = useSWR<{
    models: { id: string; name: string }[];
  }>("/api/models", fetcher);
  const availableModels = modelsData?.models || [];

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSidebar = useCallback(() => {
    globalMutate(
      (key) => typeof key === "string" && key.includes("/api/projects")
    );
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto w-full p-6 flex flex-col gap-6">
        <div className="h-6 w-36 bg-muted/60 animate-pulse rounded-md" />
        <div className="rounded-xl border p-6 h-36 bg-muted/30 animate-pulse" />
        <div className="rounded-xl border p-6 h-64 bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (error || (data && !project)) {
    return (
      <div className="max-w-[900px] mx-auto w-full p-6 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {error
            ? "Erreur lors du chargement du projet."
            : "Projet introuvable."}
        </p>
        <div className="flex gap-2">
          {error && (
            <Button onClick={() => mutate()} size="sm" variant="outline">
              Réessayer
            </Button>
          )}
          <Button asChild size="sm" variant="secondary">
            <Link href="/projects">Retour aux projets</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const openEdit = () => {
    setName(project.name);
    setDescription(project.description || "");
    setCustomInstructions(project.customInstructions || "");
    setDefaultModel(project.defaultModel || "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    const res = await fetch(`/api/projects/${id}`, {
      body: JSON.stringify({
        customInstructions: customInstructions.trim() || null,
        defaultModel: defaultModel.trim() || null,
        description: description.trim(),
        name: name.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!res.ok) {
      toast.error(extractApiErrorMessage(await res.json()) || "Erreur");
      return;
    }
    toast.success("Projet mis à jour");
    setEditOpen(false);
    mutate();
    refreshSidebar();
  };

  const handleNewChatInProject = () => {
    const newId = crypto.randomUUID();
    router.push(`/chat/${newId}?projectId=${id}`);
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setIsUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/projects/${id}/files`, {
          body: formData,
          method: "POST",
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          toast.error(
            extractApiErrorMessage(payload) ||
              `Échec de l'envoi de ${file.name}`
          );
        }
      }
      toast.success("Fichier(s) ajouté(s) au projet");
      mutateFiles();
      mutate();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const res = await fetch(
      `/api/projects/${id}/files?fileId=${encodeURIComponent(fileId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    mutateFiles();
    mutate();
  };

  const handleCreateInvite = async () => {
    const res = await fetch(`/api/projects/${id}/invites`, {
      body: JSON.stringify({ expiresInDays: 7 }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!res.ok) {
      toast.error(extractApiErrorMessage(await res.json()) || "Erreur");
      return;
    }
    mutateInvite();
    toast.success("Lien d'invitation créé (valable 7 jours)");
  };

  const handleRevokeInvite = async () => {
    const res = await fetch(`/api/projects/${id}/invites`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Erreur");
      return;
    }
    mutateInvite();
    toast.success("Invitation révoquée");
  };

  const joinLink = invite
    ? `${typeof window === "undefined" ? "" : window.location.origin}/projects/join/${invite.code}`
    : "";

  return (
    <div className="max-w-[900px] mx-auto w-full p-6 flex flex-col gap-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href="/projects"
      >
        ← Retour aux projets
      </Link>

      <div
        className="rounded-xl border p-6"
        style={{ borderLeft: `6px solid ${project.color ?? "#6366f1"}` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${project.color ?? "#6366f1"}15` }}
            >
              <ProjectIcon
                className="size-6"
                name={project.icon ?? "folder"}
                style={{ color: project.color ?? "#6366f1" }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                {project.description || "—"}
              </p>
              {project.customInstructions && (
                <div className="mt-2 text-xs bg-muted/40 rounded-lg p-2.5 border border-border/60">
                  <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
                    <LightbulbIcon className="size-3 text-amber-500 shrink-0" />{" "}
                    Instructions du dossier :{" "}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {project.customInstructions}
                  </span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{chats.length} discussions</Badge>
                {project.role === "member" && (
                  <Badge className="gap-1" variant="outline">
                    <UsersIcon className="size-3" /> Espace partagé · membre
                  </Badge>
                )}
                {members.length > 0 && (
                  <Badge variant="outline">{members.length + 1} membres</Badge>
                )}
                {project.defaultModel && (
                  <Badge
                    className="bg-primary/10 text-primary border-primary/20 gap-1 font-normal"
                    variant="secondary"
                  >
                    <SparklesIcon className="size-3 text-amber-500" />
                    Modèle IA :{" "}
                    {availableModels.find((m) => m.id === project.defaultModel)
                      ?.name || project.defaultModel}
                  </Badge>
                )}
                <Badge variant="outline">
                  {project.isArchived ? "Archivé" : "Actif"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button onClick={openEdit} size="sm" variant="outline">
                Modifier
              </Button>
            )}
            <Button onClick={handleNewChatInProject} size="sm">
              <MessageSquareIcon className="size-4 mr-1" /> Nouvelle discussion
            </Button>
          </div>
        </div>
      </div>

      {/* Fichiers du projet — injectés automatiquement comme contexte */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-sm inline-flex items-center gap-2">
            <FilesIcon className="size-4" /> Fichiers du projet
          </h2>
          <div>
            <input
              className="hidden"
              multiple
              onChange={(e) => handleUploadFiles(e.target.files)}
              ref={fileInputRef}
              type="file"
            />
            <Button
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              {isUploading ? (
                <Loader2Icon className="size-4 mr-1 animate-spin" />
              ) : (
                <UploadIcon className="size-4 mr-1" />
              )}
              Ajouter des fichiers
            </Button>
          </div>
        </div>
        <p className="px-4 pt-3 text-xs text-muted-foreground">
          Ces fichiers sont partagés avec tous les membres du projet et servent
          de contexte aux conversations. Le texte des documents (PDF, DOCX,
          CSV…) est extrait automatiquement ; les images ne sont transmises
          qu'aux modèles qui les prennent en charge.
        </p>
        {projectFiles.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucun fichier dans ce projet.
          </div>
        ) : (
          <div className="divide-y">
            {projectFiles.map((file) => (
              <div
                className="flex items-center justify-between gap-3 px-4 py-2.5"
                key={file.id}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {file.fileName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.contentType}
                    {file.fileSize ? ` · ${formatBytes(file.fileSize)}` : ""}
                    {file.extractionStatus === "ready"
                      ? " · texte extrait"
                      : file.extractionStatus === "failed"
                        ? " · extraction échouée"
                        : file.extractionStatus === "pending"
                          ? " · traitement…"
                          : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    asChild
                    className="h-7 w-7"
                    size="icon"
                    variant="ghost"
                  >
                    <a
                      download
                      href={file.storageUrl}
                      rel="noreferrer"
                      target="_blank"
                      title="Télécharger"
                    >
                      <DownloadIcon className="size-3.5" />
                    </a>
                  </Button>
                  {(isOwner || file.uploadedBy === data?.currentUserId) && (
                    <Button
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteFile(file.id)}
                      size="icon"
                      title="Supprimer"
                      variant="ghost"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partage & membres — gestion propriétaire */}
      {isOwner ? (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold text-sm inline-flex items-center gap-2">
              <UsersIcon className="size-4" /> Partage &amp; membres
            </h2>
            {invite ? (
              <Button onClick={handleRevokeInvite} size="sm" variant="outline">
                <XIcon className="size-3.5 mr-1" /> Révoquer l'invitation
              </Button>
            ) : (
              <Button onClick={handleCreateInvite} size="sm" variant="outline">
                Créer un lien d'invitation
              </Button>
            )}
          </div>
          {invite && (
            <div className="p-4 flex flex-col gap-3">
              <div className="grid gap-2">
                <Label>Lien partageable</Label>
                <div className="flex gap-2">
                  <Input className="text-xs" readOnly value={joinLink} />
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(joinLink);
                      toast.success("Lien copié");
                    }}
                    size="sm"
                  >
                    Copier
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Code d'invitation</Label>
                <div className="flex gap-2">
                  <Input className="text-xs" readOnly value={invite.code} />
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(invite.code);
                      toast.success("Code copié");
                    }}
                    size="sm"
                  >
                    Copier
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {invite.expiresAt
                    ? `Expire le ${new Date(invite.expiresAt).toLocaleDateString("fr-FR")}`
                    : "Sans expiration"}
                  {invite.maxUses
                    ? ` · ${invite.useCount}/${invite.maxUses} utilisations`
                    : ""}
                </span>
              </div>
            </div>
          )}
          {members.length > 0 && (
            <div className="divide-y border-t">
              {members.map((m) => (
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  key={m.userId}
                >
                  <span className="text-sm truncate">{m.userId}</span>
                  <Badge variant="secondary">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Conversations de l'espace (tous membres) */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Discussions du projet</h2>
          <Button onClick={() => mutate()} size="sm" variant="ghost">
            Actualiser
          </Button>
        </div>
        {chats.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Aucune discussion dans ce projet.
            </p>
            <Button onClick={handleNewChatInProject}>
              Créer une discussion
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {chats.map((c) => (
              <Link
                className="flex items-center justify-between p-4 hover:bg-muted/50"
                href={`/chat/${c.id}`}
                key={c.id}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate flex items-center gap-2">
                    {c.pinned && (
                      <PinIcon className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    {c.title}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                    <span>
                      {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    {c.tags?.map((t: string) => (
                      <Badge
                        className="text-[10px] px-1 py-0"
                        key={t}
                        variant="secondary"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {c.isArchived && <Badge variant="outline">Archivé</Badge>}
                  <span>{c.visibility}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Édition (propriétaire) */}
      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier projet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input onChange={(e) => setName(e.target.value)} value={name} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                onChange={(e) => setDescription(e.target.value)}
                value={description}
              />
            </div>
            <div className="grid gap-2">
              <Label>Instructions personnalisées</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Instructions pour les discussions de ce dossier..."
                rows={3}
                value={customInstructions}
              />
            </div>
            <div className="grid gap-2">
              <Label>Modèle d'IA par défaut</Label>
              <ModelSelectorCompact
                allowEmpty
                fallbackModels={availableModels as never}
                modal
                models={
                  availableModels.length > 0
                    ? (availableModels as never)
                    : undefined
                }
                onModelChange={setDefaultModel}
                selectedModelId={defaultModel}
                variant="block"
              />
              <span className="text-[11px] text-muted-foreground">
                Modèle sélectionné par défaut pour les nouvelles discussions de
                ce projet.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
