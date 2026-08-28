"use client";

import { BotIcon, CopyIcon, Edit2Icon, MoreVerticalIcon, PlusIcon, SearchIcon, Trash2Icon, CheckIcon, UploadIcon, XIcon } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { AgentIcon, EMOJI_PRESETS } from "@/components/agents/agent-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Agent, AgentTemplate, McpServer, Skill } from "@/lib/db/schema";
import { useActiveChat } from "@/hooks/use-active-chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PRESET_ICONS = [
  { id: "sparkles", label: "Étincelles" },
  { id: "bot", label: "Robot" },
  { id: "code", label: "Code" },
  { id: "book", label: "Livre" },
  { id: "target", label: "Cible" },
  { id: "lightbulb", label: "Idée" },
  { id: "globe", label: "Web" },
  { id: "zap", label: "Rapide" },
  { id: "database", label: "Données" },
  { id: "wallet", label: "Wallet" },
];

const PRESET_COLORS = ["#6366f1","#06b6d4","#10b981","#a855f7","#f43f5e","#f59e0b","#14b8a6","#f97316"];

export default function AgentsClient() {
  const { data: agents = [], mutate, isLoading } = useSWR<Agent[]>("/api/agents", fetcher);
  const { data: templates = [] } = useSWR<AgentTemplate[]>("/api/agents/templates", fetcher);
  const { data: skills = [] } = useSWR<Skill[]>("/api/skills", fetcher);
  const { data: mcpData } = useSWR<{ servers: McpServer[] }>("/api/mcp", fetcher);
  const mcpServers = useMemo(()=> Array.isArray(mcpData?.servers)? mcpData.servers : [], [mcpData]);
  const { data: modelsData } = useSWR("/api/models", fetcher);
  const models: any[] = modelsData?.models || [];

  const { activeAgent, setActiveAgent, clearActiveAgent } = useActiveChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formIcon, setFormIcon] = useState("sparkles");
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [formIconType, setFormIconType] = useState<"lucide"|"emoji">("lucide");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formModelId, setFormModelId] = useState(DEFAULT_CHAT_MODEL);
  const [formSkillIds, setFormSkillIds] = useState<string[]>([]);
  const [formMcpIds, setFormMcpIds] = useState<string[]>([]);
  const [formCloudUrls, setFormCloudUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filteredAgents = useMemo(()=> agents.filter(a => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || (a.description||"").toLowerCase().includes(searchQuery.toLowerCase())), [agents, searchQuery]);

  const handleNewAgent = useCallback((template?: AgentTemplate)=>{
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
    setIsEditorOpen(true);
  }, []);

  const handleEditAgent = (a: Agent)=>{
    setEditingAgent(a);
    setFormName(a.name);
    setFormDescription(a.description || "");
    setFormInstructions(a.instructions || "");
    setFormIcon(a.icon || "sparkles");
    setFormEmoji((a as any).emoji || null);
    setFormIconType((a as any).emoji ? "emoji" : "lucide");
    setFormColor(a.color || "#6366f1");
    setFormModelId((a as any).defaultModelId || DEFAULT_CHAT_MODEL);
    setFormSkillIds((a.skillIds as string[])||[]);
    setFormMcpIds((a.mcpServerIds as string[])||[]);
    setFormCloudUrls((a.cloudFileUrls as string[])||[]);
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent)=>{
    e.preventDefault();
    if(!formName.trim()) { toast.error("Nom requis"); return; }
    if(!formInstructions.trim()) { toast.error("Instructions requises"); return; }
    if(formInstructions.length > 5000) { toast.error("Instructions limitées à 5000 caractères"); return; }
    setIsSaving(true);
    try{
      const payload:any = {
        color: formColor,
        cloudFileUrls: formCloudUrls,
        defaultModelId: formModelId,
        description: formDescription,
        emoji: formIconType === "emoji" ? (formEmoji || null) : null,
        icon: formIconType === "lucide" ? formIcon : "sparkles",
        instructions: formInstructions.slice(0,5000),
        mcpServerIds: formMcpIds,
        name: formName,
        skillIds: formSkillIds,
      };
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : "/api/agents";
      const method = editingAgent ? "PATCH" : "POST";
      const res = await fetch(url, { body: JSON.stringify(payload), headers: { "Content-Type":"application/json" }, method });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || "Erreur sauvegarde");
      toast.success(editingAgent ? "Agent mis à jour !" : "Agent créé !");
      await mutate();
      setIsEditorOpen(false);
    }catch(err:any){ toast.error(err.message||"Erreur"); } finally{ setIsSaving(false); }
  };

  const handleDelete = async()=>{
    if(!agentToDelete) return;
    const res = await fetch(`/api/agents/${agentToDelete.id}`, { method:"DELETE" });
    if(!res.ok) { toast.error("Suppression échouée"); return; }
    toast.success(`Agent "${agentToDelete.name}" supprimé`);
    setAgentToDelete(null);
    await mutate();
    if(activeAgent?.id === agentToDelete.id) clearActiveAgent();
  };

  const handleDuplicate = async(a: Agent)=>{
    const res = await fetch(`/api/agents/${a.id}/duplicate`, { method:"POST" });
    if(!res.ok){ const d=await res.json(); toast.error(d.error||"Duplication échouée"); return; }
    toast.success(`Copie créée pour "${a.name}"`);
    await mutate();
  };

  const handleActivate = (a: Agent)=>{
    setActiveAgent(a);
    toast.success(`Agent activé : ${a.emoji ? a.emoji+" " : ""}${a.name} — modèle ${a.defaultModelId}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    const files = Array.from(e.target.files||[]);
    if(files.length===0) return;
    if(formCloudUrls.length + files.length > 5){ toast.error("Max 5 fichiers par agent"); return; }
    setIsUploading(true);
    try{
      for(const file of files){
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/files/upload", { body: fd, method:"POST" });
        const data = await res.json();
        if(res.ok && data.url) setFormCloudUrls(prev=>[...prev, data.url]);
        else toast.error(data.error||"Upload échoué");
      }
    } finally{ setIsUploading(false); if(e.target) e.target.value=""; }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600"><BotIcon className="size-5"/></div>
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">Agents IA</h1>
                <p className="text-xs text-muted-foreground">{agents.length}/10 agents • Sélection globale • <span className="font-mono text-[10px]">5000c max instructions</span></p>
              </div>
            </div>
          </div>
          <Button className="h-8 gap-1.5 text-xs font-medium shadow-xs" onClick={()=>handleNewAgent()} disabled={agents.length>=10}>
            <PlusIcon className="size-3.5"/><span>Créer un agent</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"/>
            <Input className="h-8 pl-8 text-xs bg-muted/40" placeholder="Rechercher un agent..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          {activeAgent && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium">
              <AgentIcon emoji={activeAgent.emoji} icon={activeAgent.icon} color={activeAgent.color} size={14} variant="plain"/> Actif : {activeAgent.name}
              <button onClick={()=>clearActiveAgent()} className="ml-1 rounded-full p-0.5 hover:bg-primary/20"><XIcon className="size-3"/></button>
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Templates */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Modèles d'agents — choisir pour démarrer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {templates.map(t=>(
              <button key={t.id} onClick={()=>handleNewAgent(t)} className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="size-8 rounded-lg flex items-center justify-center text-white text-sm" style={{backgroundColor: t.color||"#6366f1"}}>
                    <AgentIcon emoji={(t as any).emoji} icon={t.icon} size={16} variant="plain"/>
                  </div>
                  <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Utiliser +</span>
                </div>
                <span className="font-semibold text-xs text-foreground mb-1 truncate">{t.name}</span>
                <span className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</span>
                <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 truncate">{t.defaultModelId}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grille agents utilisateur */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="h-48 rounded-2xl border border-border/50 bg-muted/20 animate-pulse p-4"/> )}</div>
        ) : agents.length===0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
            <div className="size-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4"><BotIcon className="size-8"/></div>
            <h2 className="text-xl font-bold mb-2">Aucun agent créé</h2>
            <p className="text-sm text-muted-foreground mb-6">Choisissez un modèle ci-dessus ou créez un agent personnalisé avec instructions, skills, MCP et fichiers.</p>
            <Button onClick={()=>handleNewAgent()} className="gap-2 text-xs font-medium"><PlusIcon className="size-4"/>Créer mon premier agent</Button>
          </div>
        ) : filteredAgents.length===0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Aucun agent ne correspond à “{searchQuery}”.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map(a=>(
              <div key={a.id} className={cn("flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group", activeAgent?.id===a.id ? "border-indigo-500/40 ring-1 ring-indigo-500/20 bg-indigo-500/[0.03]" : "border-border/60 hover:border-border")}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0" style={{backgroundColor: a.color||"#6366f1"}}>
                      <AgentIcon emoji={(a as any).emoji} icon={a.icon} size={20} variant="plain"/>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">{a.name} {activeAgent?.id===a.id && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">Actif</span>}</h3>
                      <p className="text-[12px] text-muted-foreground truncate">{a.description||"Aucune description"}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button className="size-7 p-0 text-muted-foreground hover:text-foreground" variant="ghost"><MoreVerticalIcon className="size-4"/></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={()=>handleActivate(a)}><CheckIcon className="size-3.5"/>Activer (global)</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={()=>handleEditAgent(a)}><Edit2Icon className="size-3.5"/>Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={()=>handleDuplicate(a)}><CopyIcon className="size-3.5"/>Dupliquer</DropdownMenuItem>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive" onClick={()=>setAgentToDelete(a)}><Trash2Icon className="size-3.5"/>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground/90 line-clamp-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 font-mono flex-1 mb-3">{a.instructions}</p>
                <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-[11px]">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">{(a as any).defaultModelId}</span>
                    {(a.skillIds as string[]|null)?.length ? <span className="bg-muted px-1.5 py-0.5 rounded">Skills { (a.skillIds as any).length}</span> : null}
                    {(a.mcpServerIds as string[]|null)?.length ? <span className="bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">MCP {(a.mcpServerIds as any).length}</span> : null}
                    {(a.cloudFileUrls as string[]|null)?.length ? <span className="bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Fichiers {(a.cloudFileUrls as any).length}</span> : null}
                  </div>
                  <Button size="sm" variant={activeAgent?.id===a.id ? "secondary" : "outline"} className="h-7 text-xs" onClick={()=>handleActivate(a)}>{activeAgent?.id===a.id ? "Activé" : "Activer"}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dialog éditeur */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAgent ? "Modifier l'agent" : "Créer un agent"}</DialogTitle><DialogDescription>Instructions ≤5000c, icône/emoji + couleur, modèle par défaut (switch auto), skills, MCP et fichiers (upload dédié, max 5).</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Nom *</Label>
                <Input value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ex: Assistant Code" required maxLength={100}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Couleur du badge</Label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PRESET_COLORS.map(c=><button key={c} type="button" className={cn("size-6 rounded-full transition-transform", formColor===c && "ring-2 ring-foreground scale-110")} style={{backgroundColor:c}} onClick={()=>setFormColor(c)}/>)}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description courte</Label>
              <Input value={formDescription} onChange={e=>setFormDescription(e.target.value)} placeholder="Rôle ou cas d'usage résumé..." maxLength={500}/>
            </div>

            {/* Toggle icône / emoji */}
            <div className="space-y-2 rounded-xl border border-border/50 p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Icône / Emoji — affiché partout (sidebar, @, cartes, dropdown)</Label>
                <div className="flex items-center rounded-lg border border-border/50 bg-background p-0.5 text-xs">
                  <button type="button" className={cn("px-2.5 py-1 rounded-md font-medium", formIconType==="lucide" ? "bg-foreground text-background" : "text-muted-foreground")} onClick={()=>setFormIconType("lucide")}>Icône</button>
                  <button type="button" className={cn("px-2.5 py-1 rounded-md font-medium", formIconType==="emoji" ? "bg-foreground text-background" : "text-muted-foreground")} onClick={()=>setFormIconType("emoji")}>Emoji Unicode</button>
                </div>
              </div>
              {formIconType==="lucide" ? (
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map(o=>(
                    <button key={o.id} type="button" onClick={()=>setFormIcon(o.id)} className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border text-xs min-w-[64px]", formIcon===o.id ? "border-primary bg-primary/10" : "border-border/50 hover:bg-muted")}>
                      <span className="size-8 rounded-lg flex items-center justify-center text-white" style={{backgroundColor:formColor}}><AgentIcon icon={o.id} size={16} variant="plain"/></span>
                      <span className="text-[10px]">{o.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_PRESETS.map(e=>(
                      <button key={e} type="button" onClick={()=>setFormEmoji(e)} className={cn("size-9 rounded-xl border flex items-center justify-center text-lg hover:bg-muted", formEmoji===e ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border/50")} style={formEmoji===e ? {backgroundColor: `${formColor}18`} : {}}>{e}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input className="h-8 text-sm max-w-[140px]" placeholder="Colle un emoji (ex: 🤖)" value={formEmoji||""} onChange={e=>setFormEmoji(e.target.value.slice(0,10) || null)} maxLength={10}/>
                    {formEmoji && <span className="size-8 rounded-lg flex items-center justify-center text-white text-lg" style={{backgroundColor:formColor}}>{formEmoji}</span>}
                    <span className="text-[11px] text-muted-foreground">Emoji stocké en BDD (colonne <code className="px-1 py-0.5 rounded bg-muted text-[10px]">emoji</code>)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Utilise un emoji Unicode (1–4 glyphes). L'emoji remplace l'icône Lucide partout, la couleur reste en fond de badge.</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">Instructions système * <span className={cn("text-[11px] font-normal", formInstructions.length>4800 ? "text-amber-600" : "text-muted-foreground")}>{formInstructions.length}/5000</span></Label>
              <Textarea className="min-h-[140px] font-mono text-xs leading-relaxed" value={formInstructions} onChange={e=>setFormInstructions(e.target.value)} placeholder="Tu es un expert en... Tes réponses doivent toujours respecter..." required maxLength={5000}/>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Modèle IA par défaut — à l'activation, le modèle switch automatiquement</Label>
              <select className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 w-full" value={formModelId} onChange={e=>setFormModelId(e.target.value)}>
                {models.length===0 ? <option value={DEFAULT_CHAT_MODEL}>{DEFAULT_CHAT_MODEL}</option> : models.map((m:any)=><option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
              </select>
              <span className="text-[11px] text-muted-foreground">Ce modèle sera appliqué (cookie <code className="px-1 py-0.5 rounded bg-muted text-[10px]">chat-model</code>) dès que l'agent est activé.</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Skills associées (max 10)</Label>
              {skills.length===0 ? <span className="text-xs text-muted-foreground">Aucune skill — crée-en dans /skills</span> :
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 bg-muted/10">
                  {skills.map(s=>(
                    <label key={s.id} className={cn("flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs", formSkillIds.includes(s.id) ? "border-primary/40 bg-primary/5" : "border-border/30 hover:bg-muted/30")}>
                      <input type="checkbox" checked={formSkillIds.includes(s.id)} onChange={e=> e.target.checked ? setFormSkillIds(prev=>[...prev,s.id]) : setFormSkillIds(prev=>prev.filter(id=>id!==s.id))} className="size-4 rounded border-border accent-primary"/>
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))}
                </div>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Serveurs MCP (max 10)</Label>
              {mcpServers.length===0 ? <span className="text-xs text-muted-foreground">Aucun serveur MCP — configure dans /mcp</span> :
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 bg-muted/10">
                  {mcpServers.map(m=>(
                    <label key={m.id} className={cn("flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs", formMcpIds.includes(m.id) ? "border-purple-500/40 bg-purple-500/5" : "border-border/30 hover:bg-muted/30")}>
                      <input type="checkbox" checked={formMcpIds.includes(m.id)} onChange={e=> e.target.checked ? setFormMcpIds(prev=>[...prev,m.id]) : setFormMcpIds(prev=>prev.filter(id=>id!==m.id))} className="size-4 rounded border-border accent-primary"/>
                      <span className="truncate">{m.name}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{m.transport}</span>
                    </label>
                  ))}
                </div>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-2">Fichiers Cloud (upload dédié, max 5) {isUploading && <span className="text-amber-600 text-[11px]">Upload...</span>}</Label>
              <div className="flex items-center gap-2">
                <Input type="file" multiple onChange={handleFileUpload} className="h-8 text-xs" disabled={isUploading || formCloudUrls.length>=5}/>
                <span className="text-[11px] text-muted-foreground">{formCloudUrls.length}/5</span>
              </div>
              {formCloudUrls.length>0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formCloudUrls.map((url,i)=>(
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] border border-border/40 max-w-[220px]">
                      <span className="truncate">{url.split("/").pop() || url}</span>
                      <button type="button" onClick={()=>setFormCloudUrls(prev=>prev.filter((_,idx)=>idx!==i))} className="rounded-full p-0.5 hover:bg-muted-foreground/20"><XIcon className="size-3"/></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={()=>setIsEditorOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Enregistrement..." : editingAgent ? "Mettre à jour" : "Créer l'agent"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(agentToDelete)} onOpenChange={open=> !open && setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer cet agent ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir supprimer définitivement l'agent "{agentToDelete?.name}" ? Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
