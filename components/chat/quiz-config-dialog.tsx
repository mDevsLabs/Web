"use client";

import {
  BookOpenIcon,
  HelpCircleIcon,
  SparklesIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveChat } from "@/hooks/use-active-chat";
import { cn } from "@/lib/utils";

interface QuizConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuizConfigDialog({ isOpen, onClose }: QuizConfigDialogProps) {
  const { sendMessage, togglePendingTool, pendingTools } = useActiveChat();
  const [theme, setTheme] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<"single" | "multiple" | "mixed">("single");
  const [difficulty, setDifficulty] = useState<"facile" | "moyen" | "difficile" | "expert">("moyen");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLaunchQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTheme = theme.trim();
    if (cleanTheme.length < 20) {
      toast.error("Veuillez saisir un thème d'au moins 20 caractères pour le quiz.");
      return;
    }

    setIsGenerating(true);
    // Fermer immédiatement la modale dès que la génération est lancée
    onClose();

    try {
      if (!pendingTools.includes("quizzly" as any)) {
        togglePendingTool("quizzly" as any);
      }

      const typeDescription =
        questionType === "single"
          ? "uniquement à choix unique"
          : questionType === "multiple"
          ? "à choix multiples"
          : "un mélange de choix uniques et de choix multiples";

      const promptMessage = `Génère immédiatement un quiz interactif avec l'outil quizzly sur le thème « ${cleanTheme} ».
Nombre de questions : ${questionCount}
Niveau de difficulté : ${difficulty}
Format : ${typeDescription}
Exécute l'outil quizzly avec toutes les questions rédigées, leurs explications et les bonnes réponses associées.`;

      await sendMessage({
        parts: [{ text: promptMessage, type: "text" }],
        role: "user",
      });

      toast.success("Génération de votre Quiz en cours ! 🎯");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors du lancement du quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <TrophyIcon className="size-4" />
            </span>
            <DialogTitle>Créer un Quiz Quizzly 🎯</DialogTitle>
          </div>
          <DialogDescription>
            Configurez votre quiz interactif sur mesure généré par l'IA avec correction instantanée et calcul de score.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleLaunchQuiz}>
          {/* Thème avec minimum 20 caractères */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground">
                Thème ou sujet du quiz * (20 caractères min.)
              </Label>
              <span
                className={cn(
                  "text-[10.5px] font-medium",
                  theme.trim().length >= 20
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-500"
                )}
              >
                {theme.trim().length}/20 min
              </span>
            </div>
            <Input
              className={cn(
                "mt-1",
                theme.trim().length > 0 && theme.trim().length < 20 && "border-amber-500/60 focus-visible:ring-amber-500/30"
              )}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Les principes clés de l'architecture logicielle en TypeScript..."
              required
              value={theme}
            />
            {theme.trim().length > 0 && theme.trim().length < 20 && (
              <p className="mt-1 text-[11px] text-amber-500">
                Encore {20 - theme.trim().length} caractère{20 - theme.trim().length > 1 ? "s" : ""} requis.
              </p>
            )}
          </div>

          {/* Nombre de questions (1 à 50) */}
          <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                Nombre de questions
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
                {questionCount} question{questionCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground font-mono">1</span>
              <input
                className="flex-1 accent-amber-500 cursor-pointer h-2 bg-muted rounded-lg appearance-none"
                max={50}
                min={1}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                step={1}
                type="range"
                value={questionCount}
              />
              <span className="text-[11px] text-muted-foreground font-mono">50</span>
            </div>
          </div>

          {/* Type de choix & Difficulté */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Type de questions
              </Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                onChange={(e) => setQuestionType(e.target.value as any)}
                value={questionType}
              >
                <option value="single">Choix unique (QCM standard)</option>
                <option value="multiple">Choix multiples</option>
                <option value="mixed">Mixte (Unique et Multiple)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Difficulté
              </Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                onChange={(e) => setDifficulty(e.target.value as any)}
                value={difficulty}
              >
                <option value="facile">Facile 🌱</option>
                <option value="moyen">Moyen ⚡</option>
                <option value="difficile">Difficile 🔥</option>
                <option value="expert">Expert 🧠</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={onClose} type="button" variant="outline">
              Annuler
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs"
              disabled={isGenerating}
              type="submit"
            >
              <TrophyIcon className="size-4" />
              <span>Générer le Quiz</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}