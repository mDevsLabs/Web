"use client";

import {
  CameraIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
} from "@mdevs/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { requestOnboardingReplay } from "@/hooks/use-onboarding";
import { useSettings } from "@/hooks/use-settings";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { usePlatform } from "@/lib/platform";

export function ProfileTab() {
  const router = useRouter();
  const platformInfo = usePlatform();

  const {
    data: settingsData,
    isLoading,
    mutate: mutateSettings,
  } = useSettings({ revalidateOnFocus: true });

  const profile = settingsData?.user ?? null;

  // Formulaire profil
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [notifyLimits, setNotifyLimits] = useState(true);

  // Actions states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Modale OTP
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (!initialSyncDone.current && settingsData?.user) {
      initialSyncDone.current = true;
      const u = settingsData.user;
      setUsername(u.username || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
      setNewsletter(Boolean(u.newsletter));
      setNotifyLimits(Boolean(u.notify_limits));
    }
  }, [settingsData]);

  const handleReplayTutorial = useCallback(() => {
    requestOnboardingReplay();
    router.push("/");
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/settings", {
        body: formData,
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          extractApiErrorMessage(data) ||
            "Erreur lors du téléversement de l'avatar."
        );
        return;
      }

      toast.success("Photo de profil mise à jour !");
      mutateSettings(
        (current) =>
          current?.user
            ? {
                ...current,
                user: { ...current.user, avatarUrl: data.avatarUrl },
              }
            : current,
        { revalidate: false }
      );
    } catch {
      toast.error("Impossible de mettre à jour l'avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSensitiveChange =
      email.trim() !== (profile?.email || "") ||
      phone.trim() !== (profile?.phone || "") ||
      username.trim() !== (profile?.username || "") ||
      (newPassword && newPassword.trim().length > 0);

    if (isSensitiveChange && !currentPassword) {
      toast.error(
        "Votre mot de passe actuel est requis pour modifier e-mail, téléphone, nom ou mot de passe."
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        currentPassword,
        email: email.trim(),
        newsletter,
        notify_limits: notifyLimits,
        phone: phone.trim() || undefined,
        username: username.trim(),
      };

      if (newPassword?.trim()) {
        if (newPassword.length < 6) {
          toast.error(
            "Le nouveau mot de passe doit comporter au moins 6 caractères."
          );
          setIsSaving(false);
          return;
        }
        payload.password = newPassword;
      }

      const res = await fetch("/api/settings", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(
          extractApiErrorMessage(data) ||
            "Erreur lors de la mise à jour du profil."
        );
        return;
      }

      if (data.status === "email_verification_required") {
        setPendingEmail(data.email || email.trim());
        setShowEmailOtpModal(true);
        toast.info(
          "Un code a été envoyé à votre nouvelle adresse e-mail pour validation !"
        );
        return;
      }

      toast.success("Profil mis à jour avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      mutateSettings();
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyNewEmail = async () => {
    if (!emailOtpCode || emailOtpCode.trim().length < 4) {
      toast.error("Veuillez saisir le code de vérification.");
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const res = await fetch("/api/settings", {
        body: JSON.stringify({
          action: "verify_new_email",
          code: emailOtpCode.trim(),
          email: pendingEmail,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(extractApiErrorMessage(data) || "Code invalide ou expiré.");
        return;
      }

      toast.success("Votre nouvelle adresse e-mail est confirmée !");
      setShowEmailOtpModal(false);
      setEmailOtpCode("");
      mutateSettings();
    } catch {
      toast.error("Impossible de confirmer l'adresse e-mail.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2Icon className="size-6 animate-spin text-primary" />
        <span className="text-sm">Chargement de vos informations...</span>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8 max-w-4xl">
      {/* Avatar */}
      <div className="surface-card flex items-center gap-5" id="profile-avatar">
        <div className="relative group">
          <div className="size-20 rounded-full ring-2 ring-border/80 overflow-hidden bg-muted flex items-center justify-center shadow-md">
            {profile?.avatarUrl ? (
              <Image
                alt={username}
                className="size-full object-cover"
                height={80}
                src={profile.avatarUrl}
                unoptimized
                width={80}
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <button
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            title="Changer la photo"
            type="button"
          >
            {isUploadingAvatar ? (
              <Loader2Icon className="size-6 animate-spin" />
            ) : (
              <CameraIcon className="size-6" />
            )}
          </button>

          <input
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-base">
              {username}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
              {profile?.tier || "Free"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MonitorSmartphoneIcon className="size-3" />
              {platformInfo.desktopVersion
                ? `${platformInfo.label} v${platformInfo.desktopVersion}`
                : platformInfo.label}
            </span>
            <span aria-hidden="true" className="text-border">
              •
            </span>
            <button
              className="font-medium text-primary hover:underline cursor-pointer"
              onClick={handleReplayTutorial}
              type="button"
            >
              Revoir le tutoriel
            </button>
          </div>
          <button
            className="mt-2 text-xs font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <CameraIcon className="size-3.5" />
            Changer la photo de profil
          </button>
        </div>
      </div>

      {/* Formulaire des informations personnelles */}
      <form
        className="flex flex-col gap-5 scroll-mt-6"
        id="profile-form"
        onSubmit={handleProfileSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="settings-username"
            >
              Nom d'utilisateur
            </Label>
            <Input
              className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
              id="settings-username"
              onChange={(e) => setUsername(e.target.value)}
              required
              value={username}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="settings-email"
            >
              Adresse e-mail
            </Label>
            <Input
              className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
              id="settings-email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="settings-phone"
          >
            Numéro de téléphone (optionnel)
          </Label>
          <Input
            className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
            id="settings-phone"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            type="tel"
            value={phone}
          />
        </div>

        {/* Changement de mot de passe */}
        <div
          className="pt-4 border-t border-border/50 flex flex-col gap-4 scroll-mt-6"
          id="profile-security"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-primary" />
            Sécurité & Mot de passe
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="settings-current-password"
              >
                Mot de passe actuel{" "}
                <strong className="text-destructive">*</strong>
              </Label>
              <div className="relative">
                <Input
                  className="h-10 pr-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  id="settings-current-password"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Obligatoire pour valider"
                  required
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                />
                <button
                  aria-label={
                    showCurrentPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  type="button"
                >
                  {showCurrentPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="settings-new-password"
              >
                Nouveau mot de passe (optionnel)
              </Label>
              <div className="relative">
                <Input
                  className="h-10 pr-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  id="settings-new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Laisser vide si inchangé"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                />
                <button
                  aria-label={
                    showNewPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  type="button"
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
          <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
            <input
              checked={newsletter}
              className="rounded border-border size-4 accent-primary"
              onChange={(e) => setNewsletter(e.target.checked)}
              type="checkbox"
            />
            <span>Recevoir les actualités et annonces mAI par e-mail</span>
          </label>

          <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
            <input
              checked={notifyLimits}
              className="rounded border-border size-4 accent-primary"
              onChange={(e) => setNotifyLimits(e.target.checked)}
              type="checkbox"
            />
            <span>
              M'alerter par e-mail lorsque j'atteins 90% de mes limites de
              tokens ou stockage
            </span>
          </label>
        </div>

        <div className="pt-4">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            disabled={isSaving}
            type="submit"
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

      {/* Modale de validation OTP du nouvel e-mail */}
      <AlertDialog onOpenChange={setShowEmailOtpModal} open={showEmailOtpModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <ShieldCheckIcon className="size-4" />
              Changement d'adresse e-mail
            </div>
            <AlertDialogTitle>
              Confirmez votre nouvelle adresse
            </AlertDialogTitle>
            <AlertDialogDescription>
              Un code de confirmation a été envoyé à{" "}
              <strong>{pendingEmail}</strong>. Veuillez le saisir pour finaliser
              la mise à jour de votre profil.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3">
            <Input
              autoFocus
              className="h-11 text-center text-lg font-mono tracking-widest font-bold"
              maxLength={8}
              onChange={(e) => setEmailOtpCode(e.target.value)}
              placeholder="123456"
              type="text"
              value={emailOtpCode}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVerifyingEmail}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground"
              disabled={isVerifyingEmail}
              onClick={handleVerifyNewEmail}
            >
              {isVerifyingEmail
                ? "Vérification..."
                : "Confirmer le nouvel e-mail"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
