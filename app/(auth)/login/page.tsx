"use client";

import { ArrowLeftIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, resendCodeAction, verifyLoginAction } from "../actions";

export default function LoginPage() {
  const router = useRouter();

  // Étape 1 : Saisie identifiants | Étape 2 : Vérification OTP
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Gestion du compte à rebours pour le renvoi d'OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Étape 1 : Envoi des identifiants
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Veuillez renseigner vos identifiants.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("password", password);

    const res = await loginAction(formData);
    setIsLoading(false);

    if (!res.success) {
      toast.error(res.error || "Identifiants invalides.");
      return;
    }

    setTargetEmail(res.email || identifier);
    setStep("otp");
    setCountdown(60);
    setCanResend(false);
    toast.success("Code de sécurité envoyé par e-mail !");
  };

  // Étape 2 : Vérification du code OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      toast.error("Veuillez saisir le code de vérification.");
      return;
    }

    setIsLoading(true);
    const res = await verifyLoginAction(targetEmail, otpCode.trim());
    setIsLoading(false);

    if (!res.success) {
      toast.error(res.error || "Code invalide ou expiré.");
      return;
    }

    toast.success("Connexion réussie ! Bienvenue sur mAI Web");
    router.push("/");
    router.refresh();
  };

  // Renvoi du code
  const handleResend = async () => {
    if (!canResend) {
      return;
    }
    setIsLoading(true);
    const res = await resendCodeAction(targetEmail, "login");
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
      {step === "credentials" ? (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Connexion à mAI Web
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Accédez à votre espace d'intelligence artificielle et vos modèles.
            </p>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={handleCredentialsSubmit}
          >
            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="identifier"
              >
                E-mail ou Nom d'utilisateur
              </Label>
              <div className="relative">
                <Input
                  autoComplete="username"
                  autoFocus
                  className="h-10 pl-3 rounded-lg border-border/60 bg-muted/40 text-sm focus:bg-background"
                  id="identifier"
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nom@exemple.fr ou pseudo"
                  required
                  type="text"
                  value={identifier}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="password"
              >
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className="h-10 pl-3 rounded-lg border-border/60 bg-muted/40 text-sm focus:bg-background"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>
            </div>

            <button
              className="mt-2 h-10 w-full rounded-lg bg-foreground text-background font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Continuer"
              )}
            </button>

            <p className="text-center text-[13px] text-muted-foreground mt-2">
              Pas encore de compte ?{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href="/register"
              >
                Créer un compte
              </Link>
            </p>
          </form>
        </>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary font-medium text-xs">
              <ShieldCheckIcon className="size-4" />
              Double authentification
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Code de vérification
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entrez le code à 6 chiffres envoyé à{" "}
              <strong className="text-foreground">{targetEmail}</strong>.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleOtpSubmit}>
            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="otpCode"
              >
                Code de sécurité (6 chiffres)
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
                  Validation...
                </>
              ) : (
                "Se connecter"
              )}
            </button>

            <div className="flex items-center justify-between text-[13px] text-muted-foreground pt-2">
              <button
                className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                onClick={() => setStep("credentials")}
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
