/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — REALTIME CLIENT (src/services/realtimeService.ts)
 * Connexion Server-Sent Events unique pour toute l'app : notifications,
 * messages privés, indicateur de frappe et compteurs de posts en direct.
 *
 * Les événements serveur sont rediffusés de deux façons découplées :
 *  - window CustomEvent 'vibe:realtime' (detail: { type, payload }) — générique
 *  - window CustomEvent 'vibe:realtime_unread' (badges) et
 *    'vibe:notification_received' (compat avec l'existant), ou via on(handler)
 * ============================================================================
 */
import { API_BASE } from './api';

export type RealtimeHandler = (type: string, payload: any) => void;

const EVENT_TYPES = ['connected', 'unread_counts', 'notification', 'dm_message', 'dm_typing', 'post_stats', 'dm_pin_updated', 'dm_message_edited', 'dm_message_deleted', 'group_updated'];
const MAX_RECONNECT_DELAY = 30_000;

class RealtimeClient {
  private es: EventSource | null = null;
  private handlers = new Set<RealtimeHandler>();
  private reconnectDelay = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentToken: string | null = null;
  private manuallyStopped = false;

  /** Ouvre (ou réutilise) la connexion SSE pour ce token JWT. Idempotent. */
  start(token: string) {
    if (!token || typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.es && this.currentToken === token) return;
    if (this.es || this.reconnectTimer) this.stop();
    this.currentToken = token;
    this.manuallyStopped = false;
    this.reconnectDelay = 1_000;
    this.connect();
  }

  /** Ferme la connexion (déconnexion de l'utilisateur). */
  stop() {
    this.manuallyStopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.es) {
      this.es.close();
      this.es = null;
    }
    this.currentToken = null;
    this.reconnectDelay = 1_000;
  }

  /**
   * Reset complet de l'état de connexion sans désabonner les composants
   * montés. Utile au logout puis à une nouvelle session.
   * TEST: logout pendant un retry => aucun timer ne se reconnecte avec l'ancien JWT.
   */
  reset() {
    this.stop();
    this.reconnectDelay = 1_000;
  }

  /** Abonnement programmatique — renvoie une fonction de désabonnement. */
  on(handler: RealtimeHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  get isConnected(): boolean {
    return this.es !== null;
  }

  private connect() {
    if (this.es || !this.currentToken) return;
    try {
      // EventSource ne peut pas définir d'en-têtes : JWT en query (?token=)
      const url = `${API_BASE}/v1/realtime/stream?token=${encodeURIComponent(this.currentToken)}`;
      const es = new EventSource(url);
      this.es = es;

      for (const type of EVENT_TYPES) {
        es.addEventListener(type, (e: MessageEvent) => {
          this.reconnectDelay = 1_000;
          let payload: any = e.data;
          try {
            payload = JSON.parse(e.data);
          } catch {}
          this.dispatch(type, payload);
        });
      }

      es.onerror = () => {
        es.close();
        this.es = null;
        if (this.manuallyStopped) return;
        // Reconnexion exponentielle (le backoff natif d'EventSource ne suffit
        // pas quand le serveur renvoie 401/429 en JSON sur le flux)
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
      };
    } catch {
      if (this.manuallyStopped) return;
      this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }
  }

  private dispatch(type: string, payload: any) {
    if (type === 'ping' || type === 'connected') return;
    // Compatibilité avec l'existant : badges + notifications
    if (type === 'unread_counts') {
      window.dispatchEvent(new CustomEvent('vibe:realtime_unread', { detail: payload }));
    } else if (type === 'notification') {
      window.dispatchEvent(new CustomEvent('vibe:notification_received', { detail: payload }));
    }
    window.dispatchEvent(new CustomEvent('vibe:realtime', { detail: { type, payload } }));
    this.handlers.forEach((h) => {
      try {
        h(type, payload);
      } catch {}
    });
  }
}

export const RealtimeService = new RealtimeClient();
