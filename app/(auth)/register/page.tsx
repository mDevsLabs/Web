"use client";

import { ArrowLeftIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  registerAction,
  resendCodeAction,
  verifyRegisterAction,
} from "../actions";

export default function RegisterPage() {
  const router = useRouter();

  // Étape 1 : Formulaire d'inscription | Étape 2 : Vérification OTP
  const [step, setStep] = useState<"form" | "otp">("form");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Gestion du compte à rebours
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Étape 1 : Envoi de l'inscription
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast.error("Veuillez renseigner tous les champs.");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("email", email.trim());
    formData.append("password", password);

    const res = await registerAction(formData);
    setIsLoading(false);

    if (!res.success) {
      toast.error(res.error || "Erreur lors de l'inscription.");
      return;
    }

    setStep("otp");
    setCountdown(60);
    setCanResend(false);
    toast.success("Code de vérification envoyé par e-mail !");
  };

  // Étape 2 : Validation du code OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      toast.error("Veuillez saisir le code de vérification.");
      return;
    }

    setIsLoading(true);
    const res = await verifyRegisterAction(
      email.trim(),
      username.trim(),
      password,
      otpCode.trim()
    );
    setIsLoading(false);

    if (!res.success) {
      toast.error(res.error || "Code invalide ou expiré.");
      return;
    }

    toast.success("Compte mAI Web créé avec succès ! Bienvenue");
    router.push("/");
    router.refresh();
  };

  // Renvoi du code
  const handleResend = async () => {
    if (!canResend) {
      return;
    }
    setIsLoading(true);
    const res = await resendCodeAction(email.trim(), "register");
    setIsLoading(false);

    if (res.success) {
      setCountdown(60);
      setCanResend(false);
      toast.success("Un nouveau code a été envoyé !");
    } else {
      toast.error(res.error || "Impossible de renvoyer le code.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {step === "form" ? (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Créer un compte mAI Web
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rejoignez mAI Web et accédez gratuitement à vos modèles d'IA.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="username"
              >
                Nom d'utilisateur
              </Label>
              <Input
                autoComplete="username"
                autoFocus
                className="h-10 pl-3 rounded-lg border-border/60 bg-muted/40 text-sm focus:bg-background"
                id="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Mathias_Tss"
                required
                type="text"
                value={username}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="email"
              >
                Adresse e-mail
              </Label>
              <Input
                autoComplete="email"
                className="h-10 pl-3 rounded-lg border-border/60 bg-muted/40 text-sm focus:bg-background"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.fr"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="password"
              >
                Mot de passe (6 caractères min.)
              </Label>
              <Input
                autoComplete="new-password"
                className="h-10 pl-3 rounded-lg border-border/60 bg-muted/40 text-sm focus:bg-background"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                type="password"
                value={password}
              />
            </div>

            <button
              className="mt-2 h-10 w-full rounded-lg bg-foreground text-background font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Continuer"
              )}
            </button>

            <p className="text-center text-[13px] text-muted-foreground mt-2">
              Vous avez déjà un compte ?{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href="/login"
              >
                Se connecter
              </Link>
            </p>
          </form>
        </>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary font-medium text-xs">
              <ShieldCheckIcon className="size-4" />
              Confirmation d'inscription
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Vérifiez votre e-mail
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entrez le code à 6 chiffres envoyé à{" "}
              <strong className="text-foreground">{email}</strong> pour activer
              votre compte.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleOtpSubmit}>
            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="otpCode"
              >
                Code de vérification (6 chiffres)
              </Label>
              <Input
                autoFocus
                className="h-12 text-center text-xl font-mono tracking-[0.3em] font-bold rounded-lg border-border/60 bg-muted/40 focus:bg-background"
                id="otpCode"
                maxLength={8}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                required
                type="text"
                value={otpCode}
              />
            </div>

            <button
              className="h-10 w-full rounded-lg bg-foreground text-background font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Activation...
                </>
              ) : (
                "Activer mon compte"
              )}
            </button>

            <div className="flex items-center justify-between text-[13px] text-muted-foreground pt-2">
              <button
                className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                onClick={() => setStep("form")}
                type="button"
              >
                <ArrowLeftIcon className="size-3.5" />
                Retour
              </button>

              <button
                className="hover:text-foreground disabled:opacity-50 cursor-pointer"
                disabled={!canResend || isLoading}
                onClick={handleResend}
                type="button"
              >
                {canResend ? "Renvoyer le code" : `Renvoyer (${countdown}s)`}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
