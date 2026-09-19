import { HomeIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border/60 shadow-sm">
          <SearchIcon className="size-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        <Button
          asChild
          className="mt-6 flex items-center gap-2 rounded-xl"
          variant="default"
        >
          <Link href="/">
            <HomeIcon className="size-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
