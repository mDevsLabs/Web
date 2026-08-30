"use client";

import {
  ArrowLeftIcon,
  Edit2Icon,
  LightbulbIcon,
  MessageSquareIcon,
  PinIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data, mutate, isLoading, error } = useSWR(
    id ? `/api/projects/${id}` : null,
    fetcher
  );
  const project = data?.project;
  const _recentChats: any[] = data?.recentChats ?? [];

  const { data: modelsData } = useSWR<{ models: any[] }>(
    "/api/models",
    fetcher
  );
  const availableModels: any[] = modelsData?.models || [];

  const {
    data: chatsData,
    mutate: mutateChats,
    isLoading: chatsLoading,
    error: chatsError,
  } = useSWR(
    id ? `/api/history?projectId=${id}&limit=50&includeArchived=true` : null,
    fetcher
  );
  const chats: any[] = chatsData?.chats ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [defaultModel, setDefaultModel] = useState("");

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
      toast.error("Erreur");
      return;
    }
    toast.success("Projet mis à jour");
    setEditOpen(false);
    mutate();
  };

  const handleNewChatInProject = () => {
    const newId = crypto.randomUUID();
    router.push(`/chat/${newId}?projectId=${id}`);
  };

  return (
    <div className="max-w-[900px] mx-auto w-full p-6 flex flex-col gap-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href="/projects"
      >
        <ArrowLeftIcon className="size-4" /> Retour aux projets
      </Link>

      <div
        className="rounded-xl border p-6"
        style={{ borderLeft: `6px solid ${project.color}` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${project.color}15` }}
            >
              <ProjectIcon
                className="size-6"
                name={project.icon}
                style={{ color: project.color }}
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
            <Button onClick={openEdit} size="sm" variant="outline">
              <Edit2Icon className="size-4 mr-1" /> Modifier
            </Button>
            <Button onClick={handleNewChatInProject} size="sm">
              <MessageSquareIcon className="size-4 mr-1" /> Nouvelle discussion
            </Button>
          </div>
        </div>
      </div>

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
            {chats.map((c: any) => (
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
                fallbackModels={availableModels}
                modal
                models={availableModels.length > 0 ? availableModels : undefined}
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
