"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ArrowLeftIcon, Edit2Icon, MessageSquareIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data, mutate } = useSWR(id ? `/api/projects/${id}` : null, fetcher);
  const project = data?.project;
  const recentChats: any[] = data?.recentChats ?? [];

  const { data: chatsData } = useSWR(id ? `/api/history?projectId=${id}&limit=50&includeArchived=true` : null, fetcher);
  const chats: any[] = chatsData?.chats ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!data && !project) return <div className="p-8 text-sm text-muted-foreground">Chargement...</div>;
  if (data && !project) return <div className="p-8">Projet introuvable. <Link href="/projects" className="underline">Retour</Link></div>;

  const openEdit = () => {
    setName(project.name);
    setDescription(project.description || "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
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
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Retour aux projets
      </Link>

      <div className="rounded-xl border p-6" style={{ borderLeft: `6px solid ${project.color}` }}>
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${project.color}15` }}>{project.icon}</div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description || "—"}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">{chats.length} discussions</Badge>
                <Badge variant="outline">{project.isArchived ? "Archivé" : "Actif"}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}><Edit2Icon className="size-4 mr-1" /> Modifier</Button>
            <Button size="sm" onClick={handleNewChatInProject}><MessageSquareIcon className="size-4 mr-1" /> Nouvelle discussion</Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Discussions du projet</h2>
          <Button variant="ghost" size="sm" onClick={() => mutate()}>Actualiser</Button>
        </div>
        {chats.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">Aucune discussion dans ce projet.</p>
            <Button onClick={handleNewChatInProject}>Créer une discussion</Button>
          </div>
        ) : (
          <div className="divide-y">
            {chats.map((c: any) => (
              <Link key={c.id} href={`/chat/${c.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate flex items-center gap-2">
                    {c.pinned && <span className="text-amber-500">📌</span>}
                    {c.title}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                    <span>{new Date(c.createdAt).toLocaleDateString("fr-FR")}</span>
                    {c.tags?.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px] px-1 py-0">{t}</Badge>)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier projet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
