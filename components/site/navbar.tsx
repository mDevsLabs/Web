"use client";

import { ChevronDownIcon as ChevronDown, DownloadIcon as Download, MenuIcon as Menu, SearchIcon as Search, UserRoundIcon as UserRound, XIcon as X } from "@mdevs/icons";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppSwitcherMenu } from "@/components/common/app-switcher";
import { AccountMenu } from "@/components/site/navbar/account-menu";
import { DesktopNavigation } from "@/components/site/navbar/desktop-navigation";
import { MobileNavigation } from "@/components/site/navbar/mobile-navigation";
import { SocialLinks } from "@/components/site/navbar/social-links";
import { useNavbarAccount } from "@/components/site/navbar/use-navbar-account";
import { useScrolled } from "@/components/site/navbar/use-scrolled";
import Link from "@/components/site/router";
import { PageSearch } from "@/components/site/ui/search-bar";
import type { ChangelogsByProject } from "@/lib/site/changelog";
import type { NewsArticle } from "@/lib/site/news";

const CommandMenu = dynamic(
  () => import("@/components/site/command-menu").then((mod) => mod.CommandMenu),
  { ssr: false }
);

interface NavbarProps {
  changelogs?: ChangelogsByProject;
  news?: NewsArticle[];
}

export function Navbar({ changelogs, news }: NavbarProps) {
  const pathname = usePathname();
  const account = useNavbarAccount();
  const scrolled = useScrolled();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  return (
    <>
      <header
        className={`fixed safe-top-4 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-6xl xl:max-w-7xl rounded-3xl md:rounded-full px-4 md:px-8 py-2 md:py-3 glass transition-[background-color,box-shadow] duration-300 ease-ios ${
          scrolled ? "glass-elev" : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <AppSwitcherMenu
            align="start"
            isAuthenticated={account.isAuthenticated}
            side="bottom"
          >
            <button
              className="flex items-center gap-1 cursor-pointer rounded-xl p-1 hover:bg-black/5 transition-colors focus:outline-hidden"
              title="Changer d'application mAI"
              type="button"
            >
              <img
                alt="mAI"
                height={48}
                src="/site/logo.png"
                style={{ height: "40px", objectFit: "contain", width: "auto" }}
                width={160}
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 -ml-1" />
            </button>
          </AppSwitcherMenu>

          <DesktopNavigation pathname={pathname} />

          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            {/* Recherche globale du site (desktop) */}
            <div className="hidden lg:block">
              <PageSearch
                className="w-44 xl:w-60"
                placeholder="Rechercher…"
                type="all"
                variant="navbar"
              />
            </div>

            <AccountMenu account={account} pathname={pathname} />
            <SocialLinks variant="desktop" />

            {/* CTA Télécharger (desktop) */}
            <Link
              className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-200 hover:bg-slate-800 active:scale-[0.97]"
              href="/downloads"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </Link>

            {/* Recherche (mobile & tablette) */}
            <button
              aria-label="Rechercher"
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-[background-color,transform] duration-150 hover:bg-black/5 active:scale-95"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCommandOpen(true);
              }}
              type="button"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Compte (mobile icon) */}
            <Link
              aria-label={account.accountLabel}
              className={`md:hidden flex h-11 w-11 items-center justify-center rounded-full border transition-[background-color,transform] duration-150 active:scale-95 ${
                pathname.startsWith("/account")
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : "border-black/10 bg-black/5 text-slate-600 hover:bg-black/10"
              }`}
              href={account.accountHref}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {account.accountInitials ? (
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {account.accountInitials}
                </span>
              ) : (
                <UserRound className="w-5 h-5" />
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="dialog"
              aria-label={
                isMobileMenuOpen
                  ? "Fermer la navigation"
                  : "Ouvrir la navigation"
              }
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-[background-color,transform] duration-150 hover:bg-black/5 active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNavigation
        account={account}
        onOpenChange={setIsMobileMenuOpen}
        open={isMobileMenuOpen}
        pathname={pathname}
      />
      <CommandMenu
        changelogs={changelogs}
        news={news}
        open={isCommandOpen}
        setOpen={setIsCommandOpen}
      />
    </>
  );
}
