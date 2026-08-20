"use client";

import {
  AlertCircleIcon,
  BotIcon,
  CameraIcon,
  CheckCircle2Icon,
  Code2Icon,
  ExternalLinkIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserSettingsData = {
  username: string;
  email: string;
  phone?: string;
  tier: string;
  avatarUrl?: string;
  newsletter?: boolean;
  notify_limits?: boolean;
};

type AIUsageData = {
  tokensUsed: number;
  limit: number;
  resetAt?: string;
  tier: string;
};

type APIUsageData = {
  requestCount: number;
  limit: number;
  keysCount: number;
};

function formatTokens(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Prochainement";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "usage">("profile");
  const [isLoading, setIsLoading] = useState(true);

  // Données utilisateur
  const [profile, setProfile] = useState<UserSettingsData | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageData | null>(null);
  const [apiUsage, setApiUsage] = useState<APIUsageData | null>(null);

  // Formulaire profil
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [notifyLimits, setNotifyLimits] = useState(true);

  // États actions
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Modale vérification nouvel email
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Récupérer les données
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();

      if (data.user) {
        setProfile(data.user);
        setUsername(data.user.username || "");
        setEmail(data.user.email || "");
        setPhone(data.user.phone || "");
        setNewsletter(Boolean(data.user.newsletter));
        setNotifyLimits(Boolean(data.user.notify_limits));
      }
      setAiUsage(data.aiUsage);
      setApiUsage(data.apiUsage);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de récupérer les paramètres.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Upload d'avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Erreur lors du téléversement de l'avatar.");
        return;
      }

      toast.success("Photo de profil mise à jour ! ✨");
      if (profile) {
        setProfile({ ...profile, avatarUrl: data.avatarUrl });
      }
    } catch {
      toast.error("Impossible de mettre à jour l'avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Sauvegarde des modifications du profil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Votre mot de passe actuel est requis pour enregistrer les modifications.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        currentPassword,
        newsletter,
        notify_limits: notifyLimits,
      };

      if (newPassword && newPassword.trim()) {
        if (newPassword.length < 6) {
          toast.error("Le nouveau mot de passe doit comporter au moins 6 caractères.");
          setIsSaving(false);
          return;
        }
        payload.password = newPassword;
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Erreur lors de la mise à jour du profil.");
        return;
      }

      // Si changement d'email nécessitant validation OTP
      if (data.status === "email_verification_required") {
        setPendingEmail(data.email || email.trim());
        setShowEmailOtpModal(true);
        toast.info("Un code a été envoyé à votre nouvelle adresse e-mail pour validation !");
        return;
      }

      toast.success("Profil mis à jour avec succès ! ✨");
      setCurrentPassword("");
      setNewPassword("");
      fetchSettings();
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  // Validation du code OTP pour le nouvel e-mail
  const handleVerifyNewEmail = async () => {
    if (!emailOtpCode || emailOtpCode.trim().length < 4) {
      toast.error("Veuillez saisir le code de vérification.");
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_new_email",
          email: pendingEmail,
          code: emailOtpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Code invalide ou expiré.");
        return;
      }

      toast.success("Votre nouvelle adresse e-mail est confirmée !");
      setShowEmailOtpModal(false);
      setEmailOtpCode("");
      fetchSettings();
    } catch {
      toast.error("Impossible de confirmer l'adresse e-mail.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const aiPercent = aiUsage
    ? Math.min(100, Math.round((aiUsage.tokensUsed / aiUsage.limit) * 100))
    : 0;

  const apiPercent = apiUsage
    ? Math.min(100, Math.round((apiUsage.requestCount / apiUsage.limit) * 100))
    : 0;

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* En-tête de la page */}
      <div className="pb-6 border-b border-border/50">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Paramètres du compte
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez votre profil, vos informations personnelles et visualisez votre consommation IA et API.
        </p>

        {/* Onglets */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <UserIcon className="size-4" />
            <span>Mon Profil</span>
          </button>

          <button
            onClick={() => setActiveTab("usage")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "usage"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ZapIcon className="size-4" />
            <span>Consommation & Forfait</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2Icon className="size-6 animate-spin text-primary" />
          <span className="text-sm">Chargement de vos informations...</span>
        </div>
      ) : activeTab === "profile" ? (
        /* ────────────── SECTION PROFIL ────────────── */
        <div className="py-6 flex flex-col gap-8 max-w-2xl">
          {/* Avatar */}
          <div className="flex items-center gap-5 p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md">
            <div className="relative group">
              <div className="size-20 rounded-full ring-2 ring-border/80 overflow-hidden bg-muted flex items-center justify-center shadow-md">
                {profile?.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={username}
                    width={80}
                    height={80}
                    className="size-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Changer la photo"
              >
                {isUploadingAvatar ? (
                  <Loader2Icon className="size-6 animate-spin" />
                ) : (
                  <CameraIcon className="size-6" />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-base">{username}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  {profile?.tier || "Free"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="mt-2 text-xs font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <CameraIcon className="size-3.5" />
                Changer la photo de profil
              </button>
            </div>
          </div>

          {/* Formulaire des informations personnelles */}
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-username" className="text-xs font-medium text-muted-foreground">
                  Nom d'utilisateur
                </Label>
                <Input
                  id="settings-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-email" className="text-xs font-medium text-muted-foreground">
                  Adresse e-mail
                </Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-phone" className="text-xs font-medium text-muted-foreground">
                Numéro de téléphone (optionnel)
              </Label>
              <Input
                id="settings-phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
              />
            </div>

            {/* Changement de mot de passe */}
            <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <KeyRoundIcon className="size-4 text-primary" />
                Sécurité & Mot de passe
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-current-password" className="text-xs font-medium text-muted-foreground">
                    Mot de passe actuel <strong className="text-red-500">*</strong>
                  </Label>
                  <Input
                    id="settings-current-password"
                    type="password"
                    placeholder="Obligatoire pour valider"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-new-password" className="text-xs font-medium text-muted-foreground">
                    Nouveau mot de passe (optionnel)
                  </Label>
                  <Input
                    id="settings-new-password"
                    type="password"
                    placeholder="Laisser vide si inchangé"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Préférences */}
            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
              <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="rounded border-border size-4 accent-primary"
                />
                <span>Recevoir les actualités et annonces mAI par e-mail</span>
              </label>

              <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyLimits}
                  onChange={(e) => setNotifyLimits(e.target.checked)}
                  className="rounded border-border size-4 accent-primary"
                />
                <span>M'alerter par e-mail lorsque j'atteins 90% de mes limites de tokens ou stockage</span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ────────────── SECTION CONSOMMATION & QUOTAS ────────────── */
        <div className="py-6 flex flex-col gap-6 max-w-3xl">
          {/* Forfait actuel */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Forfait Actuel
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-bold text-foreground">mAI {profile?.tier || "Free"}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  Actif
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.tier === "Free"
                  ? "Accès gratuit avec 500k tokens hebdomadaires et 500 Mo de stockage cloud."
                  : "Forfait premium débloqué avec quotas étendus et modèles avancés."}
              </p>
            </div>

            <Link
              href={MAI_UPGRADE_URL}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md shrink-0"
            >
              <SparklesIcon className="size-4" />
              <span>Gérer / Mettre à niveau</span>
              <ExternalLinkIcon className="size-3.5" />
            </Link>
          </div>

          {/* Consommation mAI (Tokens hebdomadaires) */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <BotIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Utilisation de l'IA (Tokens mAI)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Consommation calculée sur vos invites et réponses générées
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  {formatTokens(aiUsage?.tokensUsed || 0)} / {formatTokens(aiUsage?.limit || 500000)}
                </span>
                <span className="text-xs text-muted-foreground block">tokens ({aiPercent}%)</span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  aiPercent > 90
                    ? "bg-red-500"
                    : aiPercent > 75
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600"
                }`}
                style={{ width: `${aiPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Renouvellement hebdomadaire :</span>
              <span className="font-medium text-foreground">{formatDate(aiUsage?.resetAt)}</span>
            </div>
          </div>

          {/* Consommation API Développeur */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                  <Code2Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Utilisation de l'API mAI
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Requêtes exécutées via vos clés API ce mois-ci
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  {apiUsage?.requestCount || 0} / {apiUsage?.limit || 500}
                </span>
                <span className="text-xs text-muted-foreground block">requêtes ({apiPercent}%)</span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  apiPercent > 90
                    ? "bg-red-500"
                    : apiPercent > 75
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600"
                }`}
                style={{ width: `${apiPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Clés API associées au compte :</span>
              <span className="font-medium text-foreground">{apiUsage?.keysCount || 0} active(s)</span>
            </div>
          </div>

          {/* Encadré d'information pour la mise à niveau */}
          <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                Besoin de plus de tokens ou d'espace de stockage ?
              </p>
              <p>
                Les mises à niveau de forfait (Plus, Pro, Max) et l'activation des codes promotionnels
                s'effectuent directement sur le portail officiel{" "}
                <Link
                  href={MAI_UPGRADE_URL}
                  target="_blank"
                  className="text-primary font-medium underline inline-flex items-center gap-0.5"
                >
                  mai-devs.vercel.app
                  <ExternalLinkIcon className="size-3" />
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modale de validation OTP du nouvel e-mail */}
      <AlertDialog open={showEmailOtpModal} onOpenChange={setShowEmailOtpModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <ShieldCheckIcon className="size-4" />
              Changement d'adresse e-mail
            </div>
            <AlertDialogTitle>Confirmez votre nouvelle adresse</AlertDialogTitle>
            <AlertDialogDescription>
              Un code de confirmation a été envoyé à <strong>{pendingEmail}</strong>. Veuillez le saisir
              pour finaliser la mise à jour de votre profil.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3">
            <Input
              type="text"
              maxLength={8}
              placeholder="123456"
              value={emailOtpCode}
              onChange={(e) => setEmailOtpCode(e.target.value)}
              className="h-11 text-center text-lg font-mono tracking-widest font-bold"
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVerifyingEmail}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerifyNewEmail}
              disabled={isVerifyingEmail}
              className="bg-primary text-primary-foreground"
            >
              {isVerifyingEmail ? "Vérification..." : "Confirmer le nouvel e-mail"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
