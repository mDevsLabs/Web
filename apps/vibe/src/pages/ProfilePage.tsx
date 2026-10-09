/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — PROFILE PAGE (src/pages/ProfilePage.tsx)
 * User profile view with file-only Avatar/Banner uploads, Verified Badge & Username edit
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon as Calendar, Edit3Icon as Edit3, ArrowLeftIcon as ArrowLeft, XIcon as X, CameraIcon as Camera, LogOutIcon as LogOut, SettingsIcon, UploadIcon as Upload, Loader2Icon as Loader2, BadgeCheckIcon as BadgeCheck, AlertCircleIcon as AlertCircle, Share2Icon as Share2, MoreHorizontalIcon as MoreHorizontal, EyeOffIcon as EyeOff, BanIcon as Ban, UsersIcon as Users, BellIcon as Bell, BellRingIcon as BellRing, BarChart2Icon as BarChart2, CalendarClockIcon as CalendarClock, Link2Icon as Link2, MapPinIcon as MapPin } from "@mdevs/icons";
import type { Profile, Post, ProfileListUser } from '../types/vibe';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/notificationService';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import { haptics } from '../services/haptics';
import { PostCard } from '../components/feed/PostCard';
import { ScheduledCalendar } from '../components/feed/ScheduledCalendar';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import { RichContent } from '../components/common/RichContent';
import { ProfileShareModal } from '../components/profile/ProfileShareModal';
import { TagInput } from '../components/common/TagInput';
import { RichTextEditor, type RichTextEditorHandle } from '../components/common/RichTextEditor';

interface ProfilePageProps {
  username?: string;
  onBack?: () => void;
  onOpenThread: (post: Post) => void;
  onOpenProfile: (username: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  username,
  onBack,
  onOpenThread,
  onOpenProfile,
}) => {
  const navigate = useNavigate();
  const { user, profile: authProfile, updateUserAvatar, updateUser, refreshProfile, logout, isLoadingSession } = useAuth();
  const rawTarget = username || user?.username || 'utilisateur';
  const targetUsername = rawTarget.replace(/^@/, '');
  const isSelf = Boolean(user && user.username && user.username.toLowerCase().replace(/^@/, '') === targetUsername.toLowerCase());

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes' | 'stats' | 'scheduled'>('posts');
  const [creatorStats, setCreatorStats] = useState<{ total_views: number; total_likes: number; total_reposts: number; total_replies: number; posts_count: number; top_post: Post | null; daily: Array<{ day: string; views: number; posts: number }> } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPostNotifOn, setIsPostNotifOn] = useState(false);
  // Cercle Privé : ce membre fait-il partie de MON cercle ?
  const [isInCircle, setIsInCircle] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // Modération sur les profils d'autrui : mute (silencieux) / block (visible)
  const [showModMenu, setShowModMenu] = useState(false);
  const { confirm, confirmDialog } = useConfirmDialog();
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [mutedByMe, setMutedByMe] = useState(false);

  // Listes abonnés / abonnements (modale) + vues du profil (soi-même)
  const [followersModal, setFollowersModal] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<ProfileListUser[]>([]);
  const [followListOffset, setFollowListOffset] = useState(0);
  const [followListHasMore, setFollowListHasMore] = useState(false);
  const [isLoadingFollowList, setIsLoadingFollowList] = useState(false);
  const [followBusyIds, setFollowBusyIds] = useState<Set<string>>(new Set());
  const [profileViews, setProfileViews] = useState<{ total: number; series: Array<{ day: string; views: number }> } | null>(null);

  // Edit fields
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bioEditorRef = useRef<RichTextEditorHandle>(null);

  // ── Listes d'abonnés / abonnements (modale + pagination) ──
  const loadFollowList = useCallback(async (kind: 'followers' | 'following', offset: number) => {
    setIsLoadingFollowList(true);
    try {
      const res = kind === 'followers'
        ? await ApiService.getProfileFollowers(targetUsername, 20, offset)
        : await ApiService.getProfileFollowing(targetUsername, 20, offset);
      const users = (res.users || []) as ProfileListUser[];
      setFollowList((prev) => (offset === 0 ? users : [...prev, ...users]));
      setFollowListOffset(offset + users.length);
      setFollowListHasMore(Boolean(res.has_more));
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || 'Impossible de charger la liste.', 'error');
    } finally {
      setIsLoadingFollowList(false);
    }
  }, [targetUsername]);

  const openFollowModal = (kind: 'followers' | 'following') => {
    haptics.light();
    setFollowersModal(kind);
    setFollowList([]);
    setFollowListOffset(0);
    setFollowListHasMore(false);
    loadFollowList(kind, 0);
  };

  const handleToggleFollowInList = async (u: ProfileListUser) => {
    if (!user || String(u.id) === String(user.id)) return;
    setFollowBusyIds((prev) => new Set(prev).add(String(u.id)));
    try {
      const res = await ApiService.toggleFollow(u.username);
      setFollowList((list) => list.map((x) => (String(x.id) === String(u.id) ? { ...x, is_following: res.following } : x)));
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setFollowBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(String(u.id));
        return next;
      });
    }
  };

  // Vues du profil (soi-même, onglet Stats) — 30 jours
  useEffect(() => {
    if (!isSelf || activeTab !== 'stats') return;
    let cancelled = false;
    ApiService.getProfileViews('30d')
      .then((res) => {
        if (!cancelled) setProfileViews({ total: res.total || 0, series: res.series || [] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSelf, activeTab]);


  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await ApiService.getProfile(targetUsername);
      setProfile(data.profile);
      setPosts(data.posts || []);
      setIsFollowing(Boolean((data.profile as any).isFollowing));
      setBlockedByMe(Boolean((data.profile as any).blocked_by_me));
      setBlockedMe(Boolean((data.profile as any).blocked_me));
      setMutedByMe(Boolean((data.profile as any).muted_by_me));
      setEditUsername(data.profile.username || targetUsername);
      setEditName(data.profile.displayName || '');
      setEditBio(data.profile.bio || '');
      setEditInterests(data.profile.interests ?? []);
      setEditWebsite(data.profile.website || '');
      setEditLocation(data.profile.location || '');
      setEditAvatar(data.profile.avatarUrl || '');
      setEditBanner(data.profile.bannerUrl || '');
    } catch (err: any) {
      if (isSelf && authProfile) {
        setProfile(authProfile);
        setEditUsername(user?.username || targetUsername);
        setEditName(authProfile.displayName || '');
        setEditBio(authProfile.bio || '');
        setEditAvatar(authProfile.avatarUrl || '');
        setEditInterests(authProfile.interests ?? []);
        setEditWebsite(authProfile.website || '');
        setEditLocation(authProfile.location || '');
        setEditBanner(authProfile.bannerUrl || '');
      } else {
        setProfileError(err?.message || 'Impossible de charger ce profil.');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [targetUsername, isSelf, authProfile, user?.username]);

  useEffect(() => {
    if (!username && isLoadingSession) return;
    queueMicrotask(() => {
      fetchProfile();
    });
    // État du bouton « Cercle Privé » (profils d'autrui uniquement)
    if (!isSelf && targetUsername) {
      ApiService.checkCircle(targetUsername)
        .then((res) => setIsInCircle(Boolean(res?.in_circle)))
        .catch(() => {});
      ApiService.getPostSubscription(targetUsername)
        .then((res) => setIsPostNotifOn(Boolean(res?.subscribed)))
        .catch(() => setIsPostNotifOn(false));
      // Visite profil : comptage serveur anti-spam (fire-and-forget)
      ApiService.trackProfileView(targetUsername, 'profile').catch(() => {});
    } else {
      setIsInCircle(false);
      setIsPostNotifOn(false);
    }
    const handlePostUpdated = () => {
      fetchProfile();
    };
    window.addEventListener('vibe:post_updated', handlePostUpdated);
    return () => {
      window.removeEventListener('vibe:post_updated', handlePostUpdated);
    };
  }, [fetchProfile, username, isLoadingSession, isSelf, targetUsername]);

  // Charger les publications aimées au clic sur l'onglet 'likes'
  useEffect(() => {
    if (activeTab === 'likes' && likedPosts.length === 0) {
      queueMicrotask(() => {
        setIsLoadingLiked(true);
        ApiService.getUserLikedPosts(targetUsername)
          .then((res) => setLikedPosts(res.posts || []))
          .catch(() => setLikedPosts([]))
          .finally(() => setIsLoadingLiked(false));
      });
    }
  }, [activeTab, targetUsername, likedPosts.length]);

  // Charger les stats créateur à l'ouverture de l'onglet 'stats' (soi-même)
  useEffect(() => {
    if (activeTab === 'stats' && isSelf && !creatorStats && !isLoadingStats) {
      queueMicrotask(() => {
        setIsLoadingStats(true);
        ApiService.getCreatorStats()
          .then((res) => setCreatorStats(res))
          .catch(() => setCreatorStats(null))
          .finally(() => setIsLoadingStats(false));
      });
    }
  }, [activeTab, isSelf, creatorStats, isLoadingStats]);

  const handleFollowToggle = async () => {
    haptics.medium();
    const next = !isFollowing;
    setIsFollowing(next);
    // Mise à jour immédiate des compteurs affichés
    setProfile((prev) => prev ? {
      ...prev,
      followersCount: Math.max(0, (prev.followersCount || 0) + (next ? 1 : -1)),
    } : prev);
    try {
      await ApiService.toggleFollow(targetUsername);
    } catch {
      setIsFollowing(!next);
      setProfile((prev) => prev ? {
        ...prev,
        followersCount: Math.max(0, (prev.followersCount || 0) + (next ? -1 : 1)),
      } : prev);
    }
  };

  /** Active/désactive les notifications de nouveaux posts de ce compte. */
  const handlePostNotifToggle = async () => {
    const next = !isPostNotifOn;
    setIsPostNotifOn(next);
    try {
      const res = await ApiService.togglePostSubscription(targetUsername);
      setIsPostNotifOn(Boolean(res?.subscribed));
      NotificationService.showInAppToast(
        res?.subscribed ? 'Notifications activées' : 'Notifications désactivées',
        res?.subscribed
          ? `Vous serez notifié des nouvelles Vibe de @${targetUsername}.`
          : `Vous ne serez plus notifié des nouvelles Vibe de @${targetUsername}.`,
        'info'
      );
    } catch (err: any) {
      setIsPostNotifOn(!next);
      NotificationService.showInAppToast('Erreur', err?.message || "L'abonnement aux posts a échoué.", 'error');
    }
  };

  /** Mute : masque silencieusement les publications/notifications de ce compte. */
  const handleToggleMute = async () => {
    setShowModMenu(false);
    try {
      const res = await ApiService.muteUser(targetUsername, !mutedByMe);
      const nowMuted = Boolean(res?.muted);
      setMutedByMe(nowMuted);
      NotificationService.showInAppToast(
        nowMuted ? 'Compte masqué' : 'Compte réactivé',
        nowMuted
          ? `Les publications de @${targetUsername} n'apparaîtront plus dans votre fil.`
          : `Les publications de @${targetUsername} réapparaissent dans votre fil.`,
        'info'
      );
      window.dispatchEvent(new CustomEvent('vibe:feed_refresh'));
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || 'Le masquage a échoué.', 'error');
    }
  };

  /** Ajoute ou retire ce profil de mon Cercle Privé (audience des posts « Cercle Privé »). */
  const handleCircleToggle = async () => {
    if (!targetUsername) return;
    const next = !isInCircle;
    setIsInCircle(next);
    try {
      if (next) {
        await ApiService.addToCircle(targetUsername);
        NotificationService.showInAppToast('Cercle Privé', `@${targetUsername} verra vos publications « Cercle Privé ».`, 'success');
      } else {
        await ApiService.removeFromCircle(targetUsername);
        NotificationService.showInAppToast('Cercle Privé', `@${targetUsername} a été retiré de votre cercle.`, 'info');
      }
    } catch (err: any) {
      setIsInCircle(!next);
      NotificationService.showInAppToast('Erreur', err?.message || 'La modification du cercle a échoué.', 'error');
    }
  };

  /** Block : coupe tout contact de manière visible (DM, follow, notifications). */
  const handleToggleBlock = async () => {
    setShowModMenu(false);
    if (!blockedByMe) {
      const ok = await confirm({
        title: `Bloquer @${targetUsername} ?`,
        message: 'Cette action coupe tout contact de manière visible : messages, abonnement et notifications.',
        confirmLabel: 'Bloquer',
        tone: 'danger',
      });
      if (!ok) return;
    }
    const targetId = String(profile?.id || '');
    if (!targetId) return;
    try {
      if (blockedByMe) {
        await ApiService.unblockUser(targetId);
      } else {
        await ApiService.blockUser(targetId);
        // Le blocage coupe l'abonnement existant
        if (isFollowing) {
          try { await ApiService.toggleFollow(targetUsername); } catch {}
          setIsFollowing(false);
        }
      }
      setBlockedByMe(!blockedByMe);
      setMutedByMe(false);
      NotificationService.showInAppToast(
        blockedByMe ? 'Compte débloqué' : 'Compte bloqué',
        blockedByMe
          ? `@${targetUsername} peut de nouveau interagir avec vous.`
          : `@${targetUsername} ne pourra plus interagir avec vous.`,
        'info'
      );
      window.dispatchEvent(new CustomEvent('vibe:feed_refresh'));
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || 'Le blocage a échoué.', 'error');
    }
  };

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const res = await ApiService.uploadAvatar(file);
      if (res.avatarUrl) {
        setEditAvatar(res.avatarUrl);
        await updateUserAvatar(res.avatarUrl);
        await fetchProfile();
        await refreshProfile();
      }
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', `Upload photo de profil impossible : ${err.message}`, 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDirectBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const res = await ApiService.uploadFile(file);
      if (res.url) {
        setEditBanner(res.url);
        await ApiService.updateProfile({ bannerUrl: res.url });
        await fetchProfile();
      }
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', `Upload bannière impossible : ${err.message}`, 'error');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setIsSaving(true);
    try {
      const cleanUser = editUsername.trim().toLowerCase().replace(/^@/, '');

      if (cleanUser && !/^[a-z0-9_]{2,30}$/.test(cleanUser)) {
        setEditError("Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _).");
        setIsSaving(false);
        return;
      }

      const res = await ApiService.updateProfile({
        username: cleanUser || undefined,
        displayName: editName.trim(),
        bio: bioEditorRef.current?.getHTML() ?? editBio,
        interests: editInterests,
        avatarUrl: editAvatar,
        bannerUrl: editBanner,
        website: editWebsite.trim(),
        location: editLocation.trim(),
      } as any);

      // Synchroniser l'utilisateur avec la réponse du serveur (username modifié inclus)
      const updatedProfile = (res as any)?.profile;
      const finalUsername = updatedProfile?.username || cleanUser;
      if (finalUsername) {
        updateUser({ username: finalUsername, avatar_url: updatedProfile?.avatarUrl || editAvatar });
        navigate(`/@${finalUsername}`, { replace: true });
      }
      await refreshProfile();
      await fetchProfile();
      setIsEditOpen(false);
    } catch (err: any) {
      setEditError(err.message || 'Erreur lors de la modification du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeAvatar = profile?.avatarUrl || (isSelf ? authProfile?.avatarUrl || user?.avatar_url : null);
  // Coche bleue masquée par le propriétaire (réglage hide_verified_badge)
  const hideVerifiedBadge = Boolean(profile?.hide_verified_badge);
  const isVerified = !hideVerifiedBadge && Boolean(
    profile?.is_verified ||
    (profile as any)?.isVerified ||
    (isSelf && user?.is_verified) ||
    ['plus', 'pro', 'max'].includes(((isSelf ? user?.tier : profile?.tier) || '').toLowerCase().trim())
  );

  const displayedPosts = useMemo(() => {
    if (activeTab === 'media') {
      return posts.filter((p) => p.media_assets && p.media_assets.length > 0);
    }
    if (activeTab === 'likes') {
      return likedPosts;
    }
    if (activeTab === 'replies') {
      return posts.filter((p) => (p as any).is_reply || Number(p.replies_count || 0) > 0);
    }
    return posts;
  }, [activeTab, posts, likedPosts]);

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8 select-none">
      {/* Hidden file inputs for direct camera / file upload via storage.ts */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleDirectAvatarUpload}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleDirectBannerUpload}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{profile?.displayName || (isLoadingProfile ? 'Chargement...' : targetUsername)}</span>
              <VerifiedBadge isVerified={isVerified} size="sm" />
            </h1>
            <p className="text-xs text-zinc-500 font-mono">
              {posts.length} {posts.length <= 1 ? 'publication' : 'publications'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelf && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Paramètres & Personnalisation"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
          {isSelf && (
            <button
              onClick={() => navigate('/stats')}
              data-tour="profile-stats-button"
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Mes statistiques créateur"
              aria-label="Voir mes statistiques"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Partager le profil (Carte, QR Code, Lien)"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {isSelf && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-900/50 bg-red-950/20 text-red-400 text-xs font-medium hover:bg-red-950/40 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          )}

          {/* Menu de modération (profil d'autrui) : Masquer / Bloquer */}
          {!isSelf && (
            <div className="relative">
              {showModMenu && (
                <div className="fixed inset-0 z-20" onClick={() => setShowModMenu(false)} />
              )}
              <button
                onClick={() => setShowModMenu(!showModMenu)}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Plus d'options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showModMenu && (
                <div className="absolute right-0 top-9 z-30 w-56 vibe-menu rounded-2xl p-1.5 space-y-1">
                  <button
                    onClick={handleToggleMute}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-white" />
                    <span>{mutedByMe ? `Réactiver @${targetUsername}` : `Masquer @${targetUsername}`}</span>
                  </button>
                  <button
                    onClick={handleToggleBlock}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-2"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{blockedByMe ? `Débloquer @${targetUsername}` : `Bloquer @${targetUsername}`}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Banner */}
      <div className="h-44 sm:h-52 w-full bg-zinc-900 relative overflow-hidden border-b border-zinc-800 group">
        {isLoadingProfile ? (
          <div className="w-full h-full bg-zinc-950 animate-pulse flex items-center justify-center text-zinc-600 text-xs font-mono">
            Chargement...
          </div>
        ) : profile?.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-black" />
        )}

        {isSelf && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingBanner}
            className="absolute top-3 right-3 py-1.5 px-3 rounded-full bg-black/70 backdrop-blur-md border border-zinc-700 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 hover:bg-black"
          >
            {isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <span>Changer la bannière</span>
          </button>
        )}
      </div>

      {/* Profile Details Container */}
      <div className="px-4 pb-4 space-y-4 relative">
        {/* Avatar & Action Button */}
        <div className="flex items-end justify-between -mt-16 sm:-mt-20">
          <div className="relative group">
            <ProfileAvatar
              src={activeAvatar}
              alt="Avatar"
              size="2xl"
              isLoading={isLoadingProfile}
              fallbackName={targetUsername}
              className="border-4 border-black bg-zinc-900 shadow-2xl"
            />
            {isSelf && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-xs z-20"
                title="Télécharger une photo de profil"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-semibold">Changer</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="py-2 px-4 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500"
              title="Partager le compte Vibe (Carte HD, QR Code, Lien)"
            >
              <Share2 className="w-3.5 h-3.5 text-black dark:text-white" />
              <span className="text-black dark:text-white">Partager</span>
            </button>

            {isSelf ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="py-2 px-5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-black dark:text-white" />
                <span className="text-black dark:text-white">Modifier le profil</span>
              </button>
            ) : blockedByMe ? (
              <button
                onClick={handleToggleBlock}
                className="py-2 px-6 rounded-full font-bold text-xs transition-all border border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40"
              >
                Débloquer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFollowToggle}
                  style={!isFollowing ? { backgroundColor: 'var(--vibe-accent, #ffffff)' } : undefined}
                  className={`py-2 px-6 rounded-full font-bold text-xs transition-all ${
                    isFollowing
                      ? 'border border-zinc-700 bg-transparent text-white hover:bg-zinc-900'
                      : 'bg-white text-black hover:brightness-90'
                  }`}
                >
                  {isFollowing ? 'Abonné' : 'Suivre'}
                </button>
                <button
                  onClick={handlePostNotifToggle}
                  className={`p-2.5 rounded-full font-semibold text-xs transition-all border ${
                    isPostNotifOn
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                      : 'border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                  title={isPostNotifOn ? `Ne plus être notifié des posts de @${targetUsername}` : `Me notifier des nouvelles Vibe de @${targetUsername}`}
                >
                  {isPostNotifOn ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleCircleToggle}
                  className={`py-2 px-4 rounded-full font-semibold text-xs transition-all border flex items-center gap-1.5 ${
                    isInCircle
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      : 'border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                  title={isInCircle ? `Retirer @${targetUsername} de votre Cercle Privé` : `Autoriser @${targetUsername} à voir vos publications « Cercle Privé »`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isInCircle ? 'Dans le cercle' : 'Ajouter au cercle'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{profile?.displayName || targetUsername}</h2>
              <VerifiedBadge isVerified={isVerified} tier={hideVerifiedBadge ? undefined : isSelf ? user?.tier : profile?.tier} size="md" />
            </div>
            <span className="text-xs text-zinc-500 font-mono">@{targetUsername}</span>
          </div>

          <div className="text-sm text-zinc-200 leading-relaxed">
            <RichContent
              content={profile?.bio || 'Membre actif de la communauté Vibe.'}
              onOpenProfile={onOpenProfile}
            />
          </div>

          {/* Interests Tags */}
          {profile?.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.interests.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Site web & localisation */}
          {(profile?.website || profile?.location) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono">
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-zinc-300 transition-colors max-w-full"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{profile.website.replace(/^https?:\/\//i, '')}</span>
                </a>
              )}
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          )}

          {/* Meta data */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-2 font-mono">
            {(Boolean((profile as any)?.created_at) || (isSelf && user?.created_at)) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Inscrit sur Vibe en{' '}
                  {new Date((profile as any)?.created_at || user?.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
            {isVerified && (
              <div className="flex items-center gap-1">
                <VerifiedBadge isVerified={true} tier={isSelf ? user?.tier : (profile as any)?.tier} size="xs" />
                <span className="text-zinc-400">Compte Vérifié</span>
              </div>
            )}
          </div>

          {/* Followers / Following Counters (listes cliquables) */}
          <div className="flex items-center gap-4 text-xs pt-1">
            <button
              type="button"
              onClick={() => openFollowModal('following')}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Voir les abonnements"
            >
              <strong className="text-white font-bold">{profile?.followingCount || 0}</strong> abonnements
            </button>
            <button
              type="button"
              onClick={() => openFollowModal('followers')}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Voir les abonnés"
            >
              <strong className="text-white font-bold">{profile?.followersCount || 0}</strong> abonnés
            </button>
          </div>
        </div>
      </div>

      {/* Bannières d'état de modération */}
      {!isSelf && blockedByMe && (
        <div className="mx-4 mb-2 p-3 rounded-2xl bg-red-950/30 border border-red-900/50 text-xs text-red-300 flex items-center gap-2">
          <Ban className="w-4 h-4 shrink-0" />
          <span>
            Vous avez bloqué @{targetUsername}. Ses publications et interactions n'apparaissent plus,
            et il ne peut plus vous contacter.
          </span>
        </div>
      )}
      {!isSelf && mutedByMe && !blockedByMe && (
        <div className="mx-4 mb-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
          <EyeOff className="w-4 h-4 shrink-0" />
          <span>
            Vous avez masqué @{targetUsername} : ses publications n'apparaissent plus dans votre fil
            (il ne peut pas le savoir).
          </span>
        </div>
      )}
      {!isSelf && blockedMe && !blockedByMe && (
        <div className="mx-4 mb-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
          @{targetUsername} vous a bloqué. Vous ne pouvez pas interagir avec ce compte.
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-950 overflow-x-auto">
        {(['posts', 'replies', 'media', 'likes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              haptics.light();
              setActiveTab(tab);
            }}
            className="flex-1 min-w-20 py-3 text-center text-xs font-semibold uppercase tracking-wider relative transition-colors hover:bg-zinc-900"
          >
            <span className={activeTab === tab ? 'text-white' : 'text-zinc-500'}>
              {tab === 'posts' ? 'Vibes' : tab === 'replies' ? 'Réponses' : tab === 'media' ? 'Médias' : 'J’aime'}
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
            )}
          </button>
        ))}
        {isSelf && (
          <>
            <button
              onClick={() => {
                haptics.light();
                setActiveTab('stats');
              }}
              className="flex-1 min-w-20 py-3 text-center text-xs font-semibold uppercase tracking-wider relative transition-colors hover:bg-zinc-900"
              title="Statistiques créateur (30 jours)"
            >
              <span className={`inline-flex items-center gap-1 ${activeTab === 'stats' ? 'text-white' : 'text-zinc-500'}`}>
                <BarChart2 className="w-3.5 h-3.5" />
                Stats
              </span>
              {activeTab === 'stats' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                haptics.light();
                setActiveTab('scheduled');
              }}
              className="flex-1 min-w-20 py-3 text-center text-xs font-semibold uppercase tracking-wider relative transition-colors hover:bg-zinc-900"
              title="Posts programmés"
            >
              <span className={`inline-flex items-center gap-1 ${activeTab === 'scheduled' ? 'text-white' : 'text-zinc-500'}`}>
                <CalendarClock className="w-3.5 h-3.5" />
                Programmés
              </span>
              {activeTab === 'scheduled' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Panneau statistiques créateur (soi-même, 30 jours) */}
      {isSelf && activeTab === 'stats' && (
        <div className="p-4">
          {isLoadingStats ? (
            <div className="p-12 text-center text-zinc-400 text-sm flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              <span>Chargement des statistiques…</span>
            </div>
          ) : !creatorStats ? (
            <p className="p-12 text-center text-zinc-500 text-xs">Statistiques indisponibles.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Vues (30 j)', value: creatorStats.total_views },
                  { label: 'Likes (30 j)', value: creatorStats.total_likes },
                  { label: 'Reposts (30 j)', value: creatorStats.total_reposts },
                  { label: 'Réponses (30 j)', value: creatorStats.total_replies },
                  { label: 'Posts (30 j)', value: creatorStats.posts_count },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
                    <p className="text-lg font-bold text-white">{c.value}</p>
                    <p className="text-[11px] text-zinc-500">{c.label}</p>
                  </div>
                ))}
              </div>
              {/* Vues du profil (visiteurs de ta page, 30 jours) */}
              <div className="mt-3 rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Vues du profil (30 j)
                </p>
                <p className="text-lg font-bold text-white">{profileViews ? profileViews.total : '—'}</p>
                {profileViews && profileViews.series.length > 0 && (
                  <div className="flex items-end gap-1 h-12 mt-2">
                    {profileViews.series.map((d, i) => {
                      const maxV = Math.max(1, ...profileViews.series.map((x) => Number(x.views || 0)));
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm bg-sky-400/70"
                          style={{ height: `${Math.max(6, (Number(d.views || 0) / maxV) * 100)}%` }}
                          title={`${d.day} : ${d.views} vues`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              {creatorStats.top_post && (
                <div className="mt-3 rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                    Post le plus engagé
                  </p>
                  <PostCard
                    post={creatorStats.top_post}
                    onOpenThread={onOpenThread}
                    onOpenProfile={onOpenProfile}
                  />
                </div>
              )}
              {creatorStats.daily?.length > 0 && (
                <>
                  <p className="mt-4 mb-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Vues quotidiennes
                  </p>
                  <div className="flex items-end gap-1.5 h-24 rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
                    {creatorStats.daily.map((d, i) => {
                      const max = Math.max(1, ...creatorStats.daily.map((x) => Number(x.views || 0)));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                          <div
                            className="w-full rounded-t-md bg-white/80"
                            style={{ height: `${Math.max(4, (Number(d.views || 0) / max) * 100)}%` }}
                            title={`${d.day} : ${d.views} vues`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Panneau posts programmés (soi-même, calendrier drag & drop) */}
      {isSelf && activeTab === 'scheduled' && <ScheduledCalendar />}

      {/* Real Posts Stream from DB (masqué sur les onglets stats/programmés) */}
      {activeTab !== 'stats' && activeTab !== 'scheduled' && (
      <div className="divide-y divide-zinc-900">
        {(isLoadingProfile || (activeTab === 'likes' && isLoadingLiked)) && (
          <div className="p-16 text-center text-zinc-400 text-sm flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            <span>
              {activeTab === 'likes'
                ? 'Chargement des mentions J’aime…'
                : 'Chargement des publications…'}
            </span>
          </div>
        )}

        {!isLoadingProfile && !(activeTab === 'likes' && isLoadingLiked) && profileError && (
          <div className="p-16 text-center text-zinc-500 text-xs flex flex-col items-center gap-3">
            <span>{profileError}</span>
            <button
              onClick={fetchProfile}
              className="py-2 px-4 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoadingProfile && !(activeTab === 'likes' && isLoadingLiked) && !profileError && displayedPosts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onPostDeleted={(postId) => {
              setPosts((prev) => prev.filter((x) => String(x.id) !== String(postId)));
              setLikedPosts((prev) => prev.filter((x) => String(x.id) !== String(postId)));
            }}
            onOpenThread={onOpenThread}
            onOpenProfile={onOpenProfile}
          />
        ))}

        {!isLoadingProfile && !(activeTab === 'likes' && isLoadingLiked) && !profileError && displayedPosts.length === 0 && (
          <div className="p-16 text-center text-zinc-500 text-xs">
            {activeTab === 'media'
              ? 'Aucun média partagé pour le moment.'
              : activeTab === 'likes'
              ? 'Aucune mention J’aime pour le moment.'
              : activeTab === 'replies'
              ? 'Aucune réponse publiée pour le moment.'
              : 'Aucune vibe publiée pour le moment.'}
          </div>
        )}
      </div>
      )}

      {/* Edit Profile & Avatar Modal (File Uploads Only, No URL input) */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          {/* Panneau limité à la hauteur de l'écran : l'en-tête (croix de sortie)
              et les boutons d'action restent toujours visibles, les champs
              défilent au centre */}
          <div className="w-full max-w-lg max-h-[92dvh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl animate-scaleUp flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <h3 className="font-bold text-base text-white">Modifier le profil</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col min-h-0 flex-1">
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              {editError && (
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="profile-username" className="text-xs font-mono uppercase text-zinc-400">Nom d’utilisateur (@pseudo)</label>
                  <span className="text-[10px] font-mono text-zinc-500">{editUsername.length}/30</span>
                </div>
                <input
                  id="profile-username"
                  type="text"
                  value={editUsername}
                  maxLength={30}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:outline-none focus:border-zinc-500"
                />
                <p className="text-[10px] text-zinc-500">2 à 30 caractères : lettres minuscules, chiffres et _.</p>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-zinc-400">Nom d’affichage</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Bio — éditeur riche compact (gras, liens, surlignage, formules…) */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-zinc-400">Biographie</label>
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5">
                  <RichTextEditor ref={bioEditorRef} initialHTML={editBio} compact placeholder="Parlez de vous…" />
                </div>
              </div>

              {/* Interests — tags (max 5, 30 caractères chacun) */}
              <div className="space-y-1">
                <label htmlFor="profile-interests" className="text-xs font-mono uppercase text-zinc-400">Centres d’intérêt</label>
                <TagInput id="profile-interests" value={editInterests} onChange={setEditInterests} />
              </div>

              {/* Site web & localisation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400">Site web</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    maxLength={255}
                    placeholder="https://mon-site.fr"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                  <p className="text-[10px] text-zinc-500">Le https:// est ajouté automatiquement si absent.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400">Localisation</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    maxLength={100}
                    placeholder="Paris, France"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Verified Badge Info — réservé aux abonnements payants */}
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-[#1D9BF0] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white">Coche bleue</span>
                  <p className="text-[11px] text-zinc-500">
                    Disponible automatiquement avec les abonnements Plus, Pro et Max.
                  </p>
                </div>
              </div>

              {/* File-Only Uploads for Avatar and Banner */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors flex flex-col items-center justify-center gap-1.5 text-center"
                >
                  {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Camera className="w-5 h-5 text-white" />}
                  <span className="text-xs font-bold text-white">Changer photo</span>
                  <span className="text-[10px] text-zinc-500">Importer fichier image</span>
                </button>

                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors flex flex-col items-center justify-center gap-1.5 text-center"
                >
                  {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
                  <span className="text-xs font-bold text-white">Changer bannière</span>
                  <span className="text-[10px] text-zinc-500">Importer fichier image</span>
                </button>
              </div>

              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="py-2 px-5 rounded-full bg-zinc-900 text-zinc-300 text-xs font-semibold hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-6 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 disabled:opacity-40"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale abonnés / abonnements (pagination + boutons Suivre) */}
      {followersModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setFollowersModal(null)}
        >
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                {followersModal === 'followers' ? 'Abonnés' : 'Abonnements'}
              </h3>
              <button onClick={() => setFollowersModal(null)} className="text-zinc-500 hover:text-white" title="Fermer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900 rounded-2xl border border-zinc-800">
              {isLoadingFollowList && followList.length === 0 && (
                <div className="p-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-500 inline" />
                </div>
              )}
              {!isLoadingFollowList && followList.length === 0 && (
                <p className="p-6 text-center text-xs text-zinc-500">
                  {followersModal === 'followers' ? 'Aucun abonné pour le moment.' : 'Aucun abonnement pour le moment.'}
                </p>
              )}
              {followList.map((u) => (
                <div key={String(u.id)} className="flex items-center gap-2.5 px-3 py-2">
                  <ProfileAvatar
                    src={u.avatar_url}
                    fallbackName={u.username}
                    size="sm"
                    alt={u.username}
                    onClick={() => {
                      setFollowersModal(null);
                      onOpenProfile(u.username);
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => {
                        setFollowersModal(null);
                        onOpenProfile(u.username);
                      }}
                      className="block max-w-full truncate text-xs font-semibold text-white hover:underline text-left"
                    >
                      {u.display_name || u.username}
                      {u.is_verified && <VerifiedBadge isVerified={true} size="xs" />}
                    </button>
                    <p className="text-[10px] text-zinc-500 truncate">@{u.username}</p>
                  </div>
                  {String(u.id) !== String(user?.id) && (
                    <button
                      onClick={() => handleToggleFollowInList(u)}
                      disabled={followBusyIds.has(String(u.id))}
                      className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-colors disabled:opacity-40 ${
                        u.is_following ? 'bg-zinc-900 border border-zinc-700 text-zinc-300' : 'bg-white text-black'
                      }`}
                    >
                      {followBusyIds.has(String(u.id)) ? '…' : u.is_following ? 'Suivi' : 'Suivre'}
                    </button>
                  )}
                </div>
              ))}
              {followListHasMore && (
                <button
                  onClick={() => followersModal && loadFollowList(followersModal, followListOffset)}
                  disabled={isLoadingFollowList}
                  className="w-full py-2.5 text-center text-[11px] font-semibold text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  {isLoadingFollowList ? 'Chargement…' : 'Charger plus'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Share Modal (Carte HD, QR Code Amélioré, Liens) */}
      <ProfileShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        profile={profile}
        targetUsername={targetUsername}
        isVerified={isVerified}
        tier={hideVerifiedBadge ? undefined : isSelf ? user?.tier : profile?.tier}
      />

      {confirmDialog}
    </div>
  );
};
