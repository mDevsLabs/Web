/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — PROFILE SHARE MODAL (src/components/profile/ProfileShareModal.tsx)
 * Carte de partage du profil (1080×1350), épurée : nom + coche bleue, @pseudo
 * et QR Code avec logo intégré. Téléchargement PNG, partage natif et copie du
 * lien.
 * ============================================================================
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { XIcon as X, CopyIcon as Copy, CheckIcon as Check, DownloadIcon as Download, Loader2Icon as Loader2, AlertCircleIcon as AlertCircle, Share2Icon as Share2 } from "@mdevs/icons";
import type { Profile } from '../../types/vibe';
import { haptics } from '../../services/haptics';

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  targetUsername: string;
  isVerified?: boolean;
  tier?: string | null;
}

const CARD_W = 1080;
const CARD_H = 1350;
const QR_BADGE_SIZE = 340;
const QR_SIZE = 280;
const FONT_STACK = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function loadImage(src: string | null | undefined, crossOrigin = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 6000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img.naturalWidth > 0 ? img : null);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

export const ProfileShareModal: React.FC<ProfileShareModalProps> = ({
  isOpen,
  onClose,
  profile,
  targetUsername,
  isVerified = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cleanUsername = targetUsername.replace(/^@/, '');
  const displayName = profile?.displayName || cleanUsername;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mai-vibe.vercel.app';
  const profileUrl = `${origin}/@${cleanUsername}`;

  /**
   * Compose la carte de partage (1080×1350) sur canvas, épurée : nom
   * (+ coche bleue dessinée), @pseudo et QR Code avec logo intégré.
   */
  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    setIsGenerating(true);
    setError(null);
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponible');
      canvas.width = CARD_W;
      canvas.height = CARD_H;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // 1. Identité : nom (avec coche bleue), @pseudo
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const nameY = 430;
      ctx.font = `800 64px ${FONT_STACK}`;
      ctx.fillStyle = '#fafafa';
      const nameMaxWidth = CARD_W - 260;
      const nameWidth = Math.min(ctx.measureText(displayName).width, nameMaxWidth);
      ctx.fillText(displayName, CARD_W / 2, nameY, nameMaxWidth);

      if (isVerified) {
        const checkR = 28;
        const checkX = Math.min(CARD_W / 2 + nameWidth / 2 + checkR + 16, CARD_W - 84);
        const checkY = nameY - 21;
        ctx.beginPath();
        ctx.arc(checkX, checkY, checkR, 0, Math.PI * 2);
        ctx.fillStyle = '#1D9BF0';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(checkX - 13, checkY);
        ctx.lineTo(checkX - 3, checkY + 11);
        ctx.lineTo(checkX + 14, checkY - 11);
        ctx.stroke();
      }

      ctx.font = `500 40px ${FONT_STACK}`;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`@${cleanUsername}`, CARD_W / 2, nameY + 74);

      // 2. QR Code sur pastille blanche avec logo intégré
      const qrBadgeX = (CARD_W - QR_BADGE_SIZE) / 2;
      const qrBadgeY = 620;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrBadgeX, qrBadgeY, QR_BADGE_SIZE, QR_BADGE_SIZE, 40);
      ctx.fill();

      const qr = QRCode.create(profileUrl, { errorCorrectionLevel: 'H' });
      const qrSize = qr.modules.size;
      const qrData = qr.modules.data;
      const quietZone = 2;
      const totalCells = qrSize + quietZone * 2;
      const cell = QR_SIZE / totalCells;
      const qrOrigin = qrBadgeX + (QR_BADGE_SIZE - QR_SIZE) / 2;

      ctx.fillStyle = '#000000';
      for (let row = 0; row < qrSize; row++) {
        for (let col = 0; col < qrSize; col++) {
          if (qrData[row * qrSize + col]) {
            ctx.fillRect(
              qrOrigin + (col + quietZone) * cell,
              qrBadgeY + (QR_BADGE_SIZE - QR_SIZE) / 2 + (row + quietZone) * cell,
              Math.ceil(cell),
              Math.ceil(cell)
            );
          }
        }
      }

      // Logo au centre du QR, sur une pastille blanche arrondie (correction H)
      const logo = await loadImage('/logo.png');
      if (logo) {
        const logoSize = QR_SIZE * 0.24;
        const qrCenterY = qrBadgeY + QR_BADGE_SIZE / 2;
        const lx = CARD_W / 2 - logoSize / 2;
        const ly = qrCenterY - logoSize / 2;
        const pad = logoSize * 0.12;
        const badgeSize = logoSize + pad * 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(lx - pad, ly - pad, badgeSize, badgeSize, badgeSize * 0.22);
        ctx.fill();
        ctx.drawImage(logo, lx, ly, logoSize, logoSize);
      }

      setIsGenerating(false);
    } catch (err: any) {
      console.warn('[ProfileShare] Erreur génération carte:', err);
      setError('Impossible de générer la carte de partage.');
      setIsGenerating(false);
    }
  }, [isOpen, displayName, cleanUsername, profileUrl, isVerified]);

  useEffect(() => {
    if (isOpen) {
      setIsCopied((prev) => (prev ? false : prev));
      void drawCard();
    }
  }, [isOpen, drawCard]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      haptics.success();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      // Fallback pour contextes sans Clipboard API
      const input = document.createElement('input');
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2200);
      } catch {}
      document.body.removeChild(input);
    }
  };

  const handleDownloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas || isGenerating) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-profil-${cleanUsername}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        haptics.success();
      }, 'image/png');
    } catch (err) {
      console.warn('[ProfileShare] Erreur téléchargement carte:', err);
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isGenerating) return;
    const nav = navigator as any;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = blob ? new File([blob], `vibe-profil-${cleanUsername}.png`, { type: 'image/png' }) : null;
      if (file && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `Profil de @${cleanUsername} sur Vibe`,
          text: `Découvre le profil de @${cleanUsername} sur Vibe`,
        });
        haptics.success();
        return;
      }
      if (nav.share) {
        await nav.share({
          title: `@${cleanUsername} sur Vibe`,
          text: `Découvre le profil de @${cleanUsername} sur Vibe`,
          url: profileUrl,
        });
        haptics.success();
        return;
      }
      await handleCopyLink();
    } catch {
      // Partage annulé par l'utilisateur : silencieux
    }
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn h-dvh"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-black/60">
          <span className="text-xs font-bold text-black dark:text-white uppercase font-mono tracking-wider">
            Partager le profil
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-black dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* Corps : carte de partage + actions */}
        <div className="p-5 flex flex-col items-center space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <canvas
              ref={canvasRef}
              className="block w-full max-w-[280px] aspect-[4/5]"
              aria-label={`Carte de partage du profil @${cleanUsername}`}
            />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>

          {error && (
            <div className="w-full p-2.5 rounded-xl bg-zinc-100 border border-zinc-300 text-[11px] text-black flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full space-y-2">
            <button
              onClick={handleDownloadCard}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-white border border-zinc-300 text-black font-bold text-sm hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-black" />
              <span className="text-black">Télécharger l'image</span>
            </button>

            {canShare && (
              <button
                onClick={handleShare}
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-black text-white dark:bg-zinc-900 dark:border dark:border-zinc-700 font-bold text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-2xl bg-zinc-100 border border-zinc-300 text-black font-semibold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              {isCopied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
              <span className="text-black">{isCopied ? 'Lien copié !' : 'Copier le lien'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
