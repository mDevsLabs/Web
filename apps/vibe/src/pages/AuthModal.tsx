/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — AUTH PORTAL (src/pages/AuthModal.tsx)
 * Minimalist Authentication: Register, Login, Email OTP & Session
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { LockIcon as Lock, MailIcon as Mail, UserIcon, KeyRoundIcon as KeyRound, AlertCircleIcon as AlertCircle, EyeIcon as Eye, EyeOffIcon as EyeOff, ArrowRightIcon as ArrowRight, Loader2Icon as Loader2 } from "@mdevs/icons";
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VibeLogo } from '../components/layout/VibeLogo';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFullScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  isFullScreen = false,
}) => {
  const { loginWithToken, isAuthenticated, isLoadingSession } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [acceptedCGU, setAcceptedCGU] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await ApiService.resendCode(email.trim(), mode);
      setNoticeMessage(`Un nouveau code de vérification a été envoyé à ${email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Erreur lors du renvoi du code.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (isAuthenticated || isLoadingSession) {
    return (
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-white font-semibold text-sm">Chargement...</p>
        <p className="text-zinc-500 text-xs mt-1">Vous êtes déjà connecté</p>
      </div>
    );
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setNoticeMessage(null);

    try {
      if (mode === 'register') {
        if (!email.trim() || !username.trim() || !password.trim()) {
          throw new Error('Tous les champs sont requis.');
        }
        if (!/^[a-z0-9_]{2,30}$/.test(username.trim())) {
          throw new Error("Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _).");
        }
        if (!acceptedCGU) {
          throw new Error("Vous devez accepter les Conditions d'utilisation pour créer un compte.");
        }
        const res: any = await ApiService.register(email.trim(), username.trim(), password);
        if (res?.token) {
          // Inscription directe (sans OTP côté serveur)
          await loginWithToken(res.token);
          if (onClose) onClose();
          return;
        }
        if (res?.status === 'verification_required') {
          setStep('otp');
          setNoticeMessage(`Un code de vérification a été envoyé à ${email}.`);
        } else {
          throw new Error(res?.error || 'Réponse inattendue du serveur.');
        }
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Identifiant et mot de passe requis.');
        }
        const res: any = await ApiService.login(email.trim(), password);
        if (res?.email) {
          setEmail(res.email);
        }
        if (res?.token) {
          // Connexion directe (sans OTP côté serveur)
          await loginWithToken(res.token);
          if (onClose) onClose();
          return;
        }
        if (res?.status === 'verification_required') {
          setStep('otp');
          setNoticeMessage('Un code de connexion a été envoyé à votre adresse e-mail.');
        } else if (res?.blocked) {
          throw new Error('Ce compte a été suspendu. Contactez le support.');
        } else {
          throw new Error(res?.error || 'Réponse inattendue du serveur.');
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Erreur lors de la requête.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Erreur de connexion réseau/CORS avec le serveur. Si vous avez déjà reçu le code par e-mail, vous pouvez le saisir directement ci-dessous.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let token = '';
      if (mode === 'register') {
        const res = await ApiService.verifyRegister(email.trim(), username.trim(), password, otpCode.trim());
        token = res.token;
      } else {
        const res = await ApiService.verifyLogin(email.trim(), otpCode.trim());
        token = res.token;
      }

      if (!token) {
        throw new Error('Code incorrect ou expiré.');
      }

      await loginWithToken(token);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Code invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp select-none">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mx-auto">
          <VibeLogo size={48} showText={false} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {mode === 'login' ? 'Connexion à Vibe' : 'Créer un compte Vibe'}
          </h2>
          <p className="text-xs text-zinc-400">Le réseau social avec intelligence artificielle mAI</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 space-y-2 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
          {step === 'credentials' && mode === 'login' && error.includes('Aucun compte') && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400">Nouveau sur Vibe ?</span>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setNoticeMessage('Renseignez vos informations pour créer votre compte.');
                }}
                className="px-2.5 py-1 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shrink-0"
              >
                Créer mon compte →
              </button>
            </div>
          )}
          {step === 'credentials' && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400">Code déjà reçu dans vos e-mails ?</span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('otp');
                  setNoticeMessage('Saisissez le code de connexion à 6 chiffres reçu par e-mail.');
                }}
                className="px-2.5 py-1 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shrink-0"
              >
                Saisir mon code →
              </button>
            </div>
          )}
        </div>
      )}

      {noticeMessage && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-center gap-2 animate-fadeIn">
          <Mail className="w-4 h-4 text-white shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Step 1: Credentials Form */}
      {step === 'credentials' ? (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">
              {mode === 'register' ? 'Adresse E-mail' : 'E-mail ou Nom d’utilisateur'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={mode === 'register' ? 'email' : 'text'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'register' ? 'nom@exemple.com' : 'Votre nom ou email'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Nom d’utilisateur</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  maxLength={30}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="nom_utilisateur"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                  required
                />
              </div>
              <p className="text-[10px] text-zinc-500">2 à 30 caractères : lettres minuscules, chiffres et _.</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Mot de passe</label>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('otp');
                  setNoticeMessage('Saisissez le code de connexion reçu par e-mail.');
                }}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors"
              >
                J'ai déjà reçu un code →
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedCGU}
                onChange={(e) => setAcceptedCGU(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-white shrink-0 cursor-pointer"
                required
              />
              <span>
                J'accepte les{' '}
                <a
                  href="https://mai-devs.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-zinc-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  conditions et politique de confidentialité
                </a>
                .
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={isLoading || (mode === 'register' && !acceptedCGU)}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'login' ? 'Connexion…' : 'Création du compte…'}</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Continuer' : 'S’inscrire'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setNoticeMessage(null);
                setAcceptedCGU(false);
              }}
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors"
            >
              {mode === 'login'
                ? 'Pas encore de compte ? S’inscrire'
                : 'Déjà inscrit ? Se connecter'}
            </button>
          </div>
        </form>
      ) : (
        /* Step 2: OTP Verification */
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Adresse e-mail du compte</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="votre@email.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500">L'e-mail auquel le code a été expédié.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Code de vérification (6 chiffres)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                placeholder="123456"
                maxLength={6}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-base text-white text-center tracking-widest font-mono font-bold focus:outline-none focus:border-zinc-500"
                required
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-400">Code non reçu ou expiré ?</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isLoading || !email.trim()}
                className="text-zinc-200 hover:text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otpCode.length < 4 || !email.trim()}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validation et ouverture de la session…</span>
              </span>
            ) : (
              <span>Valider le code & Entrer</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setOtpCode('');
                setError(null);
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              ← Retour à l'étape précédente
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="w-full flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {content}
    </div>
  );
};
