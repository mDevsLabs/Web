/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — REJOINDRE UN LIVRE (src/pages/BooksJoinPage.tsx)
 * Route /books/join/:code — adhésion immédiate via un lien de partage,
 * puis redirection vers le Livre rejoint.
 * ============================================================================
 */

import { AlertCircleIcon as AlertCircle, ArrowLeftIcon as ArrowLeft, BookHeartIcon as BookHeart, Loader2Icon as Loader2, UsersIcon as Users } from "@mdevs/icons";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  extractBookCode,
  isValidBookCode,
} from "@/components/vibe/common/bookCode";
import { ApiService } from "@/lib/vibe/services/api";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import { useNavigate, useParams } from "../router";

export const BooksJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { code: codeParam } = useParams<{ code: string }>();

  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const attemptedRef = useRef(false);

  useEffect(() => {
    const code = extractBookCode(codeParam || "");
    if (!isValidBookCode(code)) {
      setError("Ce lien d'invitation est invalide.");
      setIsJoining(false);
      return;
    }
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    ApiService.joinBook(code)
      .then((res) => {
        const book = res.book;
        if (!book?.id) throw new Error("Réponse inattendue du serveur.");
        NotificationService.showInAppToast(
          res.already_member ? "Déjà membre" : "Livre rejoint",
          res.already_member
            ? `Vous êtes déjà membre du Livre « ${book.title || "Livre"} ».`
            : `Bienvenue dans le Livre « ${book.title || "Livre"} » !`,
          "success"
        );
        navigate(`/books/${book.id}`, { replace: true });
      })
      .catch((err: any) => {
        setError(err?.message || "Impossible de rejoindre ce Livre.");
        setIsJoining(false);
      });
  }, [codeParam, navigate]);

  return (
    <div className="flex-1 border-r border-zinc-800 min-h-screen bg-black pb-16 md:pb-0">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/70 border-b border-zinc-800 p-4 flex items-center gap-3">
        <button
          className="p-2 -m-2 rounded-full text-zinc-400 hover:text-white"
          onClick={() => navigate("/books")}
          title="Retour aux Livres"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="p-2 rounded-xl text-sky-300 bg-sky-500/10 border border-sky-500/30">
          <Users className="w-4 h-4" />
        </span>
        <h1 className="text-lg font-bold text-white">Rejoindre un Livre</h1>
      </header>

      <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
        {isJoining && !error ? (
          <>
            <span className="p-4 rounded-full bg-zinc-900 text-sky-300">
              <Loader2 className="w-8 h-8 animate-spin" />
            </span>
            <p className="text-sm text-zinc-400">Adhésion au Livre en cours…</p>
          </>
        ) : (
          <>
            <span className="p-4 rounded-full bg-red-950/40 text-red-400">
              <AlertCircle className="w-8 h-8" />
            </span>
            <p className="text-sm text-zinc-300">{error}</p>
            <p className="text-xs text-zinc-600 max-w-xs">
              Demandez un nouveau lien d'invitation, ou rejoignez le Livre avec
              son code depuis la page Livres.
            </p>
            <button
              className="mt-2 flex items-center gap-2 py-2 px-5 rounded-full bg-white text-black text-xs font-bold"
              onClick={() => navigate("/books")}
              style={{ backgroundColor: "var(--vibe-accent, #ffffff)" }}
            >
              <BookHeart className="w-3.5 h-3.5" />
              Aller aux Livres
            </button>
          </>
        )}
      </div>
    </div>
  );
};
