"use client";

import Link from "next/link";
import { APP_COPYRIGHT, APP_VERSION, LEGAL_LINKS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 text-center md:flex-row md:px-6">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <span className="text-[11px] font-medium text-muted-foreground">
            {APP_COPYRIGHT}
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            v{APP_VERSION} • mAI Web
          </span>
        </div>

        <nav className="flex items-center gap-3 text-[11px] font-medium">
          {LEGAL_LINKS.map((link) => (
            <a
              className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
              href={link.href}
              key={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
          <span className="text-border">•</span>
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
            href="/settings"
          >
            Paramètres
          </Link>
        </nav>
      </div>
    </footer>
  );
}
