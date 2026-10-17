/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — BOOKS PAGE (src/pages/BooksPage.tsx)
 * « Livres » : collections de Vibe préférées (max 5 possédés par compte),
 * COLLABORATIVES. Liste (possédés + rejoints), vue d'un Livre (Vibe partagées
 * + membres + attribution), création, édition, suppression (créateur),
 * jointure par lien/code, partage, sortie (membres).
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon as ArrowLeft, PlusIcon as Plus, Loader2Icon as Loader2, AlertCircleIcon as AlertCircle, Trash2Icon as Trash2, PencilIcon as Pencil, CheckIcon as Check, XIcon as X, BookHeartIcon as BookHeart, SparklesIcon as Sparkles, UsersIcon as Users, LogOutIcon as LogOut, Share2Icon as Share2, Link2Icon as Link2, KeyRoundIcon as KeyRound, UserPlusIcon as UserPlus, ChevronDownIcon as ChevronDown, CopyIcon as Copy, RefreshCwIcon as RefreshCw, PinIcon as Pin, PinOffIcon as PinOff, MessageSquareIcon as MessageSquare, SendIcon as Send } from "@mdevs/icons";
import type { VibeBook, VibeBookMember, VibeBookPost } from '../types/vibe';
import { ApiService } from '../services/api';
import { NotificationService } from '../services/notificationService';
import { BOOK_ICON_OPTIONS, getBookIcon } from '../components/common/bookIcons';
import { extractBookCode, isValidBookCode, buildBookJoinLink } from '../components/common/bookCode';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import { htmlToPlainText } from '../components/common/RichContent';
import { PostCard } from '../components/feed/PostCard';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import { haptics } from '../services/haptics';

function RenderBookIcon({ icon, className }: { icon?: string; className?: string }) {
  const IconComponent = getBookIcon(icon || 'BookHeart');
  return React.createElement(IconComponent, { className });
}

const isOwnerOf = (b?: VibeBook | null) => b?.is_owner !== false;

export const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId?: string }>();

  const [books, setBooks] = useState<VibeBook[]>([]);
  const [maxBooks, setMaxBooks] = useState(5);
  const [ownedCount, setOwnedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Menu « Plus » (créer / rejoindre)
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinSubmenuOpen, setJoinSubmenuOpen] = useState(false);

  // Création / édition
  const [showCreate, setShowCreate] = useState(false);
  const [editingBook, setEditingBook] = useState<VibeBook | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formIcon, setFormIcon] = useState('BookHeart');
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Jointure par lien / code
  const [joinMode, setJoinMode] = useState<'link' | 'code' | null>(null);
  const [joinValue, setJoinValue] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Vue d'un Livre
  const [book, setBook] = useState<VibeBook | null>(null);
  const [posts, setPosts] = useState<VibeBookPost[]>([]);
  const [members, setMembers] = useState<VibeBookMember[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Partage / sortie / régénération
  const [shareOpen, setShareOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  // Épingles et envoi par message
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [shareTab, setShareTab] = useState<'invite' | 'send'>('invite');
  const [sendQuery, setSendQuery] = useState('');
  const [sendResults, setSendResults] = useState<Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string }>>([]);
  const [sendGroups, setSendGroups] = useState<Array<{ id: string; name: string; avatar_url?: string }>>([]);
  const [isSendingBook, setIsSendingBook] = useState(false);
  const sendDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { confirm, confirmDialog } = useConfirmDialog();

  const fetchBooks = useCallback((silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    ApiService.getBooks()
      .then((res) => {
        const list = res.books || [];
        setBooks(list);
        setMaxBooks(res.maxBooks || 5);
        setOwnedCount(res.ownedCount ?? list.filter((b) => b.is_owner !== false).length);
      })
      .catch((err: any) => {
        if (!silent) setError(err?.message || 'Impossible de charger vos Livres.');
      })
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, []);

  const fetchBookDetail = useCallback((silent = false) => {
    if (!bookId) return;
    ApiService.getBookPosts(bookId)
      .then((res) => {
        setBook(res.book || null);
        setPosts(res.posts || []);
        setMembers(res.members || []);
      })
      .catch((err: any) => {
        if (!silent) setError(err?.message || 'Livre introuvable.');
      })
      .finally(() => {
        if (!silent) setIsLoadingPosts(false);
      });
  }, [bookId]);

  useEffect(() => {
    if (!bookId) fetchBooks();
  }, [bookId, fetchBooks]);

  useEffect(() => {
    if (!bookId) return;
    setIsLoadingPosts(true);
    fetchBookDetail();
  }, [bookId, fetchBookDetail]);

  // Synchronisation collaborative : refresh silencieux 30 s + au retour de focus
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      if (bookId) fetchBookDetail(true);
      else fetchBooks(true);
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [bookId, fetchBooks, fetchBookDetail]);

  const closeMenu = () => {
    setMenuOpen(false);
    setJoinSubmenuOpen(false);
  };

  const openCreate = () => {
    haptics.light();
    closeMenu();
    setEditingBook(null);
    setFormTitle('');
    setFormIcon('BookHeart');
    setFormIsPublic(false);
    setShowCreate(true);
  };

  const openEdit = (b: VibeBook) => {
    haptics.light();
    setEditingBook(b);
    setFormTitle(b.title);
    setFormIcon(b.icon || 'BookHeart');
    setFormIsPublic(Boolean(b.is_public));
    setShowCreate(true);
  };

  const openJoin = (mode: 'link' | 'code') => {
    haptics.light();
    closeMenu();
    setJoinMode(mode);
    setJoinValue('');
    setJoinError(null);
  };

  const closeJoin = () => {
    setJoinMode(null);
    setJoinValue('');
    setJoinError(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editingBook) {
        const res = await ApiService.updateBook(editingBook.id, { title: formTitle.trim(), icon: formIcon, is_public: formIsPublic });
        setBooks((list) => list.map((b) => (b.id === editingBook.id ? { ...b, ...res.book } : b)));
        setBook((b) => (b && b.id === editingBook.id ? { ...b, ...res.book } : b));
        haptics.success();
        NotificationService.showInAppToast('Livre modifié', `« ${res.book.title} » a été mis à jour.`, 'success');
      } else {
        const res = await ApiService.createBook(formTitle.trim(), formIcon, formIsPublic);
        setBooks((list) => [...list, res.book]);
        setOwnedCount((n) => n + 1);
        haptics.success();
        NotificationService.showInAppToast(
          'Livre créé',
          `« ${res.book.title} » est prêt. Partagez son code pour collaborer !`,
          'success'
        );
      }
      setShowCreate(false);
    } catch (err: any) {
      haptics.error();
      setError(err?.message || 'La sauvegarde du Livre a échoué.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinSubmit = async () => {
    if (isJoining) return;
    const code = extractBookCode(joinValue);
    if (!isValidBookCode(code)) {
      setJoinError(joinMode === 'link' ? "Ce lien d'invitation est invalide." : "Ce code d'invitation est invalide.");
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await ApiService.joinBook(code);
      if (!res.book?.id) throw new Error('Réponse inattendue du serveur.');
      haptics.success();
      NotificationService.showInAppToast(
        res.already_member ? 'Déjà membre' : 'Livre rejoint',
        res.already_member
          ? `Vous êtes déjà membre du Livre « ${res.book.title} ».`
          : `Bienvenue dans le Livre « ${res.book.title} » !`,
        'success'
      );
      closeJoin();
      navigate(`/books/${res.book.id}`);
    } catch (err: any) {
      haptics.error();
      setJoinError(err?.message || 'Impossible de rejoindre ce Livre.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteBook = async (b: VibeBook) => {
    haptics.warning();
    const ok = await confirm({
      title: `Supprimer « ${b.title} » ?`,
      message: "Les Vibe enregistrées ne seront pas supprimées, mais les membres perdront l'accès.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ApiService.deleteBook(b.id);
      setBooks((list) => list.filter((x) => x.id !== b.id));
      setOwnedCount((n) => Math.max(0, n - 1));
      haptics.medium();
      NotificationService.showInAppToast('Livre supprimé', `« ${b.title} » a été supprimé.`, 'info');
      // Depuis la vue d'un Livre : retour à la liste (pas de page fantôme)
      if (bookId) navigate('/books');
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || 'La suppression a échoué.', 'error');
    }
  };

  const handleLeaveBook = async (b: VibeBook, fromDetail = false) => {
    if (isLeaving) return;
    haptics.warning();
    const ok = await confirm({
      title: `Quitter « ${b.title} » ?`,
      message: "Vous n'aurez plus accès à son contenu.",
      confirmLabel: 'Quitter',
    });
    if (!ok) return;
    setIsLeaving(true);
    try {
      await ApiService.leaveBook(b.id);
      haptics.medium();
      NotificationService.showInAppToast('Livre quitté', `Vous avez quitté « ${b.title} ».`, 'info');
      if (fromDetail) navigate('/books');
      else setBooks((list) => list.filter((x) => x.id !== b.id));
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || 'Impossible de quitter le Livre.', 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!book || isRegenerating) return;
    const ok = await confirm({
      title: "Régénérer le code d'invitation ?",
      message: "L'ancien lien de partage ne fonctionnera plus.",
      confirmLabel: 'Régénérer',
      tone: 'danger',
    });
    if (!ok) return;
    setIsRegenerating(true);
    try {
      const res = await ApiService.regenerateBookCode(book.id);
      setBook((b) => (b ? { ...b, join_code: res.join_code } : b));
      haptics.success();
      NotificationService.showInAppToast('Nouveau code', "Le code a été régénéré. L'ancien lien est désormais invalide.", 'success');
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || 'La régénération a échoué.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRemoveFromBook = async (postId: string) => {
    if (!bookId || !book) return;
    haptics.medium();
    // Optimiste
    const prev = posts;
    setPosts((list) => list.filter((p) => p.id !== postId));
    try {
      await ApiService.toggleBookItem(bookId, postId);
      NotificationService.showInAppToast('Retiré', `Cette Vibe a été retirée du Livre « ${book.title} ».`, 'info');
    } catch {
      setPosts(prev);
      haptics.error();
      NotificationService.showInAppToast('Erreur', 'Le retrait a échoué.', 'error');
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      NotificationService.showInAppToast('Copié', `${label} copié dans le presse-papiers.`, 'success');
    } catch {
      NotificationService.showInAppToast('À copier manuellement', text, 'info');
    }
  };

  // ── Envoi par message : groupes du compte + recherche (debounce) ──
  useEffect(() => {
    if (!shareOpen) return;
    setShareTab('invite');
    setSendQuery('');
    setSendResults([]);
    ApiService.getConversations()
      .then((res) => {
        const groups = (res.conversations || [])
          .filter((cv) => cv.is_group && !cv.is_book)
          .map((cv) => ({
            id: String(cv.partner_id),
            name: cv.partner_display_name || cv.partner_username || 'Groupe',
            avatar_url: cv.partner_avatar_url,
          }));
        setSendGroups(groups);
      })
      .catch(() => {});
  }, [shareOpen]);

  useEffect(() => {
    if (!shareOpen || shareTab !== 'send') return;
    if (sendDebounceRef.current) clearTimeout(sendDebounceRef.current);
    const q = sendQuery.trim();
    if (!q) {
      setSendResults([]);
      return;
    }
    sendDebounceRef.current = setTimeout(() => {
      ApiService.searchUsers(q)
        .then((res) => setSendResults((res.users || []).slice(0, 8)))
        .catch(() => setSendResults([]));
    }, 300);
    return () => {
      if (sendDebounceRef.current) clearTimeout(sendDebounceRef.current);
    };
  }, [sendQuery, shareTab, shareOpen]);

  /** Épingle / désépingle une Vibe dans le Livre (max 3). */
  const handleTogglePinBookPost = async (post: VibeBookPost) => {
    if (!bookId || pinningId) return;
    setPinningId(post.id);
    try {
      await ApiService.pinBookPost(bookId, post.id, !post.is_pinned);
      haptics.success();
      fetchBookDetail(true);
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || "L'épinglage a échoué.", 'error');
    } finally {
      setPinningId(null);
    }
  };

  /** Exclut un membre du Livre (créateur uniquement). */
  const handleKickBookMember = async (member: VibeBookMember) => {
    if (!book) return;
    const ok = await confirm({
      title: 'Exclure ce membre ?',
      message: `@${member.username} n'aura plus accès au Livre « ${book.title} ».`,
      confirmLabel: 'Exclure',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ApiService.kickBookMember(book.id, member.user_id);
      setMembers((list) => list.filter((m) => String(m.user_id) !== String(member.user_id)));
      haptics.success();
      NotificationService.showInAppToast('Membre exclu', `@${member.username} n'a plus accès au Livre.`, 'success');
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || "L'exclusion a échoué.", 'error');
    }
  };

  /** Transfère la propriété du Livre à un membre (créateur uniquement). */
  const handleTransferOwnership = async (member: VibeBookMember) => {
    if (!book) return;
    const ok = await confirm({
      title: 'Transférer la propriété ?',
      message: `@${member.username} deviendra créateur du Livre « ${book.title} » et vous deviendrez simple membre.`,
      confirmLabel: 'Transférer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ApiService.transferBookOwnership(book.id, member.user_id);
      haptics.success();
      NotificationService.showInAppToast('Propriété transférée', `@${member.username} est désormais créateur du Livre.`, 'success');
      fetchBookDetail(true);
      fetchBooks(true);
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || 'Le transfert a échoué.', 'error');
    }
  };

  /** Envoie le Livre (titre + lien d'invitation) en message privé. */
  const handleSendBookTo = async (target: { kind: 'user' | 'group'; id: string | number; label: string }) => {
    if (!book || isSendingBook) return;
    if (!book.join_code) {
      NotificationService.showInAppToast('Erreur', "Ce Livre n'a pas de lien d'invitation.", 'error');
      return;
    }
    setIsSendingBook(true);
    const message = `📚 Livre « ${book.title} »\n${buildBookJoinLink(book.join_code)}`;
    try {
      if (target.kind === 'group') {
        await ApiService.sendMessage(undefined as unknown as number, message, undefined, undefined, String(target.id));
      } else {
        await ApiService.sendMessage(target.id, message);
      }
      haptics.success();
      NotificationService.showInAppToast('Envoyé', `L'invitation a été envoyée à ${target.label}.`, 'success');
      setShareOpen(false);
    } catch (err: any) {
      haptics.error();
      NotificationService.showInAppToast('Erreur', err?.message || "L'envoi a échoué.", 'error');
    } finally {
      setIsSendingBook(false);
    }
  };

  // ─────────────── Vue d'un Livre ───────────────
  if (bookId) {
    const shareLink = book?.join_code ? buildBookJoinLink(book.join_code) : '';
    const owner = isOwnerOf(book);
    // Lecteur d'un Livre public (non-membre) : lecture seule (pas d'invitation, de sortie ni d'épinglage)
    const memberOf = book ? book.is_member !== false : true;
    const pinnedPosts = posts.filter((p) => Boolean(p.is_pinned));
    const regularPosts = posts.filter((p) => !p.is_pinned);
    const renderBookPostRow = (p: VibeBookPost) => (
      <div key={p.id}>
        <div className="flex items-center gap-1.5 px-4 pt-2.5 text-[10px] text-zinc-600">
          {p.added_by_username && (
            <>
              <UserPlus className="w-3 h-3" />
              <span>
                Ajouté par{' '}
                <button
                  onClick={() => navigate(`/@${p.added_by_username}`)}
                  className="text-zinc-400 hover:text-white hover:underline"
                >
                  @{p.added_by_username}
                </button>
              </span>
            </>
          )}
          <span className="ml-auto flex items-center gap-1.5">
            {memberOf && (
              <button
                onClick={() => handleTogglePinBookPost(p)}
                disabled={pinningId === p.id}
                className={`p-1 rounded-full transition-colors ${p.is_pinned ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-600 hover:text-white'}`}
                title={p.is_pinned ? 'Désépingler' : 'Épingler en haut du Livre (max 3)'}
              >
                {pinningId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : p.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </button>
            )}
            <button
              onClick={() =>
                copyText(
                  htmlToPlainText(String(p.content || '')) + (p.added_by_username ? `\n— @${p.added_by_username}` : ''),
                  'Texte de la Vibe'
                )
              }
              className="p-1 rounded-full text-zinc-600 hover:text-white transition-colors"
              title="Copier le texte de la Vibe (avec attribution)"
            >
              <Copy className="w-3 h-3" />
            </button>
          </span>
        </div>
        <PostCard
          post={p}
          onPostDeleted={(id) => setPosts((list) => list.filter((x) => String(x.id) !== String(id)))}
          onRemoveFromBook={memberOf ? (id) => handleRemoveFromBook(id) : undefined}
        />
      </div>
    );

    // Discussion du Livre : ouvre la conversation du Livre dans Messages
    // (créée automatiquement à la création/adhésion, mécanismes de groupe).
    const openBookDiscussion = async () => {
      let convId = book?.conversation_id || null;
      if (!convId && bookId) {
        // Le champ peut manquer (page chargée avant la création) : nouvelle tentative
        try {
          const res = await ApiService.getBookPosts(bookId);
          if (res.book) setBook(res.book);
          convId = res.book?.conversation_id || null;
        } catch {}
      }
      if (!convId) {
        NotificationService.showInAppToast('Discussion', 'Discussion en préparation — rechargez la page.', 'info');
        return;
      }
      navigate(`/messages?conv=group:${convId}`);
    };

    return (
      <div className="flex-1 border-r border-zinc-800 min-h-screen bg-black pb-16 md:pb-0">
        <div className="flex min-h-screen">
          <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 backdrop-blur-md bg-black/70 border-b border-zinc-800">
          <div className="p-4 flex items-center gap-3">
            <button onClick={() => navigate('/books')} className="p-2 -m-2 rounded-full text-zinc-400 hover:text-white" title="Retour aux Livres">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {book && (
              <span className="p-2 rounded-xl text-sky-300 bg-sky-500/10 border border-sky-500/30">
                <RenderBookIcon icon={book.icon} className="w-4 h-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-white truncate">{book?.title || 'Livre'}</h1>
              <p className="text-xs text-zinc-500">
                {posts.length} Vibe enregistrée{posts.length > 1 ? 's' : ''}
                {members.length > 0 && ` · ${members.length} membre${members.length > 1 ? 's' : ''}`}
                {!owner && (book?.is_public && !memberOf ? ' · Livre public' : ' · Livre partagé')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {book?.is_public && !memberOf && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-sky-300 bg-sky-500/10 border border-sky-500/30 mr-1">
                  Livre public
                </span>
              )}
              <button
                onClick={() => book && copyText(book.title, 'Titre du Livre')}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
                title="Copier le titre du Livre"
              >
                <Copy className="w-4 h-4" />
              </button>
              {memberOf && (
                <button
                  onClick={() => {
                    haptics.light();
                    setShareOpen(true);
                  }}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
                  title="Inviter — partager le lien ou le code"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              {memberOf && (
                <button
                  onClick={() => {
                    haptics.light();
                    openBookDiscussion();
                  }}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
                  title="Ouvrir la discussion dans Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              {owner ? (
                <>
                  <button
                    onClick={() => book && openEdit(book)}
                    className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
                    title="Renommer le Livre"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => book && handleDeleteBook(book)}
                    className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-950/40"
                    title="Supprimer le Livre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : memberOf ? (
                <button
                  onClick={() => book && handleLeaveBook(book, true)}
                  disabled={isLeaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 text-[11px] text-zinc-400 hover:text-red-400 hover:border-red-900/60 transition-colors disabled:opacity-40"
                  title="Quitter le Livre"
                >
                  {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  Quitter
                </button>
              ) : null}
            </div>
          </div>

          {/* Membres ayant rejoint le Livre */}
          {members.length > 0 && (
            <div className="px-4 pb-3 -mt-1 flex items-center gap-2">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((m) => (
                  <ProfileAvatar
                    key={String(m.user_id)}
                    src={m.avatar_url}
                    fallbackName={m.username}
                    size="xs"
                    alt={m.username}
                    className="ring-2 ring-black"
                    onClick={() => navigate(`/@${m.username}`)}
                  />
                ))}
              </div>
              {members.length > 5 && (
                <span className="text-[10px] text-zinc-500 font-mono">+{members.length - 5}</span>
              )}
              <span className="text-[10px] text-zinc-600">
                Tout le monde peut inviter via le bouton Partager
              </span>
            </div>
          )}
        </header>

        {error && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-3">
            <span className="p-4 rounded-full bg-zinc-900 text-zinc-500">
              <BookHeart className="w-8 h-8" />
            </span>
            <p className="text-sm text-zinc-400">Ce Livre est vide pour l'instant.</p>
            <p className="text-xs text-zinc-600 max-w-xs">
              Enregistrez vos Vibe préférées avec le bouton « Livre » sous une publication — chaque membre peut enrichir le Livre.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {pinnedPosts.length > 0 && (
              <div className="px-4 pt-3 pb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-400 font-bold">
                <Pin className="w-3 h-3" /> Épinglés
              </div>
            )}
            {pinnedPosts.map(renderBookPostRow)}
            {pinnedPosts.length > 0 && regularPosts.length > 0 && (
              <div className="px-4 pt-3 pb-0.5 text-[10px] uppercase tracking-wide text-zinc-600 font-bold">
                Toutes les Vibes
              </div>
            )}
            {regularPosts.map(renderBookPostRow)}
          </div>
        )}
          </div>
        </div>

        {/* ─── Modale de partage / invitation ─── */}
        {shareOpen && book && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            onClick={() => setShareOpen(false)}
          >
            <div
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Inviter dans ce Livre
                </h3>
                <button onClick={() => setShareOpen(false)} className="text-zinc-500 hover:text-white" title="Fermer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Onglets : inviter (lien/code) / envoyer par message */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
                <button
                  onClick={() => setShareTab('invite')}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${shareTab === 'invite' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  Inviter
                </button>
                <button
                  onClick={() => setShareTab('send')}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${shareTab === 'send' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  Envoyer en message
                </button>
              </div>

              {shareTab === 'send' && (
                <div className="space-y-3">
                  <input
                    value={sendQuery}
                    onChange={(e) => setSendQuery(e.target.value)}
                    placeholder="Rechercher un compte..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  {sendResults.length > 0 && (
                    <div className="max-h-32 overflow-y-auto divide-y divide-zinc-900 rounded-xl border border-zinc-800">
                      {sendResults.map((u) => (
                        <button
                          key={String(u.id)}
                          onClick={() => handleSendBookTo({ kind: 'user', id: u.id, label: `@${u.username}` })}
                          disabled={isSendingBook}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-900/60 text-left disabled:opacity-40"
                        >
                          <ProfileAvatar src={u.avatar_url} fallbackName={u.username} size="xs" alt={u.username} />
                          <span className="text-xs text-zinc-200 truncate">@{u.username}</span>
                          <Send className="w-3.5 h-3.5 text-zinc-500 ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {sendGroups.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">Groupes</p>
                      <div className="max-h-32 overflow-y-auto divide-y divide-zinc-900 rounded-xl border border-zinc-800">
                        {sendGroups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => handleSendBookTo({ kind: 'group', id: g.id, label: g.name })}
                            disabled={isSendingBook}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-900/60 text-left disabled:opacity-40"
                          >
                            <ProfileAvatar src={g.avatar_url} fallbackName={g.name} size="xs" alt={g.name} />
                            <span className="text-xs text-zinc-200 truncate">{g.name}</span>
                            <Send className="w-3.5 h-3.5 text-zinc-500 ml-auto shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-600 text-center">
                    Un message avec le titre du Livre et son lien d'invitation sera envoyé.
                  </p>
                </div>
              )}

              {shareTab === 'invite' && (
                <>

              {/* Membres */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">
                  Membres ({members.length})
                </p>
                <div className="max-h-40 overflow-y-auto divide-y divide-zinc-900 rounded-xl border border-zinc-800">
                  {members.map((m) => (
                    <div
                      key={String(m.user_id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
                    >
                      <ProfileAvatar src={m.avatar_url} fallbackName={m.username} size="xs" alt={m.username} />
                      <button
                        onClick={() => {
                          setShareOpen(false);
                          navigate(`/@${m.username}`);
                        }}
                        className="text-xs text-zinc-200 truncate hover:underline"
                      >
                        @{m.username}
                      </button>
                      <span
                        className={`ml-auto shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          m.role === 'owner'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {m.role === 'owner' ? 'Créateur' : 'Membre'}
                      </span>
                      {owner && m.role !== 'owner' && (
                        <span className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleTransferOwnership(m)}
                            className="text-[10px] font-semibold text-sky-400 hover:underline"
                            title="Transférer la propriété du Livre"
                          >
                            Transférer
                          </button>
                          <button
                            onClick={() => handleKickBookMember(m)}
                            className="text-zinc-500 hover:text-red-400"
                            title="Exclure du Livre"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lien d'invitation */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">
                  Lien d'invitation
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareLink || 'Code indisponible'}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-300 focus:outline-none"
                  />
                  <button
                    onClick={() => shareLink && copyText(shareLink, "Lien d'invitation")}
                    disabled={!shareLink}
                    className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 shrink-0"
                    title="Copier le lien"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code d'invitation */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">
                  Code d'invitation
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm tracking-[0.3em] text-white text-center select-all">
                    {book.join_code || '—'}
                  </span>
                  <button
                    onClick={() => book.join_code && copyText(book.join_code, "Code d'invitation")}
                    disabled={!book.join_code}
                    className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 shrink-0"
                    title="Copier le code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {owner && (
                <button
                  onClick={handleRegenerateCode}
                  disabled={isRegenerating}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Régénérer le code (invalide l'ancien lien)
                </button>
              )}

              <p className="text-[10px] text-zinc-600 text-center">
                Tout le monde peut inviter en partageant ce lien ou ce code.
              </p>
                </>
              )}
            </div>
          </div>
        )}
        {confirmDialog}
      </div>
    );
  }

  // ─────────────── Liste des Livres ───────────────
  return (
    <div className="flex-1 border-r border-zinc-800 min-h-screen bg-black pb-16 md:pb-0">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/70 border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl text-sky-300 bg-sky-500/10 border border-sky-500/30">
            <BookHeart className="w-4 h-4" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-white">Livres</h1>
            <p className="text-xs text-zinc-500">Collections de Vibe, seul ou à plusieurs</p>
          </div>
        </div>

        {/* Bouton Plus : créer ou rejoindre un Livre */}
        <div className="relative">
          <button
            onClick={() => {
              haptics.light();
              setMenuOpen((v) => !v);
              setJoinSubmenuOpen(false);
            }}
            style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-white text-black text-xs font-bold transition-all"
            title="Créer ou rejoindre un Livre"
          >
            <Plus className="w-3.5 h-3.5" />
            Livre
            <ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenu} />
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-3xl vibe-menu p-2 shadow-2xl animate-fadeIn space-y-1">
                <button
                  onClick={openCreate}
                  disabled={ownedCount >= maxBooks}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-2xl text-xs transition-colors text-left hover:bg-zinc-900/60 dark:hover:bg-white/5 disabled:opacity-40"
                  title={ownedCount >= maxBooks ? `Limite de ${maxBooks} Livres possédés atteinte` : 'Créer un Livre'}
                >
                  <span className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-zinc-900 dark:text-white">Créer un livre</span>
                    <span className="block text-[10px] text-zinc-500">
                      {ownedCount >= maxBooks
                        ? `Limite de ${maxBooks} Livres possédés atteinte`
                        : 'Un nouveau Livre prêt à être partagé'}
                    </span>
                  </span>
                </button>

                <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                <button
                  onClick={() => setJoinSubmenuOpen((v) => !v)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-2xl text-xs transition-colors text-left hover:bg-zinc-900/60 dark:hover:bg-white/5"
                >
                  <span className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-zinc-900 dark:text-white">Rejoindre un livre</span>
                    <span className="block text-[10px] text-zinc-500">Avec un lien d'invitation ou un code</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 mt-2 text-zinc-500 transition-transform ${joinSubmenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {joinSubmenuOpen && (
                  <div className="pl-3 space-y-1 animate-fadeIn">
                    <button
                      onClick={() => openJoin('link')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs transition-colors text-left hover:bg-zinc-900/60 dark:hover:bg-white/5"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0 text-sky-300" />
                      <span className="text-zinc-900 dark:text-white">Par lien</span>
                    </button>
                    <button
                      onClick={() => openJoin('code')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs transition-colors text-left hover:bg-zinc-900/60 dark:hover:bg-white/5"
                    >
                      <KeyRound className="w-3.5 h-3.5 shrink-0 text-sky-300" />
                      <span className="text-zinc-900 dark:text-white">Par code</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {(error || (!isLoading && ownedCount >= maxBooks && books.length > 0)) && (
        <div className="px-4 pt-3 space-y-2">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {!isLoading && ownedCount >= maxBooks && books.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Limite de {maxBooks} Livres possédés atteinte — vous pouvez toujours en rejoindre d'autres.</span>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-3">
          <span className="p-4 rounded-full bg-zinc-900 text-zinc-500">
            <Sparkles className="w-8 h-8" />
          </span>
          <p className="text-sm text-zinc-400">Créez ou rejoignez votre premier Livre</p>
          <p className="text-xs text-zinc-600 max-w-xs">
            Un Livre regroupe vos « Vibe préférées » : créez le vôtre, invitez des amis avec un lien, et enrichissez-le ensemble.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={openCreate}
              style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
              className="py-2 px-5 rounded-full bg-white text-black text-xs font-bold"
            >
              Créer un Livre
            </button>
            <button
              onClick={() => openJoin('code')}
              className="flex items-center gap-1.5 py-2 px-5 rounded-full border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-600"
            >
              <Users className="w-3.5 h-3.5" />
              Rejoindre un Livre
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {books.map((b) => {
            const owner = isOwnerOf(b);
            return (
              <div
                key={b.id}
                onClick={() => navigate(`/books/${b.id}`)}
                className="group relative border border-zinc-800 rounded-3xl p-5 bg-zinc-950/60 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2.5 rounded-2xl text-sky-300 bg-sky-500/10 border border-sky-500/20">
                      <RenderBookIcon icon={b.icon} className="w-5 h-5" />
                    </span>
                    {(b.members_count || 0) > 1 && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                        <Users className="w-2.5 h-2.5" />
                        {b.members_count}
                      </span>
                    )}
                    {!owner && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                        Partagé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {owner ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(b);
                          }}
                          className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800"
                          title="Renommer le Livre"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(b);
                          }}
                          className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-950/40"
                          title="Supprimer le Livre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveBook(b);
                        }}
                        className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-950/40"
                        title="Quitter le Livre"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-bold text-white truncate">{b.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {b.items_count || 0} Vibe enregistrée{(b.items_count || 0) > 1 ? 's' : ''}
                  {owner ? ' · votre Livre' : ' · rejoint'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de création / édition de Livre */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{editingBook ? 'Renommer le Livre' : 'Nouveau Livre'}</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white" title="Fermer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              autoFocus
              maxLength={60}
              placeholder="Titre du Livre (ex. Inspirations)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">Icône du Livre</p>
              <div className="grid grid-cols-8 gap-1.5">
                {BOOK_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setFormIcon(opt.name);
                    }}
                    title={opt.name}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      formIcon === opt.name
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
                    }`}
                  >
                    <opt.Component className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsPublic}
                onChange={(e) => setFormIsPublic(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-white cursor-pointer"
              />
              <span>
                <span className="block text-xs font-bold text-white">Livre public</span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  Toute personne peut consulter ce Livre en lecture seule et le mentionner (@livre). Le code d'invitation reste privé.
                </span>
              </span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!formTitle.trim() || isSaving}
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingBook ? 'Enregistrer' : 'Créer le Livre'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de jointure (par lien / par code) */}
      {joinMode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={closeJoin}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {joinMode === 'link' ? <Link2 className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                {joinMode === 'link' ? 'Rejoindre par lien' : 'Rejoindre par code'}
              </h3>
              <button onClick={closeJoin} className="text-zinc-500 hover:text-white" title="Fermer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              {joinMode === 'link'
                ? "Collez le lien d'invitation reçu (ex. https://…/books/join/AB3DEFG7)."
                : "Saisissez le code d'invitation à 8 caractères (sans I, L, O, 0 ni 1)."}
            </p>
            {joinError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}
            <input
              type="text"
              value={joinValue}
              onChange={(e) =>
                setJoinValue(joinMode === 'code' ? e.target.value.toUpperCase() : e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinSubmit();
              }}
              autoFocus
              maxLength={joinMode === 'code' ? 12 : 300}
              placeholder={joinMode === 'code' ? 'AB3DEFG7' : 'https://…/books/join/AB3DEFG7'}
              className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 ${
                joinMode === 'code' ? 'font-mono tracking-[0.25em] text-center uppercase' : ''
              }`}
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleJoinSubmit}
                disabled={!extractBookCode(joinValue) || isJoining}
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Rejoindre le Livre
              </button>
              <button
                onClick={closeJoin}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
};
