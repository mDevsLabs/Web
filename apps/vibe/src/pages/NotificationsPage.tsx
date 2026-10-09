/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — NOTIFICATIONS PAGE (src/pages/NotificationsPage.tsx)
 * Real-time notification center: dedicated Likes tab, post navigation & unread states
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon as Bell, BellOffIcon as BellOff, HeartIcon as Heart, RepeatIcon as Repeat, MessageSquareIcon as MessageSquare, SparklesIcon as Sparkles, UserPlusIcon as UserPlus, QuoteIcon, FileTextIcon as FileText, CheckIcon as Check, Loader2Icon as Loader2, AlertCircleIcon as AlertCircle, MailIcon as Mail, Trash2Icon as Trash2, CheckCheckIcon as CheckCheck, RotateCcwIcon as RotateCcw } from "@mdevs/icons";
import { NotificationItem } from '../types/vibe';
import { ApiService } from '../services/api';
import { NotificationService } from '../services/notificationService';
import { haptics } from '../services/haptics';
import { AppStorage } from '../services/storageAdapter';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { useConfirmDialog } from '../components/common/ConfirmDialog';

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

// Clés de persistance locale pour empêcher toute réapparition après suppression ou modification
const STORAGE_KEY_DELETED = 'vibe_deleted_notifications';
const STORAGE_KEY_CLEARED_AT = 'vibe_notifications_cleared_at';
const STORAGE_KEY_READ_OVERRIDES = 'vibe_notifications_read_overrides';
const STORAGE_KEY_READ_ALL_AT = 'vibe_notifications_read_all_at';

function getDeletedIds(): Set<string> {
  const list = AppStorage.getJSON<string[]>(STORAGE_KEY_DELETED, []);
  return new Set(Array.isArray(list) ? list : []);
}

function saveDeletedId(id: string) {
  const current = getDeletedIds();
  current.add(String(id));
  AppStorage.setJSON(STORAGE_KEY_DELETED, Array.from(current).slice(-500));
}

function getClearedAt(): number {
  const val = AppStorage.getItem(STORAGE_KEY_CLEARED_AT);
  return val ? parseInt(val, 10) || 0 : 0;
}

function saveClearedAt(timestamp: number) {
  AppStorage.setItem(STORAGE_KEY_CLEARED_AT, String(timestamp));
}

function getReadOverrides(): Record<string, boolean> {
  return AppStorage.getJSON<Record<string, boolean>>(STORAGE_KEY_READ_OVERRIDES, {}) || {};
}

function saveReadOverride(id: string, isRead: boolean) {
  const current = getReadOverrides();
  current[String(id)] = isRead;
  AppStorage.setJSON(STORAGE_KEY_READ_OVERRIDES, current);
}

function getReadAllAt(): number {
  const val = AppStorage.getItem(STORAGE_KEY_READ_ALL_AT);
  return val ? parseInt(val, 10) || 0 : 0;
}

function saveReadAllAt(timestamp: number) {
  AppStorage.setItem(STORAGE_KEY_READ_ALL_AT, String(timestamp));
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'messages' | 'likes' | 'mentions' | 'verified'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<PermissionState>(() => {
    const state = NotificationService.getPermissionState();
    return state === 'unsupported' ? 'unsupported' : (state as PermissionState);
  });
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  // Filtrage client de secours : comptes masqués/bloqués (le serveur filtre
  // déjà, ce set protège contre un backend pas encore à jour)
  const [hiddenUsernames, setHiddenUsernames] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      ApiService.getMutedUsers().catch(() => ({ muted: [] })),
      ApiService.getBlockedUsers().catch(() => ({ blocked: [] })),
    ]).then(([mutedRes, blockedRes]) => {
      const names = new Set<string>();
      for (const m of mutedRes?.muted || []) {
        if ((m as any).muted_username) names.add(String((m as any).muted_username).toLowerCase());
      }
      for (const b of blockedRes?.blocked || []) {
        if (b.blocked_username) names.add(String(b.blocked_username).toLowerCase());
      }
      setHiddenUsernames(names);
    });
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await ApiService.getNotifications();
      const rawList: NotificationItem[] = Array.isArray(data?.notifications) ? data.notifications : [];

      const deletedIds = getDeletedIds();
      const clearedAt = getClearedAt();
      const readOverrides = getReadOverrides();
      const readAllAt = getReadAllAt();

      const filtered = rawList
        .filter((n) => {
          if (!n || !n.id) return false;
          if (deletedIds.has(String(n.id))) return false;
          if (clearedAt > 0 && new Date(n.created_at).getTime() <= clearedAt) return false;
          return true;
        })
        .map((n) => {
          const override = readOverrides[String(n.id)];
          if (override !== undefined) {
            return { ...n, is_read: override };
          }
          if (readAllAt > 0 && new Date(n.created_at).getTime() <= readAllAt) {
            return { ...n, is_read: true };
          }
          return n;
        });

      setNotifications(filtered);
    } catch {
      // Préserver l'état en cas de micro-coupure réseau
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Temps réel via SSE : chaque notification est poussée par le serveur et
    // rediffusée en 'vibe:notification_received' (realtimeService).
    // L'intervalle ne sert que de filet de sécurité léger.
    const interval = setInterval(fetchNotifications, 60000);
    const handleNotif = () => fetchNotifications();
    window.addEventListener('vibe:notification_received', handleNotif);
    window.addEventListener('vibe:feed_refresh', handleNotif);
    window.addEventListener('focus', handleNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener('vibe:notification_received', handleNotif);
      window.removeEventListener('vibe:feed_refresh', handleNotif);
      window.removeEventListener('focus', handleNotif);
    };
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true);
    try {
      const result = await NotificationService.requestPermission();
      setPermission(result as PermissionState);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    haptics.success();
    saveReadAllAt(Date.now());
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    window.dispatchEvent(new CustomEvent('vibe:realtime_unread', { detail: { unread_notifications: 0 } }));
    NotificationService.showInAppToast('Notifications lues', 'Toutes les notifications sont marquées comme lues.', 'info');
    try {
      await ApiService.markNotificationsRead();
    } catch (err) {
      console.warn('[Notifications] Error markAllRead:', err);
    }
  };

  const handleToggleRead = async (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation();
    haptics.light();
    const newStatus = !notif.is_read;
    saveReadOverride(notif.id, newStatus);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: newStatus } : n))
    );
    try {
      await ApiService.markNotificationRead(notif.id, newStatus);
    } catch (err) {
      console.warn('[Notifications] Error markNotificationRead:', err);
    }
  };

  const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptics.medium();
    saveDeletedId(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    NotificationService.showInAppToast('Notification supprimée', 'La notification a bien été effacée.', 'info');
    try {
      await ApiService.deleteNotification(id);
    } catch (err) {
      console.warn('[Notifications] Error deleteNotification:', err);
    }
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: 'Supprimer toutes les notifications ?',
      message: 'Votre liste de notifications sera vidée.',
      confirmLabel: 'Tout supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    haptics.medium();
    saveClearedAt(Date.now());
    notifications.forEach((n) => saveDeletedId(n.id));
    setNotifications([]);
    window.dispatchEvent(new CustomEvent('vibe:realtime_unread', { detail: { unread_notifications: 0 } }));
    NotificationService.showInAppToast('Notifications effacées', 'Toutes les notifications ont été supprimées.', 'info');
    try {
      await ApiService.clearAllNotifications();
    } catch (err) {
      console.warn('[Notifications] Error clearAllNotifications:', err);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.is_read) {
      saveReadOverride(notif.id, true);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      ApiService.markNotificationRead(notif.id, true).catch(() => {});
    }
    if (notif.type === 'dm') {
      navigate('/messages');
    } else if (notif.post_id) {
      navigate(`/post/${notif.post_id}`);
    } else if (notif.actor_username) {
      navigate(`/@${notif.actor_username}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'dm':
        return <Mail className="w-4 h-4 text-white" />;
      case 'like':
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'repost':
        return <Repeat className="w-4 h-4 text-emerald-400" />;
      case 'quote':
        return <QuoteIcon className="w-4 h-4 text-emerald-400" />;
      case 'reply':
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'follow':
      case 'follow_request':
      case 'follow_accept':
        return <UserPlus className="w-4 h-4 text-violet-400" />;
      case 'ai_digest':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'post':
        return <FileText className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    // Secours client : aucun contenu d'un compte masqué ou bloqué
    if (n.actor_username && hiddenUsernames.has(String(n.actor_username).toLowerCase())) return false;
    // Messages privés
    if (filter === 'messages') return n.type === 'dm';
    // Mentions = uniquement les citations et réponses directes (+ mentions @)
    if (filter === 'mentions') return n.type === 'quote' || n.type === 'reply' || n.type === 'mention';
    if (filter === 'likes') return n.type === 'like' || n.type === 'reaction';
    // Comptes vérifiés : filtre anti-spam ne montrant que les comptes certifiés
    if (filter === 'verified') return Boolean((n as any).actor_verified);
    return true;
  });

  // Regroupement par jour (Aujourd'hui / Hier / date)
  const grouped = useMemo(() => {
    const groups: { label: string; items: NotificationItem[] }[] = [];
    const now = new Date();
    const today = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    for (const n of filteredNotifications) {
      const d = new Date(n.created_at).toDateString();
      const label = d === today ? "Aujourd'hui" : d === yesterday ? 'Hier' : new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(n);
      else groups.push({ label, items: [n] });
    }
    return groups;
  }, [filteredNotifications]);

  const likesCount = notifications.filter((n) => n.type === 'like' || n.type === 'reaction').length;
  const messagesCount = notifications.filter((n) => n.type === 'dm').length;

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8 select-none">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-xs text-zinc-500">Activités, mentions et mentions J'aime</p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tout marquer lu</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              title="Supprimer toutes les notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tout effacer</span>
            </button>
          )}
        </div>
      </header>

      {/* Bandeau d'activation des notifications appareil */}
      {permission !== 'granted' && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          {permission === 'denied' ? (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <BellOff className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold text-white">
              {permission === 'denied'
                ? 'Notifications bloquées sur cet appareil'
                : permission === 'unsupported'
                ? 'Notifications non supportées sur cet appareil'
                : 'Activez les notifications Vibe'}
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              {permission === 'denied'
                ? 'Pour les réactiver, autorisez les notifications pour ce site dans les réglages de votre navigateur.'
                : permission === 'unsupported'
                ? 'Votre navigateur ne prend pas encore en charge les notifications système.'
                : 'Recevez les likes, réponses, abonnements et messages en direct sur votre appareil.'}
            </p>
            {(permission === 'default' || permission === 'denied') && (
              <button
                onClick={handleEnableNotifications}
                disabled={isRequestingPermission || permission === 'denied'}
                className="mt-1 py-2 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {isRequestingPermission && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {permission === 'denied'
                    ? 'Bloqué — modifiez les réglages navigateur'
                    : isRequestingPermission
                    ? 'Demande en cours…'
                    : 'Autoriser les notifications'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs : Toutes / Messages / Mentions / J'aime / Comptes vérifiés */}
      <div className="flex border-b border-zinc-800 bg-zinc-950 mt-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'messages', label: messagesCount > 0 ? `Messages (${messagesCount})` : 'Messages' },
          { id: 'mentions', label: 'Mentions' },
          { id: 'likes', label: likesCount > 0 ? `J'aime (${likesCount})` : "J'aime" },
          { id: 'verified', label: 'Vérifiés' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              haptics.light();
              setFilter(t.id as any);
            }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider relative transition-colors ${
              filter === t.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{t.label}</span>
            {filter === t.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Notification Stream, groupée par jour */}
      {isLoading && (
        <div className="p-16 text-center text-zinc-400 text-sm flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span>Chargement…</span>
        </div>
      )}

      {!isLoading && (
        <>
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-950/80 sticky top-[60px] backdrop-blur-md">
                {group.label}
              </div>
              <div className="divide-y divide-zinc-900">
                {group.items.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 flex gap-3.5 items-start hover:bg-zinc-950 transition-colors cursor-pointer ${
                      !notif.is_read ? 'bg-zinc-950/60 border-l-2 border-rose-500' : ''
                    }`}
                  >
                    <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          onClick={(e) => {
                            if (notif.actor_username) {
                              e.stopPropagation();
                              navigate(`/@${notif.actor_username}`);
                            }
                          }}
                        >
                          <ProfileAvatar
                            src={notif.actor_avatar_url}
                            alt={notif.actor_username || 'user'}
                            fallbackName={notif.actor_username}
                            size="xs"
                            className="border border-zinc-800"
                          />
                        </div>
                        {notif.actor_username && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/@${notif.actor_username}`);
                            }}
                            className="text-xs font-bold text-white hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>@{notif.actor_username}</span>
                            <VerifiedBadge isVerified={Boolean((notif as any).actor_verified)} size="xs" />
                          </span>
                        )}
                        <span className="text-xs text-zinc-300">{notif.message}</span>
                      </div>

                      <span className="text-[11px] text-zinc-600 block font-mono">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Actions individuelles (Marquer comme lu / non lu + Supprimer) */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        onClick={(e) => handleToggleRead(e, notif)}
                        className={`p-1.5 rounded-full transition-colors ${
                          notif.is_read
                            ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                        title={notif.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      >
                        {notif.is_read ? (
                          <RotateCcw className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDeleteOne(e, notif.id)}
                        className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                        title="Supprimer cette notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {!notif.is_read && <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="p-16 text-center text-zinc-500 text-xs space-y-2">
              {filter === 'messages' ? (
                <Mail className="w-6 h-6 mx-auto text-zinc-600" />
              ) : (
                <Bell className="w-6 h-6 mx-auto text-zinc-600" />
              )}
              <p className="font-semibold text-zinc-400">
                {filter === 'messages'
                  ? 'Aucune notification de message pour le moment'
                  : filter === 'likes'
                  ? "Aucune mention J'aime pour le moment"
                  : filter === 'mentions'
                  ? 'Aucune mention pour le moment'
                  : filter === 'verified'
                  ? 'Aucune notification de comptes vérifiés'
                  : 'Aucune notification pour le moment'}
              </p>
              <p className="text-[11px] text-zinc-600">
                {filter === 'messages'
                  ? 'Vos notifications de messages privés apparaîtront ici dès réception.'
                  : 'Vos likes, repartages et mentions apparaîtront ici dès leur réception.'}
              </p>
            </div>
          )}
        </>
      )}

      {confirmDialog}
    </div>
  );
};
export default NotificationsPage;
