/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — NOTIFICATION SERVICE (src/services/notificationService.ts)
 * Browser & Device Web Notifications + In-App Toasts for Post & DM events
 * ============================================================================
 */

export interface InAppToast {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'error';
  timestamp: number;
}

export class NotificationService {
  /**
   * État actuel de la permission de notification sur l'appareil
   */
  public static getPermissionState(): 'unsupported' | NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Demande poliment la permission d'envoyer des notifications sur l'appareil / navigateur
   */
  public static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        if (result === 'granted' && 'serviceWorker' in navigator) {
          // Préparer le service worker pour les notifications même app en arrière-plan
          try {
            const reg = await navigator.serviceWorker.ready;
            await (reg as any).showNotification?.('Vibe 🔔', {
              body: 'Les notifications sont maintenant activées !',
              icon: '/logo.png',
            });
          } catch {}
        }
        return result;
      } catch {
        return 'denied';
      }
    }

    return Notification.permission;
  }

  /**
   * Envoie une notification système sur l'appareil / navigateur si accordée
   * (passe par le service worker si disponible pour un fonctionnement en arrière-plan)
   */
  public static async sendDeviceNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            icon: '/logo.png',
            badge: '/favicon.png',
            ...options,
          });
          return;
        }
      }
    } catch {}

    try {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/favicon.png',
        ...options,
      });
    } catch (err) {
      console.warn('[NotificationService] Device notification failed:', err);
    }
  }

  /**
   * Déclenche une notification in-app (Toast visible dans l'application)
   */
  public static showInAppToast(title: string, message: string, type: 'success' | 'info' | 'error' = 'success') {
    if (typeof window === 'undefined') return;

    const toast: InAppToast = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      timestamp: Date.now(),
    };

    window.dispatchEvent(new CustomEvent('vibe:in_app_toast', { detail: toast }));
  }

  /**
   * Déclenche à la fois la notification sur l'appareil/navigateur ET dans l'application
   * lors de la publication d'un post
   */
  public static notifyPostPublished(contentPreview?: string) {
    const title = 'Vibe — Publication publiée ! 🚀';
    const body = contentPreview && contentPreview.length > 0
      ? contentPreview.slice(0, 120) + (contentPreview.length > 120 ? '...' : '')
      : 'Votre publication est maintenant en ligne sur Vibe.';

    // 1. Notification système de l'appareil / navigateur
    this.sendDeviceNotification(title, {
      body,
      tag: 'vibe-post-published',
    });

    // 2. Notification / Toast in-app
    this.showInAppToast('Publication en ligne ! 🚀', body, 'success');
  }

  /**
   * Notifie la suppression d'un post
   */
  public static notifyPostDeleted() {
    this.showInAppToast('Publication supprimée 🗑️', 'Le post a été retiré avec succès.', 'info');
  }
}
