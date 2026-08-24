"use client";

import {
  ChevronUp,
  FolderArchiveIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { MaiUser } from "@/lib/auth/session";

export function SidebarUserNav({ user }: { user?: MaiUser | null }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleThemeSelect = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logoutAction();
      toast.success("Déconnexion réussie");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la déconnexion");
      setIsLoggingOut(false);
    }
  }, [router]);

  const username = user?.username || "Mon Compte";
  const email = user?.email || "";
  const tier = user?.tier || "Free";
  const avatarUrl = user?.avatarUrl;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-11 px-2.5 rounded-xl bg-transparent text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              data-testid="user-nav-button"
            >
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    alt={username}
                    className="size-full object-cover"
                    height={28}
                    src={avatarUrl}
                    unoptimized
                    width={28}
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[12px] font-semibold text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate text-[13px] font-medium"
                    data-testid="user-username"
                  >
                    {username}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {tier}
                  </span>
                </div>
                <span className="truncate text-[11px] text-muted-foreground">
                  {email}
                </span>
              </div>

              <ChevronUp className="ml-auto size-3.5 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-60 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-float)] p-1.5"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem asChild>
              <Link
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer hover:bg-sidebar-accent"
                href="/settings"
              >
                <SettingsIcon className="size-4 text-muted-foreground" />
                <span>Paramètres du compte</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer hover:bg-sidebar-accent"
                href="/library"
              >
                <FolderArchiveIcon className="size-4 text-muted-foreground" />
                <span>Bibliothèque de fichiers</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border/50" />

            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer hover:bg-sidebar-accent"
              onSelect={handleThemeSelect}
            >
              {resolvedTheme === "light" ? (
                <>
                  <MoonIcon className="size-4 text-muted-foreground" />
                  <span>Mode sombre</span>
                </>
              ) : (
                <>
                  <SunIcon className="size-4 text-muted-foreground" />
                  <span>Mode clair</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border/50" />

            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-destructive cursor-pointer hover:bg-destructive/10 focus:text-destructive"
              disabled={isLoggingOut}
              onSelect={handleLogout}
            >
              <LogOutIcon className="size-4" />
              <span>{isLoggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
