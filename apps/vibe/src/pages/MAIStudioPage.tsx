/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI STUDIO & CHAT (src/pages/MAIStudioPage.tsx)
 * AI Multi-Model Hub, Copy/Edit Prompt, Model Selector, @ and / Command Support
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Send,
  RefreshCw,
  Zap,
  Loader2,
  Copy,
  Check,
  Edit2,
  Share2,
  ShieldCheck,
  ShieldAlert,
  SquarePen,
  XCircle,
  Trash2,
  CopyPlus,
  Download,
  ClipboardCopy,
  FileJson,
  Menu,
  MoreVertical,
  MessagesSquare
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { ToolAutocomplete } from '../components/layout/ToolAutocomplete';
import { type MAITool } from '../data/maiTools';
import { ModelDropdown } from '../components/common/ModelDropdown';
import { RichContent } from '../components/common/RichContent';
import { renderInlineRichMarkdown, stripMarkdownText } from '../components/common/richMarkdown';
import { sanitizeRichHtml } from '../components/common/richSanitizer';
import { ShareToDMModal } from '../components/common/ShareToDMModal';
import { MaiToolChips } from '../components/mai/MaiToolChips';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import { haptics } from '../services/haptics';
import { NotificationService } from '../services/notificationService';
import { downloadTextFile } from '../services/mediaActions';
import { maiExportSlug, buildMAIConversationMarkdown, buildMAIConversationJSON } from '../algorithms';
import type { MaiToolCall, MAIConversationSummary } from '../types/vibe';

/** Formate le Markdown inline dans l'historique mAI (gras, code, etc.) sans astérisques bruts */
const formatConversationPreview = (preview?: string, messageCount?: number): { __html: string } | string => {
  if (!preview) {
    const count = messageCount || 0;
    return `${count} message${count > 1 ? 's' : ''}`;
  }
  const cleaned = preview
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  const inlineHtml = renderInlineRichMarkdown(cleaned);
  return { __html: sanitizeRichHtml(inlineHtml) };
};

interface ChatMessage {
  id: string;
  /** Id serveur du message persisté (mai_messages.id). */
  serverId?: string;
  sender: 'user' | 'mai';
  content: string;
  toolExecuted?: any;
  /** Outils utilisés par l'IA (chips persistantes). */
  toolCalls?: MaiToolCall[];
  modelUsed?: string;
  time: string;
  requiresApproval?: boolean;
}

const formatConvDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    return sameDay
      ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const DEFAULT_MODELS = [
  { id: 'poolside/laguna-xs-2.1:free', name: 'Laguna XS 2.1', description: 'Modèle IA par défaut haute performance', provider: 'Poolside' },
  { id: 'mai-1.5-apex', name: 'mAI 1.5 Apex', description: 'Modèle IA d\'élite mAI — Raisonnement profond & Vision', provider: 'mDevsLabs' },
  { id: 'mai-1.5-light', name: 'mAI 1.5 Light', description: 'Modèle agile mAI ultra-rapide', provider: 'mDevsLabs' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Vitesse instantanée et compréhension multimodale', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Raisonnement avancé et synthèse complexe', provider: 'Google' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Écriture élégante et codage expert', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Modèle polyvalent haut de gamme', provider: 'OpenAI' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', description: 'Performances logiques et mathématiques', provider: 'DeepSeek' },
];

export const MAIStudioPage: React.FC = () => {
  const { user, quotas, refreshQuotas } = useAuth();
  const location = useLocation();
  const isCreatingConvRef = useRef(false);
  const lastHandledNewRef = useRef<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('poolside/laguna-xs-2.1:free');
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; description: string; provider?: string }>>(DEFAULT_MODELS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [shareMessageText, setShareMessageText] = useState<string | null>(null);
  // Approbation des outils sensibles : l'IA doit demander l'accord de
  // l'utilisateur, sauf si l'auto-approbation a été activée en paramètre.
  const [pendingTool, setPendingTool] = useState<{ name: string; args: any } | null>(null);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState(false);

  // Multi-conversations mAI (liste latérale, renommage, duplication, export)
  const [conversations, setConversations] = useState<MAIConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [convItemMenuId, setConvItemMenuId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirmDialog();

  // Autocomplete state
  const [autocompleteTrigger, setAutocompleteTrigger] = useState<'/' | '@' | null>(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await ApiService.getModels();
        if (res.models && res.models.length > 0) {
          const list = res.models.filter((m: any) => m && m.id !== 'openrouter/free' && !m.id.startsWith('openrouter/'));
          const lagunaIdx = list.findIndex((m: any) => m.id === 'poolside/laguna-xs-2.1:free');
          if (lagunaIdx > 0) {
            const [laguna] = list.splice(lagunaIdx, 1);
            list.unshift(laguna);
          }
          if (list.length > 0) {
            setAvailableModels(list);
          }
        }
      } catch {}
    };

    // Préremplissage depuis un lien externe (?prefill=…) — ex. bouton mAI de la page Statistiques
    try {
      const prefill = new URLSearchParams(window.location.search).get('prefill');
      if (prefill && prefill.trim()) {
        setPromptInput(prefill.trim());
        // Nettoie l'URL pour éviter le renvoi du prompt au rafraîchissement
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {}
    ApiService.getSettings()
      .then((res: any) => {
        const saved = res?.settings?.mai_default_model;
        if (saved && saved !== 'openrouter/free' && !saved.startsWith('openrouter/')) {
          setSelectedModel(String(saved));
        }
      })
      .catch(() => {});
    loadModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Multi-conversations : liste + chargement de l'historique persisté
  const loadConversations = async (): Promise<MAIConversationSummary[]> => {
    try {
      const res = await ApiService.getMAIConversations();
      const list = res.conversations || [];
      setConversations(list);
      return list;
    } catch {
      return [];
    }
  };

  const loadHistory = async (conversationId?: string | null) => {
    try {
      const res = await ApiService.getMAIHistory(conversationId || undefined);
      setActiveConversationId(res.conversation_id || null);
      setMessages(
        (res.messages || []).map((m) => ({
          id: m.id,
          serverId: m.id,
          sender: m.role === 'assistant' ? ('mai' as const) : ('user' as const),
          content: m.content,
          toolCalls: Array.isArray(m.tool_calls) ? m.tool_calls : [],
          time: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }))
      );
      setPendingTool(null);
    } catch {}
  };

  // Démarrer une nouvelle conversation mAI (vide l'historique actif)
  const handleNewConversation = async () => {
    if (isCreatingConvRef.current) return;
    isCreatingConvRef.current = true;
    try {
      const res = await ApiService.newMAIConversation();
      if (res?.conversation_id) setActiveConversationId(res.conversation_id);
      setMessages([]);
      setPendingTool(null);
      setConvItemMenuId(null);
      setSidebarOpen(false);
      await loadConversations();
      inputRef.current?.focus();
      haptics.selection();
    } catch (err: any) {
      NotificationService.showInAppToast(
        'Nouvelle discussion',
        err?.message || 'Impossible de créer une nouvelle discussion.',
        'error'
      );
    } finally {
      isCreatingConvRef.current = false;
    }
  };

  useEffect(() => {
    (async () => {
      setConversationsLoading(true);
      const params = new URLSearchParams(window.location.search);
      const isNew = params.has('new');
      if (isNew) {
        lastHandledNewRef.current = params.get('new');
        await handleNewConversation();
      } else {
        const list = await loadConversations();
        await loadHistory(list[0]?.id);
        // Aucune conversation existante : l'historique vient d'en créer une
        if (list.length === 0) await loadConversations();
      }
      setConversationsLoading(false);
    })();
  }, []);

  // Détection d'un clic sur mAI depuis la barre latérale quand on est déjà sur la page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newParam = params.get('new');
    if (newParam && newParam !== lastHandledNewRef.current) {
      lastHandledNewRef.current = newParam;
      handleNewConversation();
    }
  }, [location.search]);

  // Événement personnalisé émis par la Sidebar pour garantir une nouvelle discussion au clic
  useEffect(() => {
    const onNewConvEvent = () => {
      handleNewConversation();
    };
    window.addEventListener('vibe:mai:new_conversation', onNewConvEvent);
    return () => {
      window.removeEventListener('vibe:mai:new_conversation', onNewConvEvent);
    };
  }, []);

  const handleSelectConversation = (conversationId: string) => {
    haptics.light();
    setActiveConversationId(conversationId);
    setConvItemMenuId(null);
    setSidebarOpen(false);
    setPendingTool(null);
    loadHistory(conversationId);
  };

  /** Renomme une conversation (Entrée / perte de focus valident, Échap annule). */
  const handleRenameConversation = async (conversationId: string, title: string) => {
    const clean = title.replace(/\s+/g, ' ').trim();
    setRenamingId(null);
    setRenameDraft('');
    if (!clean) return;
    const current = conversations.find((c) => c.id === conversationId);
    if (current && current.title === clean) return;
    try {
      await ApiService.renameMAIConversation(conversationId, clean);
      setConversations((list) => list.map((c) => (c.id === conversationId ? { ...c, title: clean } : c)));
    } catch (err: any) {
      NotificationService.showInAppToast('Renommage', err?.message || 'Impossible de renommer la discussion.', 'error');
    }
  };

  /** Supprime une conversation (messages en cascade) + bascule sur la suivante. */
  const handleDeleteConversation = async (conversationId: string) => {
    setConvItemMenuId(null);
    const ok = await confirm({
      title: 'Supprimer cette discussion ?',
      message: 'Tous ses messages seront définitivement supprimés.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ApiService.deleteMAIConversation(conversationId);
      const list = await loadConversations();
      if (activeConversationId === conversationId) {
        const next = list[0]?.id || null;
        setPendingTool(null);
        await loadHistory(next);
      }
      haptics.medium();
      NotificationService.showInAppToast('Discussion supprimée', 'La conversation a été supprimée.', 'info');
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Suppression', err?.message || 'Impossible de supprimer la discussion.', 'error');
    }
  };

  /** Duplique une conversation (messages copiés) puis l'ouvre. */
  const handleDuplicateConversation = async (conversationId: string) => {
    setConvItemMenuId(null);
    try {
      const res = await ApiService.duplicateMAIConversation(conversationId);
      await loadConversations();
      if (res?.conversation_id) {
        await loadHistory(res.conversation_id);
        setActiveConversationId(res.conversation_id);
      }
      haptics.success();
      NotificationService.showInAppToast('Discussion dupliquée', 'La copie est prête dans la liste.', 'success');
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Duplication', err?.message || 'Impossible de dupliquer la discussion.', 'error');
    }
  };

  /** Charge l'intégralité d'une conversation (pour export / copie). */
  const fetchFullConversation = async (conversationId: string) => {
    const res = await ApiService.getMAIHistory(conversationId, 1000);
    const summary = conversations.find((c) => c.id === conversationId);
    return {
      conv: {
        id: conversationId,
        title: summary?.title || 'Discussion mAI',
        created_at: summary?.created_at,
        updated_at: summary?.updated_at,
      },
      messages: (res.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        tool_calls: Array.isArray(m.tool_calls) ? m.tool_calls : [],
      })),
    };
  };

  /** Export fichier Markdown / JSON d'une conversation. */
  const handleExportConversation = async (conversationId: string, format: 'md' | 'json') => {
    setConvItemMenuId(null);
    try {
      const { conv, messages: msgs } = await fetchFullConversation(conversationId);
      const slug = maiExportSlug(conv.title);
      if (format === 'md') {
        downloadTextFile(`${slug}.md`, buildMAIConversationMarkdown(conv, msgs), 'text/markdown;charset=utf-8');
      } else {
        downloadTextFile(`${slug}.json`, buildMAIConversationJSON(conv, msgs), 'application/json;charset=utf-8');
      }
      haptics.success();
      NotificationService.showInAppToast('Export', `Discussion exportée en ${format.toUpperCase()}.`, 'success');
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Export', err?.message || "L'export a échoué.", 'error');
    }
  };

  /** Copie la conversation entière (Markdown) dans le presse-papiers. */
  const handleCopyConversation = async (conversationId: string) => {
    setConvItemMenuId(null);
    try {
      const { conv, messages: msgs } = await fetchFullConversation(conversationId);
      await navigator.clipboard.writeText(buildMAIConversationMarkdown(conv, msgs));
      haptics.success();
      NotificationService.showInAppToast('Copié', 'La discussion a été copiée dans le presse-papiers.', 'success');
    } catch (err: any) {
      NotificationService.showInAppToast('Copie', err?.message || 'Impossible de copier la discussion.', 'error');
    }
  };

  const handleCopyConversationAsJson = async (conversationId: string) => {
    setConvItemMenuId(null);
    try {
      const { conv, messages: msgs } = await fetchFullConversation(conversationId);
      await navigator.clipboard.writeText(buildMAIConversationJSON(conv, msgs));
      haptics.success();
      NotificationService.showInAppToast('Copié', 'JSON de la discussion copié.', 'success');
    } catch (err: any) {
      NotificationService.showInAppToast('Copie', err?.message || 'Impossible de copier la discussion.', 'error');
    }
  };

  // Charger le réglage d'auto-approbation des outils mAI
  useEffect(() => {
    ApiService.getSettings()
      .then((res) => setAutoApprove(Boolean(res?.settings?.mai_auto_approve_tools)))
      .catch(() => {});
  }, []);

  const toggleAutoApprove = async () => {
    const next = !autoApprove;
    setAutoApprove(next);
    try {
      await ApiService.updateSettings({ mai_auto_approve_tools: next });
    } catch {
      setAutoApprove(!next);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    ApiService.updateSettings({ mai_default_model: modelId }).catch(() => {});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setPromptInput(text);

    const cursor = e.target.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const lastWord = textBeforeCursor.split(/\s+/).pop() || '';

    if (lastWord.startsWith('/') || lastWord.startsWith('@')) {
      setAutocompleteTrigger(lastWord[0] as '/' | '@');
      setAutocompleteQuery(lastWord);
    } else {
      setAutocompleteTrigger(null);
      setAutocompleteQuery('');
    }
  };

  const handleSelectTool = (tool: MAITool) => {
    const tag = autocompleteTrigger === '/' ? tool.slashCommand : tool.mentionTag;
    const words = promptInput.split(/\s+/);
    words.pop();
    const newPrefix = words.length > 0 ? `${words.join(' ')} ` : '';
    const updated = `${newPrefix}${tag} `;

    setPromptInput(updated);
    setAutocompleteTrigger(null);
    setAutocompleteQuery('');
    inputRef.current?.focus();
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const query = (textToSend || promptInput).trim();
    if (!query || isExecuting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: query,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setAutocompleteTrigger(null);
    setIsExecuting(true);

    try {
      const res = await ApiService.chatMAI(query, undefined, selectedModel, undefined, activeConversationId || undefined);
      // Outils utilisés (persistés côté serveur) — repli local pour les anciens formats
      const toolCalls: MaiToolCall[] = res.toolCalls?.length
        ? res.toolCalls
        : res.toolExecuted
        ? [{
            id: `local-${Date.now()}`,
            name: res.toolExecuted.name,
            args: {},
            status: res.toolExecuted.result?.success === false ? 'error' : 'executed',
            result: res.toolExecuted.result,
            at: new Date().toISOString(),
          }]
        : res.requiresApproval && res.pendingTool
        ? [{
            id: `local-${Date.now()}`,
            name: res.pendingTool.name,
            args: res.pendingTool.args,
            status: 'pending_approval',
            at: new Date().toISOString(),
          }]
        : [];
      const maiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        serverId: res.assistant_message_id || undefined,
        sender: 'mai',
        content: res.reply,
        toolExecuted: res.toolExecuted,
        toolCalls,
        modelUsed: res.modelUsed || selectedModel,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        requiresApproval: Boolean(res.requiresApproval),
      };
      setMessages((prev) => [...prev, maiMsg]);
      if (res.requiresApproval && res.pendingTool) {
        setPendingTool(res.pendingTool);
      }
      if (res.conversation_id && res.conversation_id !== activeConversationId) {
        setActiveConversationId(res.conversation_id);
      }
      // Titre automatique (premier message) + ordre de la liste
      loadConversations();
      refreshQuotas();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'mai',
        content: `⚠️ Erreur : ${err.message || 'Impossible de joindre mAI.'}`,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApproveTool = async (approved: boolean) => {
    if (!pendingTool || isApproving) return;
    setIsApproving(true);
    const tool = pendingTool;
    setPendingTool(null);

    const pushMaiMsg = (content: string, toolExecuted?: any, toolCalls?: MaiToolCall[]) => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: 'mai',
          content,
          toolExecuted,
          toolCalls,
          modelUsed: selectedModel,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    };

    if (!approved) {
      // Refus persisté côté serveur (flux d'approbation conservé dans l'historique)
      try {
        const res = await ApiService.refuseMAITool(tool.name, tool.args, activeConversationId || undefined);
        pushMaiMsg(res.reply, undefined, res.toolCalls);
      } catch {
        pushMaiMsg(`🚫 Très bien, je n'exécute pas l'outil « ${tool.name} ». Dites-moi si je peux faire autre chose pour vous.`);
      }
      setIsApproving(false);
      return;
    }

    try {
      const res = await ApiService.executeMAITool(tool.name, tool.args, selectedModel, true, activeConversationId || undefined);
      pushMaiMsg(res.reply, res.toolExecuted, res.toolCalls);
      refreshQuotas();
    } catch (err: any) {
      pushMaiMsg(`⚠️ Erreur lors de l'exécution de « ${tool.name} » : ${err.message || 'réessayez plus tard.'}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditPrompt = (text: string) => {
    setPromptInput(text);
    inputRef.current?.focus();
  };

  const handlePublishAsPost = (content: string, imageUrl?: string) => {
    // Préremplit le composer Vibe — l'utilisateur valide la publication lui-même
    window.dispatchEvent(
      new CustomEvent('vibe:open_composer', { detail: { content, imageUrl } })
    );
  };

  /** Regénère la dernière réponse mAI (remplace la bulle, sans rejouer le prompt côté client). */
  const handleRegenerate = async () => {
    if (isRegenerating || isExecuting) return;
    setIsRegenerating(true);
    try {
      const res = await ApiService.regenerateMAI({ model: selectedModel, conversationId: activeConversationId || undefined });
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].sender === 'mai') {
            next[i] = {
              ...next[i],
              content: res.reply,
              toolExecuted: null,
              toolCalls: [],
              modelUsed: res.modelUsed || next[i].modelUsed,
            };
            break;
          }
        }
        return next;
      });
      haptics.success();
      refreshQuotas();
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast(
        'Régénération',
        err?.message || 'La régénération de la réponse a échoué.',
        'error'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  // Liste des conversations mAI (sidebar desktop + tiroir mobile)
  const conversationList = (
    <>
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
          <MessagesSquare className="w-3.5 h-3.5" /> Discussions
        </span>
        <button
          onClick={handleNewConversation}
          title="Nouvelle discussion mAI"
          className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
        {conversationsLoading && conversations.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-center text-[11px] text-zinc-500">Aucune discussion pour l'instant.</p>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            const isRenaming = renamingId === c.id;
            return (
              <div
                key={c.id}
                className={`group/item relative rounded-xl transition-colors ${isActive ? 'bg-zinc-900' : 'hover:bg-zinc-900/60'}`}
              >
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRenameConversation(c.id, renameDraft);
                      }
                      if (e.key === 'Escape') {
                        setRenamingId(null);
                        setRenameDraft('');
                      }
                    }}
                    onBlur={() => handleRenameConversation(c.id, renameDraft)}
                    maxLength={120}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                  />
                ) : (
                  <button type="button" onClick={() => handleSelectConversation(c.id)} className="w-full text-left px-3 py-2 pr-9">
                    <span className="flex items-center gap-1.5">
                      <span className="block text-[11px] font-bold text-white truncate flex-1">
                        {stripMarkdownText(c.title)}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono shrink-0">{formatConvDate(c.updated_at)}</span>
                    </span>
                    {(() => {
                      const formatted = formatConversationPreview(c.preview, c.message_count);
                      if (typeof formatted === 'string') {
                        return (
                          <span className="block text-[10px] text-zinc-600 truncate mt-0.5">
                            {formatted}
                          </span>
                        );
                      }
                      return (
                        <span
                          className="block text-[10px] text-zinc-500 truncate mt-0.5 [&_strong]:font-semibold [&_strong]:text-zinc-300 [&_b]:font-semibold [&_b]:text-zinc-300 [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded [&_code]:text-[9px]"
                          dangerouslySetInnerHTML={formatted}
                        />
                      );
                    })()}
                  </button>
                )}
                {!isRenaming && (
                  <div className="absolute right-1 top-1.5">
                    <button
                      type="button"
                      onClick={() => setConvItemMenuId(convItemMenuId === c.id ? null : c.id)}
                      className={`p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-opacity ${convItemMenuId === c.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}
                      title="Actions de la discussion"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {convItemMenuId === c.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setConvItemMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-48 z-40 p-1 rounded-xl vibe-menu shadow-2xl animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => {
                              setConvItemMenuId(null);
                              setRenamingId(c.id);
                              setRenameDraft(c.title);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Renommer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateConversation(c.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                          >
                            <CopyPlus className="w-3.5 h-3.5" /> Dupliquer
                          </button>
                          <div className="border-t border-zinc-800 my-1" />
                          <button
                            type="button"
                            onClick={() => handleExportConversation(c.id, 'md')}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                          >
                            <Download className="w-3.5 h-3.5" /> Exporter (Markdown)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportConversation(c.id, 'json')}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                          >
                            <FileJson className="w-3.5 h-3.5" /> Exporter (JSON)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyConversation(c.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                          >
                            <ClipboardCopy className="w-3.5 h-3.5" /> Copier (Markdown)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyConversationAsJson(c.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                          >
                            <ClipboardCopy className="w-3.5 h-3.5" /> Copier (JSON)
                          </button>
                          <div className="border-t border-zinc-800 my-1" />
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(c.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-red-400 hover:bg-red-950/40 text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        className="flex-1 h-screen border-r border-zinc-800 bg-black flex select-none"
        style={{ height: 'calc(100dvh - var(--vibe-kb-offset, 0px))' }}
      >
        {/* Sidebar desktop : multi-conversations mAI */}
        <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col border-r border-zinc-800">
          {conversationList}
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            title="Discussions mAI"
            className="p-2 -ml-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors md:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              <span>mAI</span>
            </h1>
            <p className="text-xs text-zinc-400 truncate max-w-[40vw]">
              {conversations.find((c) => c.id === activeConversationId)?.title || 'Assistant IA unifié & modèles intelligents'}
            </p>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="flex items-center gap-2">
          <ModelDropdown
            models={availableModels}
            selectedModelId={selectedModel}
            onSelectModel={handleSelectModel}
          />

          <button
            onClick={handleNewConversation}
            title="Nouvelle discussion mAI"
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <SquarePen className="w-4 h-4" />
          </button>

          <button
            onClick={toggleAutoApprove}
            title={autoApprove ? 'Auto-approbation des outils mAI activée' : 'Approbation manuelle des outils mAI'}
            className={`p-2 rounded-full transition-colors ${
              autoApprove ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {autoApprove ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </button>

          <button
            onClick={refreshQuotas}
            title="Actualiser les quotas"
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Quotas Quick Strip */}
      {quotas && (
        <div className="px-4 py-2 border-b border-zinc-900 bg-black/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Tokens : {quotas.weeklyTokens.used.toLocaleString()} / {quotas.weeklyTokens.limit.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <ImageIcon className="w-3.5 h-3.5 text-white" />
              <span>Images : {quotas.dailyImages.used} / {quotas.dailyImages.limit}</span>
            </span>
          </div>
          <span className="text-zinc-500">Forfait {quotas.tier}</span>
        </div>
      )}

      {/* Bannière utilisateur (affichée uniquement avant le début de la conversation) */}
      {messages.length === 0 && (
        <div className="mx-4 mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Bienvenue, <span className="text-white font-black">@{user?.username || 'utilisateur'}</span> !
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                Assistant mAI — Posez vos questions ou utilisez les commandes @ et /.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-600 animate-pulse" />
            <p className="text-sm font-medium text-zinc-400">Comment puis-je vous aider aujourd'hui ?</p>
            <p className="text-xs text-zinc-600 max-w-sm">
              Posez une question, ou tapez <span className="font-mono text-zinc-400">/image</span> pour créer un visuel, <span className="font-mono text-zinc-400">/search</span> pour chercher sur le web.
            </p>
          </div>
        )}
        {messages.map((m, idx) => {
          const isMe = m.sender === 'user';
          const isCopied = copiedId === m.id;
          const imageUrl =
            m.toolCalls?.find((tc) => tc.result?.result?.imageUrl)?.result?.result?.imageUrl ||
            m.toolExecuted?.result?.result?.imageUrl ||
            null;

          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              <div
                className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed relative ${
                  isMe
                    ? 'bg-white text-black font-medium rounded-tr-sm shadow-lg'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-tl-sm'
                }`}
              >
                {!isMe && (
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-900 text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Sparkles className="w-3 h-3" />
                      mAI
                    </span>
                    <span>{m.time}</span>
                  </div>
                )}

                <div className="leading-relaxed space-y-2">
                  <RichContent content={m.content} className="leading-relaxed" />
                </div>

                {/* Outils utilisés par mAI (chips persistantes, rechargées de l'historique) */}
                <MaiToolChips toolCalls={m.toolCalls} className="mt-2.5" />

                {/* Panneau d'approbation utilisateur pour les outils sensibles */}
                {m.requiresApproval && pendingTool && (
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-900 border border-amber-500/40 space-y-2">
                    <p className="text-[11px] font-mono text-amber-300 uppercase tracking-wide">
                      🔐 Outil sensible : {pendingTool.name}
                    </p>
                    <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                      {JSON.stringify(pendingTool.args, null, 2)}
                    </pre>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveTool(true)}
                        disabled={isApproving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                      >
                        {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Approuver
                      </button>
                      <button
                        onClick={() => handleApproveTool(false)}
                        disabled={isApproving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Refuser
                      </button>
                    </div>
                  </div>
                )}

                {/* Rich Tool Execution Display */}
                {imageUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-800">
                    <img
                      src={imageUrl}
                      alt="Génération mAI"
                      className="w-full max-h-96 object-cover"
                    />
                  </div>
                )}

                {/* Interactive Message Actions (Copy / Edit / Share) */}
                <div className={`flex items-center gap-2 pt-2.5 mt-2 border-t text-[11px] font-mono ${isMe ? 'border-zinc-200 text-zinc-600 justify-end' : 'border-zinc-900 text-zinc-400 justify-between'}`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(m.id, m.content)}
                      className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded-md"
                      title="Copier le texte"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copié !' : 'Copier'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareMessageText(m.content)}
                      className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded-md"
                      title="Partager par message Vibe"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Partager</span>
                    </button>

                    {isMe && (
                      <button
                        type="button"
                        onClick={() => handleEditPrompt(m.content)}
                        className="flex items-center gap-1 hover:text-black transition-colors p-1 rounded-md"
                        title="Modifier le prompt"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                    )}
                  </div>

                  {!isMe && (
                    <div className="flex items-center gap-2">
                      {idx === messages.length - 1 && !m.toolExecuted && !(m.toolCalls && m.toolCalls.length > 0) && (
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          disabled={isRegenerating || isExecuting || Boolean(m.requiresApproval)}
                          className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors p-1 disabled:opacity-40"
                          title="Regénérer la réponse"
                        >
                          {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>Regénérer</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePublishAsPost(m.content, imageUrl || undefined)}
                        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors p-1"
                        title="Publier sur Vibe"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Publier sur Vibe</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isMe && (
                <span className="text-[10px] text-zinc-500 px-2 mt-1 font-mono">{m.time}</span>
              )}
            </div>
          );
        })}

        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>mAI analyse votre requête ({selectedModel})...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Prompt Input Form with @ and / autocomplete */}
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 sticky bottom-0 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="relative flex items-center gap-2"
        >
          {autocompleteTrigger && (
            <ToolAutocomplete
              trigger={autocompleteTrigger}
              query={autocompleteQuery}
              onSelect={handleSelectTool}
              onClose={() => setAutocompleteTrigger(null)}
            />
          )}

          <input
            ref={inputRef}
            type="text"
            value={promptInput}
            onChange={handleInputChange}
            placeholder="Écrivez un message, ou tapez @ ou / pour un outil (ex: /image, /search, /trends)..."
            className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />

          <button
            type="submit"
            disabled={!promptInput.trim() || isExecuting}
            className="py-3 px-6 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>
      </div>
        </div>
      </div>

      {/* Tiroir mobile : liste des conversations mAI */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-black border-r border-zinc-800 flex flex-col shadow-2xl animate-fadeIn">
            {conversationList}
          </aside>
        </div>
      )}

      {/* Partage d'un message mAI par message Vibe */}
      {shareMessageText !== null && (
        <ShareToDMModal
          isOpen={shareMessageText !== null}
          onClose={() => setShareMessageText(null)}
          initialMessage={shareMessageText}
        />
      )}

      {confirmDialog}
    </>
  );
};
