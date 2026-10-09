"use client";

import { AlertTriangleIcon as AlertTriangle, ArrowLeftIcon as ArrowLeft, BugIcon as Bug, HelpCircleIcon as HelpCircle, Loader2Icon as Loader2, SparklesIcon as Sparkles } from "@mdevs/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createSupportTicket } from "@/app/(chat)/site/actions/support";
import { useAuth } from "@/components/site/auth-provider";
import Link from "@/components/site/router";
import {
  PRIORITY_OPTIONS,
  type SupportPriority,
} from "@/components/site/support/support-config";
import { TicketCategoryStep } from "@/components/site/support/ticket-form/TicketCategoryStep";
import { TicketPriorityStep } from "@/components/site/support/ticket-form/TicketPriorityStep";
import { TicketProblemStep } from "@/components/site/support/ticket-form/TicketProblemStep";
import { TicketReviewStep } from "@/components/site/support/ticket-form/TicketReviewStep";
import { TicketWizardFooter } from "@/components/site/support/ticket-form/TicketWizardFooter";
import { TicketWizardProgress } from "@/components/site/support/ticket-form/TicketWizardProgress";
import {
  BUG_CATEGORY,
  DEFAULT_CATEGORY,
  type TicketEnvInfo,
  type TicketStep,
  WIZARD_STEPS,
} from "@/components/site/support/ticket-form/ticket-form-types";
import { useTicketAttachmentUpload } from "@/components/site/support/ticket-form/useTicketAttachmentUpload";

export default function NewTicketClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const isBug = initialType === "bug";
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [step, setStep] = useState<TicketStep>(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [project, setProject] = useState<string>("Web");
  const [category, setCategory] = useState(
    isBug ? BUG_CATEGORY : DEFAULT_CATEGORY
  );
  const [priority, setPriority] = useState<SupportPriority>(
    isBug ? "medium" : "low"
  );
  const [description, setDescription] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [envInfo, setEnvInfo] = useState<TicketEnvInfo>({
    platform: "",
    screenResolution: "",
    userAgent: "",
  });
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const {
    pendingAttachments,
    setPendingAttachments,
    uploading,
    fileInputRef,
    handleFilesSelected,
  } = useTicketAttachmentUpload(user);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnvInfo({
        platform: window.navigator.platform || "Inconnu",
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        userAgent: window.navigator.userAgent,
      });
    }
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step, authLoading, isAuthenticated]);

  const getStepValidationMessage = (
    stepToValidate: TicketStep
  ): string | null => {
    if (stepToValidate === 0) {
      if (!project || !category)
        return "Choisissez un projet et une catégorie.";
      return null;
    }
    if (stepToValidate === 1) {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      if (!trimmedTitle) return "Veuillez renseigner un titre.";
      if (trimmedTitle.length < 3 || trimmedTitle.length > 120)
        return "Titre 3-120 caractères.";
      if (trimmedDescription.length < 15)
        return "Veuillez détailler davantage (au moins 15 caractères).";
      return null;
    }
    if (stepToValidate === 2) {
      if (uploading)
        return "Attendez la fin de l'envoi des pièces jointes avant de continuer.";
      if (!PRIORITY_OPTIONS.some((option) => option.id === priority))
        return "Choisissez une priorité.";
      return null;
    }
    return null;
  };

  const goToStep = (nextStep: number) => {
    setStepError(null);
    setStep(
      Math.max(0, Math.min(WIZARD_STEPS.length - 1, nextStep)) as TicketStep
    );
  };

  const handleNext = () => {
    const message = getStepValidationMessage(step);
    if (message) {
      setStepError(message);
      return;
    }
    goToStep(step + 1);
  };

  const submitTicket = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Veuillez vous connecter pour soumettre un ticket.");
      router.push(`/account/login?next=${encodeURIComponent("/support/new")}`);
      return;
    }
    if (uploading) {
      setStep(2);
      setStepError(
        "Attendez la fin de l'envoi des pièces jointes avant de soumettre le ticket."
      );
      return;
    }

    for (let index = 0; index < WIZARD_STEPS.length - 1; index += 1) {
      const message = getStepValidationMessage(index as TicketStep);
      if (message) {
        setStep(index as TicketStep);
        setStepError(message);
        return;
      }
    }

    setSubmitting(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (includeDiagnostics) metadata.diagnostics = envInfo;

      const response = await createSupportTicket({
        attachmentIds: pendingAttachments.map((attachment) => attachment.id),
        category,
        description: description.trim(),
        metadata,
        priority,
        project,
        title: title.trim(),
      });

      if (response.success && response.ticket) {
        toast.success("Ticket créé ! L'équipe mAI a été notifiée.");
        router.push(`/support/tickets/${response.ticket.id}`);
      } else {
        toast.error(response.error || "Erreur lors de la création.");
      }
    } catch (reason: unknown) {
      console.error(reason);
      toast.error("Impossible de créer le ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < WIZARD_STEPS.length - 1) {
      handleNext();
      return;
    }
    void submitTicket();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-black/5 bg-white py-32 text-sm font-medium text-slate-500">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-purple-600"
        />
        <span>Vérification de la session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-black/5 bg-white p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
          <HelpCircle aria-hidden="true" className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Authentification requise
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">
          Pour créer un ticket et recevoir un suivi personnalisé,
          connectez-vous.
        </p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link
            className="rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white hover:bg-purple-500"
            href="/account/login?next=/support/new"
          >
            Se connecter
          </Link>
          <Link
            className="rounded-xl bg-slate-100 px-6 py-3 text-xs font-bold text-slate-800 hover:bg-slate-200"
            href="/account/register?next=/support/new"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
        href="/support"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Retour au centre de
        support
      </Link>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900">
                {isBug ? (
                  <>
                    <Bug aria-hidden="true" className="h-7 w-7 text-red-500" />{" "}
                    Signaler un incident
                  </>
                ) : (
                  <>
                    <Sparkles
                      aria-hidden="true"
                      className="h-7 w-7 text-purple-600"
                    />{" "}
                    Créer une nouvelle demande
                  </>
                )}
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                Un e-mail sera transmis à l&apos;équipe mAI. Vous pourrez suivre
                la demande et échanger directement avec elle.
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
              {step + 1} / {WIZARD_STEPS.length}
            </span>
          </div>
          <TicketWizardProgress onStepChange={goToStep} step={step} />
        </div>

        <form className="space-y-6 p-6 sm:p-8" onSubmit={handleSubmit}>
          <div>
            <h2
              className="text-lg font-extrabold text-slate-900 outline-none"
              ref={stepHeadingRef}
              tabIndex={-1}
            >
              {WIZARD_STEPS[step].title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {WIZARD_STEPS[step].description}
            </p>
          </div>

          {stepError ? (
            <div
              className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
              role="alert"
            >
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>{stepError}</span>
            </div>
          ) : null}

          {step === 0 ? (
            <TicketCategoryStep
              category={category}
              onCategoryChange={setCategory}
              onProjectChange={setProject}
              project={project}
            />
          ) : null}
          {step === 1 ? (
            <TicketProblemStep
              description={description}
              onDescriptionChange={setDescription}
              onPreviewModeChange={setPreviewMode}
              onTitleChange={setTitle}
              previewMode={previewMode}
              title={title}
            />
          ) : null}
          {step === 2 ? (
            <TicketPriorityStep
              attachments={pendingAttachments}
              envInfo={envInfo}
              fileInputRef={fileInputRef}
              includeDiagnostics={includeDiagnostics}
              onFilesSelected={handleFilesSelected}
              onIncludeDiagnosticsChange={setIncludeDiagnostics}
              onPriorityChange={setPriority}
              onRemoveAttachment={(id) =>
                setPendingAttachments((previous) =>
                  previous.filter((item) => item.id !== id)
                )
              }
              priority={priority}
              uploading={uploading}
            />
          ) : null}
          {step === 3 ? (
            <TicketReviewStep
              attachments={pendingAttachments}
              category={category}
              description={description}
              priority={priority}
              project={project}
              title={title}
            />
          ) : null}

          <TicketWizardFooter
            onBack={() => goToStep(step - 1)}
            onNext={handleNext}
            step={step}
            submitting={submitting}
            uploading={uploading}
          />
        </form>
      </div>
    </div>
  );
}
