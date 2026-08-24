"use client";

import {
  AlertCircleIcon,
  BotIcon,
  BrainIcon,
  CameraIcon,
  CheckCircle2Icon,
  CloudIcon,
  Code2Icon,
  ExternalLinkIcon,
  HardDriveIcon,
  ImageIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { AI_MODES, DEFAULT_AI_MODE, type AIModeId, isValidAIModeId } from "@/lib/ai/modes";
import type { ChatModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
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

type ImagesUsageData = {
  usedToday: number;
  dailyLimit: number;
  resetAt?: string;
  plan: string;
};

type CloudUsageData = {
  bytesUsed: number;
  bytesLimit: number;
  filesCount: number;
  percentUsed: number;
  overLimit: boolean;
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

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Mo";
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.split("=")[1]) : null;
}
function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "profile" | "usage" | "preferences") || "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "usage" | "preferences">(
    ["profile", "usage", "preferences"].includes(initialTab) ? initialTab : "profile"
  );
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = useCallback(
    (tab: "profile" | "usage" | "preferences") => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const t = searchParams.get("tab") as any;
    if (t && ["profile", "usage", "preferences"].includes(t) && t !== activeTab) {
      setActiveTab(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Données utilisateur
  const [profile, setProfile] = useState<UserSettingsData | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageData | null>(null);
  const [imagesUsage, setImagesUsage] = useState<ImagesUsageData | null>(null);
  const [cloudUsage, setCloudUsage] = useState<CloudUsageData | null>(null);
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

  // Préférences IA (cookie + serveur)
  const [defaultModelId, setDefaultModelId] = useState<string>(DEFAULT_CHAT_MODEL);
  const [defaultModeId, setDefaultModeId] = useState<AIModeId>(DEFAULT_AI_MODE);
  const [customInstructions, setCustomInstructions] = useState("");
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customTemp, setCustomTemp] = useState(0.7);
  const [customTopP, setCustomTopP] = useState(0.9);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const { data: prefModelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000 }
  );
  const prefModels: ChatModel[] = prefModelsData?.models || [];

  const { data: customPrefData, mutate: mutateCustomPref } = useSWR(
    "/api/user/preferences",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000 }
  );

  useEffect(() => {
    if (customPrefData) {
      if (customPrefData.customInstructions !== undefined) setCustomInstructions(customPrefData.customInstructions || "");
      if (customPrefData.enabled !== undefined) setCustomEnabled(!!customPrefData.enabled);
      if (customPrefData.temperature !== undefined) setCustomTemp(customPrefData.temperature);
      if (customPrefData.topP !== undefined) setCustomTopP(customPrefData.topP);
    }
  }, [customPrefData]);

  useEffect(() => {
    const cModel = getCookie("chat-model");
    if (cModel) setDefaultModelId(cModel);
    const cMode = getCookie("ai-mode");
    if (cMode && isValidAIModeId(cMode)) setDefaultModeId(cMode as AIModeId);
  }, []);

  const handleSavePreferences = useCallback(() => {
    setCookie("chat-model", defaultModelId);
    setCookie("ai-mode", defaultModeId);
    toast.success("Préférences IA enregistrées ! ✨");
  }, [defaultModelId, defaultModeId]);

  const handleSaveCustomInstructions = useCallback(async () => {
    setIsSavingCustom(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customInstructions: customInstructions.slice(0, 4000),
          enabled: customEnabled,
          temperature: customTemp,
          topP: customTopP,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Instructions personnalisées enregistrées ! ✨");
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSavingCustom(false);
    }
  }, [customInstructions, customEnabled, customTemp, customTopP, mutateCustomPref]);

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
      setImagesUsage(data.imagesUsage);
      setCloudUsage(data.cloudUsage);
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

    const isSensitiveChange =
      email.trim() !== (profile?.email || "") ||
      phone.trim() !== (profile?.phone || "") ||
      username.trim() !== (profile?.username || "") ||
      (newPassword && newPassword.trim().length > 0);
    if (isSensitiveChange && !currentPassword) {
      toast.error("Votre mot de passe actuel est requis pour modifier e-mail, téléphone, nom ou mot de passe.");
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

  const aiPercent = aiUsage?.limit
    ? Math.min(100, Math.round(((aiUsage.tokensUsed || 0) / aiUsage.limit) * 100))
    : 0;

  const imagesPercent = imagesUsage?.dailyLimit
    ? Math.min(100, Math.round(((imagesUsage.usedToday || 0) / imagesUsage.dailyLimit) * 100))
    : 0;

  const cloudPercent = cloudUsage?.bytesLimit
    ? Math.min(100, Math.round(((cloudUsage.bytesUsed || 0) / cloudUsage.bytesLimit) * 100))
    : 0;

  const apiPercent = apiUsage?.limit
    ? Math.min(100, Math.round(((apiUsage.requestCount || 0) / apiUsage.limit) * 100))
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
        <div className="flex items-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => handleTabChange("profile")}
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
            onClick={() => handleTabChange("preferences")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "preferences"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <SparklesIcon className="size-4" />
            <span>Préférences IA</span>
          </button>

          <button
            onClick={() => handleTabChange("usage")}
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
      ) : activeTab === "preferences" ? (
        /* ────────────── SECTION PRÉFÉRENCES IA ────────────── */
        <div className="py-6 flex flex-col gap-6 max-w-3xl">
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <SparklesIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Préférences IA</h3>
                <p className="text-xs text-muted-foreground">
                  Modèle par défaut et mode d'IA (stockés en cookie, appliqués aux nouvelles discussions).
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Modèle par défaut
              </Label>
              <select
                value={defaultModelId}
                onChange={(e) => setDefaultModelId(e.target.value)}
                className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              >
                {prefModels.length === 0 ? (
                  <option value={DEFAULT_CHAT_MODEL}>{DEFAULT_CHAT_MODEL}</option>
                ) : (
                  prefModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))
                )}
              </select>
              <span className="text-[11px] text-muted-foreground">
                Ce modèle sera pré-sélectionné pour chaque nouvelle conversation. Vous pouvez le changer à la volée dans la barre de saisie.
              </span>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
              <Label className="text-xs font-medium text-muted-foreground">
                Mode d'IA par défaut
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.values(AI_MODES) as any[]).map((mode: any) => {
                  const Icon = mode.icon;
                  const isSelected = defaultModeId === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setDefaultModeId(mode.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                          : "bg-muted/20 border-border/50 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[13px] font-semibold text-foreground">{mode.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{mode.longDescription}</span>
                        {mode.temperature !== undefined && (
                          <span className="text-[10px] font-mono text-muted-foreground/70">
                            temp: {mode.temperature} {mode.topP !== undefined ? `• topP: ${mode.topP}` : ""}
                          </span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2Icon className="size-4 text-primary shrink-0 ml-auto mt-1" />}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Le mode influence le style de réponse et la température du modèle. Global par défaut, modifiable dans le menu <span className="font-medium">+</span> de la conversation.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
              >
                Enregistrer les préférences
              </button>
            </div>
          </div>

          {/* Instructions personnalisées */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                <BotIcon className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">Instructions personnalisées</h3>
                <p className="text-xs text-muted-foreground">Personnalisez le comportement de mAI — ton, langue, contexte métier. Stocké en base, synchronisé sur tous vos appareils.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={customEnabled} onChange={(e) => setCustomEnabled(e.target.checked)} className="size-4 rounded border-border accent-primary" />
                <span className="text-xs font-medium">Activé</span>
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">Qui êtes-vous ? Que doit savoir mAI sur vous ? (max 4000c)</Label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                maxLength={4000}
                rows={5}
                placeholder="Ex: Je suis développeur full-stack à Paris. Réponds toujours en français, tutoie, sois concis, privilégie TypeScript avec exemples exécutables. Mon projet principal est mAI Web..."
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <span className="text-[11px] text-muted-foreground text-right">{customInstructions.length}/4000</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Température ({customTemp})</Label>
                <input type="range" min={0} max={2} step={0.1} value={customTemp} onChange={(e) => setCustomTemp(parseFloat(e.target.value))} className="w-full accent-primary" />
                <span className="text-[11px] text-muted-foreground">0 = Précis, 2 = Créatif</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Top P ({customTopP})</Label>
                <input type="range" min={0} max={1} step={0.05} value={customTopP} onChange={(e) => setCustomTopP(parseFloat(e.target.value))} className="w-full accent-primary" />
                <span className="text-[11px] text-muted-foreground">Contrôle diversité</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveCustomInstructions}
                disabled={isSavingCustom}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingCustom ? <Loader2Icon className="size-4 animate-spin" /> : null}
                {isSavingCustom ? "Enregistrement..." : "Enregistrer instructions"}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Comment ça marche ?</p>
              <p>
                Les préférences sont stockées en cookie (<code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">chat-model</code> &{" "}
                <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">ai-mode</code>) valables 1 an. Elles s'appliquent aux nouvelles discussions, pas aux conversations existantes.
              </p>
            </div>
          </div>
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

          {/* Consommation Images (Quota journalier) */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                  <ImageIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Générations d'Images (Studio mAI)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Images générées aujourd'hui (quota réinitialisé à minuit UTC)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  {imagesUsage?.usedToday ?? 0} / {imagesUsage?.dailyLimit ?? (profile?.tier === "Plus" ? 5 : profile?.tier === "Pro" ? 10 : profile?.tier === "Max" ? 20 : 3)}
                </span>
                <span className="text-xs text-muted-foreground block">images ({imagesPercent}%)</span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  imagesPercent >= 100
                    ? "bg-red-500"
                    : imagesPercent > 75
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-purple-500 to-pink-600"
                }`}
                style={{ width: `${imagesPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Réinitialisation du quota :</span>
              <span className="font-medium text-foreground">{formatDate(imagesUsage?.resetAt)} (Minuit UTC)</span>
            </div>
          </div>

          {/* Consommation Cloud Storage */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                  <CloudIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Stockage Cloud mAI (Documents & Fichiers)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Espace utilisé pour vos documents, pièces jointes et médias
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  {formatBytes(cloudUsage?.bytesUsed || 0)} / {formatBytes(cloudUsage?.bytesLimit || 524288000)}
                </span>
                <span className="text-xs text-muted-foreground block">utilisés ({cloudPercent}%)</span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  cloudPercent > 90
                    ? "bg-red-500"
                    : cloudPercent > 75
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-blue-500 to-cyan-600"
                }`}
                style={{ width: `${cloudPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Fichiers hébergés :</span>
              <span className="font-medium text-foreground">{cloudUsage?.filesCount || 0} fichier(s)</span>
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
