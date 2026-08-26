"use client";

import { AlertCircleIcon, HomeIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20 shadow-sm">
          <AlertCircleIcon className="size-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Une erreur inattendue est survenue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ||
            "L'application a rencontré un problème imprévu. Vous pouvez tenter de recharger ou revenir à la page principale."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            className="flex items-center gap-2 rounded-xl"
            onClick={() => reset()}
            variant="default"
          >
            <RotateCcwIcon className="size-4" />
            Réessayer
          </Button>

          <Button
            asChild
            className="flex items-center gap-2 rounded-xl"
            variant="outline"
          >
            <Link href="/">
              <HomeIcon className="size-4" />
              Accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
