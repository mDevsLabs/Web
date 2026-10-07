import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { useI18n } from "./i18n";
import {
  IconAlertTriangle,
  IconCalendar,
  IconCheckCircle,
  IconClock,
  IconCloseSmall,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLogOut,
  IconMail,
  IconRefresh,
  IconUser,
} from "./icons";
import type { MaiAccountState } from "./ipcTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  shell: NonNullable<Window["maiShell"]> | undefined;
  account: MaiAccountState | undefined;
  onAccountChange: (account: MaiAccountState) => void;
};

export function MaiAccountModal({
  open,
  onClose,
  shell,
  account,
  onAccountChange,
}: Props) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "otp">("form");

  // Form inputs
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLoggedIn = Boolean(account?.jwtToken);

  const TERMS_URL = "https://mai-devs.vercel.app";

  const handleOpenTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shell) {
      void shell.invoke("shell:openExternalUrl", TERMS_URL).catch(() => {});
    } else {
      window.open(TERMS_URL, "_blank", "noopener,noreferrer");
    }
  };

  const resetForm = useCallback(() => {
    setIdentifier("");
    setEmail("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setOtpCode("");
    setAcceptedTerms(true);
    setError(null);
    setSuccessMsg(null);
    setStep("form");
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
      if (isLoggedIn && shell) {
        // Refresh profile & usage on open
        void shell.invoke("mai:refreshUsage").then((res: any) => {
          if (res?.ok && res?.account) {
            onAccountChange(res.account);
          }
        });
      }
    }
  }, [open, isLoggedIn, shell, onAccountChange, resetForm]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(
        t("mai.termsRequired") ||
          "Veuillez accepter les conditions d'utilisation pour vous connecter."
      );
      return;
    }
    if (!shell) return;
    setError(null);
    setLoading(true);
    try {
      const res = (await shell.invoke("mai:login", {
        identifier,
        password,
      })) as any;
      if (res.ok) {
        setEmail(res.email || identifier);
        setStep("otp");
        setSuccessMsg(
          t("mai.needVerification") ||
            "Un code de confirmation a été envoyé par email."
        );
      } else {
        setError(res.message || "Erreur lors de la connexion.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(
        t("mai.termsRequired") ||
          "Veuillez accepter les conditions d'utilisation pour créer un compte."
      );
      return;
    }
    if (!shell) return;
    setError(null);
    setLoading(true);
    try {
      const res = (await shell.invoke("mai:register", {
        email,
        password,
        username,
      })) as any;
      if (res.ok) {
        setStep("otp");
        setSuccessMsg(
          t("mai.needVerification") ||
            "Un code de confirmation a été envoyé par email."
        );
      } else {
        setError(res.message || "Erreur lors de l'inscription.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shell) return;
    setError(null);
    setLoading(true);
    try {
      let res: any;
      if (activeTab === "login") {
        res = await shell.invoke("mai:verifyLogin", {
          code: otpCode.trim(),
          email,
        });
      } else {
        res = await shell.invoke("mai:verifyRegister", {
          code: otpCode.trim(),
          email,
          password,
          username,
        });
      }

      if (res.ok) {
        if (res.account) {
          onAccountChange(res.account);
        }
        setSuccessMsg(
          activeTab === "login"
            ? t("mai.loginSuccess") || "Connexion réussie !"
            : t("mai.registerSuccess") || "Compte créé avec succès !"
        );
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setError(res.message || "Code de vérification invalide.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de validation.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!shell || !email) return;
    setError(null);
    setLoading(true);
    try {
      const res = (await shell.invoke("mai:resendCode", {
        action: activeTab,
        email,
      })) as any;
      if (res.ok) {
        setSuccessMsg("Nouveau code envoyé avec succès !");
      } else {
        setError(res.message || "Impossible de renvoyer le code.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!shell) return;
    const next = (await shell.invoke("mai:logout")) as any;
    onAccountChange(next ?? {});
    resetForm();
  };

  const handleRefreshUsage = async () => {
    if (!shell) return;
    setLoading(true);
    try {
      const res = (await shell.invoke("mai:refreshUsage")) as any;
      if (res?.ok && res?.account) {
        onAccountChange(res.account);
        setSuccessMsg("Données d'usage actualisées !");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const user = account?.user;
  const usage = account?.usage;
  const tokensUsed = usage?.tokensUsed ?? 0;
  const limit = usage?.limit ?? 5_000_000;
  const remainingTokens = Math.max(0, limit - tokensUsed);
  const usagePercent = Math.min(
    100,
    Math.round((tokensUsed / (limit || 1)) * 100)
  );
  const usageFillModifier =
    usagePercent > 90
      ? " ref-mai-progress-fill--danger"
      : usagePercent > 70
        ? " ref-mai-progress-fill--warn"
        : "";

  const formattedTokens = new Intl.NumberFormat("fr-FR").format(tokensUsed);
  const formattedLimit = new Intl.NumberFormat("fr-FR").format(limit);
  const formattedRemaining = new Intl.NumberFormat("fr-FR").format(
    remainingTokens
  );

  const resetDateStr = usage?.resetAt
    ? new Date(usage.resetAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "long",
        weekday: "long",
      })
    : undefined;

  return (
    <div className="ref-mai-backdrop" onClick={onClose}>
      <div
        aria-label={
          isLoggedIn ? "Compte mAI Coder" : "Authentification mAI Coder"
        }
        aria-modal="true"
        className="ref-mai-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Modal Header */}
        <div className="ref-mai-head">
          <div className="ref-mai-head-brand">
            <BrandLogo aria-label="mAI Coder" size={32} />
            <div>
              <div className="ref-mai-head-title">
                {isLoggedIn ? "Compte mAI Coder" : "Authentification mAI Coder"}
              </div>
              <div className="ref-mai-head-sub">
                {isLoggedIn
                  ? "Gérez vos crédits et votre abonnement"
                  : "Connectez-vous pour débloquer la puissance des agents"}
              </div>
            </div>
          </div>
          <button
            aria-label={t("common.close") || "Fermer"}
            className="ref-mai-close"
            onClick={onClose}
            title={t("common.close") || "Fermer"}
            type="button"
          >
            <IconCloseSmall />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ref-mai-body">
          {error ? (
            <div className="ref-mai-alert ref-mai-alert--error" role="alert">
              <span aria-hidden className="ref-mai-alert-icon">
                <IconAlertTriangle />
              </span>
              <span>{error}</span>
            </div>
          ) : null}

          {successMsg ? (
            <div className="ref-mai-alert ref-mai-alert--success" role="status">
              <span aria-hidden className="ref-mai-alert-icon">
                <IconCheckCircle />
              </span>
              <span>{successMsg}</span>
            </div>
          ) : null}

          {isLoggedIn ? (
            /* Profile View */
            <div>
              {/* User Profile Card */}
              <div className="ref-mai-profile">
                {user?.avatarUrl ? (
                  <img
                    alt={user.username || "Avatar"}
                    className="ref-mai-avatar"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div aria-hidden className="ref-mai-avatar-fallback">
                    {(user?.username || user?.email || "M")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="ref-mai-profile-meta">
                  <div className="ref-mai-username">
                    <span className="ref-mai-username-name">
                      {user?.username || "Utilisateur mAI"}
                    </span>
                    <span className="ref-mai-tier">{user?.tier || "Free"}</span>
                  </div>
                  <div className="ref-mai-email">
                    {user?.email || "compte@mai.val.run"}
                  </div>
                </div>
              </div>

              {/* Detailed Usage progress card */}
              <div className="ref-mai-usage">
                <div className="ref-mai-usage-head">
                  <div>
                    <div className="ref-mai-usage-title">
                      {t("mai.usage") || "Consommation de tokens"}
                    </div>
                    <div className="ref-mai-usage-sub">
                      {formattedRemaining} tokens restants
                    </div>
                  </div>
                  <div className="ref-mai-usage-badge">{usagePercent}%</div>
                </div>

                {/* Progress Bar */}
                <div className="ref-mai-progress">
                  <div
                    className={`ref-mai-progress-fill${usageFillModifier}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                <div className="ref-mai-usage-foot">
                  <span>
                    <strong>{formattedTokens}</strong> / {formattedLimit} tokens
                  </span>
                  {resetDateStr ? (
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: 4,
                      }}
                    >
                      <IconCalendar /> Reset : {resetDateStr}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="ref-mai-btn-row">
                <button
                  className="ref-mai-ghost"
                  disabled={loading}
                  onClick={handleRefreshUsage}
                  type="button"
                >
                  {loading ? (
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: 6,
                      }}
                    >
                      <IconClock /> Actualisation…
                    </span>
                  ) : (
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: 6,
                      }}
                    >
                      <IconRefresh /> {t("common.refresh") || "Actualiser"}
                    </span>
                  )}
                </button>
                <button
                  className="ref-mai-danger"
                  onClick={handleLogout}
                  type="button"
                >
                  <IconLogOut /> {t("mai.logout") || "Se déconnecter"}
                </button>
              </div>
            </div>
          ) : step === "otp" ? (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyOtp}>
              <div className="ref-mai-otp-hero">
                <div aria-hidden className="ref-mai-otp-icon">
                  <IconMail />
                </div>
                <h3 className="ref-mai-otp-title">Vérification par email</h3>
                <p className="ref-mai-otp-text">
                  Saisissez le code à 6 chiffres envoyé à<br />
                  <strong>{email}</strong>
                </p>
              </div>

              <div className="ref-mai-field" style={{ marginBottom: 0 }}>
                <input
                  autoFocus
                  className="ref-mai-otp-input"
                  maxLength={8}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="••••••"
                  required
                  type="text"
                  value={otpCode}
                />
              </div>

              <button
                className="ref-mai-btn ref-mai-btn--primary"
                disabled={loading || !otpCode.trim()}
                style={{ marginBottom: 16, marginTop: 20 }}
                type="submit"
              >
                {loading
                  ? "Vérification en cours…"
                  : t("mai.verify") || "Valider le code"}
              </button>

              <div className="ref-mai-otp-actions">
                <button
                  className="ref-mai-text-btn"
                  onClick={() => setStep("form")}
                  type="button"
                >
                  ← {t("common.back") || "Retour"}
                </button>
                <button
                  className="ref-mai-text-btn ref-mai-text-btn--accent"
                  disabled={loading}
                  onClick={handleResendOtp}
                  type="button"
                >
                  {t("mai.resendCode") || "Renvoyer un code"}
                </button>
              </div>
            </form>
          ) : (
            /* Login / Register Form */
            <div>
              {/* Tabs Switcher */}
              <div className="ref-mai-tabs" role="tablist">
                <button
                  aria-selected={activeTab === "login"}
                  className={`ref-mai-tab${activeTab === "login" ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveTab("login");
                    setError(null);
                  }}
                  role="tab"
                  type="button"
                >
                  {t("mai.login") || "Connexion"}
                </button>
                <button
                  aria-selected={activeTab === "register"}
                  className={`ref-mai-tab${activeTab === "register" ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveTab("register");
                    setError(null);
                  }}
                  role="tab"
                  type="button"
                >
                  {t("mai.register") || "Créer un compte"}
                </button>
              </div>

              {activeTab === "login" ? (
                <form onSubmit={handleLogin}>
                  <div className="ref-mai-field">
                    <label className="ref-mai-label">
                      {t("mai.identifier") || "Email ou nom d'utilisateur"}
                    </label>
                    <div className="ref-mai-input-wrap">
                      <span aria-hidden className="ref-mai-input-icon">
                        <IconMail />
                      </span>
                      <input
                        autoFocus
                        className="ref-mai-input"
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="nom@exemple.com ou pseudo"
                        required
                        type="text"
                        value={identifier}
                      />
                    </div>
                  </div>

                  <div className="ref-mai-field">
                    <div className="ref-mai-label-row">
                      <label
                        className="ref-mai-label"
                        style={{ marginBottom: 0 }}
                      >
                        {t("mai.password") || "Mot de passe"}
                      </label>
                      <button
                        className="ref-mai-link"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? (
                          <span
                            style={{
                              alignItems: "center",
                              display: "inline-flex",
                              gap: 4,
                            }}
                          >
                            Masquer <IconEyeOff />
                          </span>
                        ) : (
                          <span
                            style={{
                              alignItems: "center",
                              display: "inline-flex",
                              gap: 4,
                            }}
                          >
                            Afficher <IconEye />
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="ref-mai-input-wrap">
                      <span aria-hidden className="ref-mai-input-icon">
                        <IconLock />
                      </span>
                      <input
                        className="ref-mai-input"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                    </div>
                  </div>

                  <label className="ref-mai-checkbox-row">
                    <input
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      type="checkbox"
                    />
                    <span>
                      J'accepte les{" "}
                      <a
                        className="ref-mai-checkbox-link"
                        href={TERMS_URL}
                        onClick={handleOpenTerms}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        conditions d'utilisation
                      </a>{" "}
                      (
                      <a
                        className="ref-mai-checkbox-link"
                        href={TERMS_URL}
                        onClick={handleOpenTerms}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        lire les conditions
                      </a>
                      )
                    </span>
                  </label>

                  <button
                    className="ref-mai-btn ref-mai-btn--primary"
                    disabled={
                      loading ||
                      !identifier.trim() ||
                      !password ||
                      !acceptedTerms
                    }
                    type="submit"
                  >
                    {loading
                      ? "Connexion en cours…"
                      : t("mai.login") || "Se connecter"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="ref-mai-field">
                    <label className="ref-mai-label">
                      {t("mai.email") || "Adresse email"}
                    </label>
                    <div className="ref-mai-input-wrap">
                      <span aria-hidden className="ref-mai-input-icon">
                        <IconMail />
                      </span>
                      <input
                        className="ref-mai-input"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        type="email"
                        value={email}
                      />
                    </div>
                  </div>

                  <div className="ref-mai-field">
                    <label className="ref-mai-label">
                      {t("mai.username") || "Nom d'utilisateur"}
                    </label>
                    <div className="ref-mai-input-wrap">
                      <span aria-hidden className="ref-mai-input-icon">
                        <IconUser />
                      </span>
                      <input
                        className="ref-mai-input"
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="mon_pseudo"
                        required
                        type="text"
                        value={username}
                      />
                    </div>
                  </div>

                  <div className="ref-mai-field">
                    <div className="ref-mai-label-row">
                      <label
                        className="ref-mai-label"
                        style={{ marginBottom: 0 }}
                      >
                        {t("mai.password") || "Mot de passe"}
                      </label>
                      <button
                        className="ref-mai-link"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? (
                          <span
                            style={{
                              alignItems: "center",
                              display: "inline-flex",
                              gap: 4,
                            }}
                          >
                            Masquer <IconEyeOff />
                          </span>
                        ) : (
                          <span
                            style={{
                              alignItems: "center",
                              display: "inline-flex",
                              gap: 4,
                            }}
                          >
                            Afficher <IconEye />
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="ref-mai-input-wrap">
                      <span aria-hidden className="ref-mai-input-icon">
                        <IconLock />
                      </span>
                      <input
                        className="ref-mai-input"
                        minLength={6}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Au moins 6 caractères"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                    </div>
                  </div>

                  <label className="ref-mai-checkbox-row">
                    <input
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      type="checkbox"
                    />
                    <span>
                      J'accepte les{" "}
                      <a
                        className="ref-mai-checkbox-link"
                        href={TERMS_URL}
                        onClick={handleOpenTerms}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        conditions d'utilisation
                      </a>{" "}
                      (
                      <a
                        className="ref-mai-checkbox-link"
                        href={TERMS_URL}
                        onClick={handleOpenTerms}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        lire les conditions
                      </a>
                      )
                    </span>
                  </label>

                  <button
                    className="ref-mai-btn ref-mai-btn--primary"
                    disabled={
                      loading ||
                      !email.trim() ||
                      !username.trim() ||
                      !password ||
                      !acceptedTerms
                    }
                    type="submit"
                  >
                    {loading
                      ? "Création en cours…"
                      : t("mai.register") || "Créer mon compte"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
