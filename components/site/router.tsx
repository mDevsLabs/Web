"use client";

import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

export const SITE_BASE_PATH = "/site";

/**
 * Convertit un chemin relatif du site en URL absolue "/site/...".
 * Ne touche pas aux URLs externes ni aux ancres pures (#...).
 */
export function toSitePath(to: string): string {
  if (!to) return SITE_BASE_PATH;
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(to) ||
    to.startsWith("//") ||
    to.startsWith("#")
  ) {
    return to;
  }

  const [chemin, reste] = splitOnce(to, "?");
  const [base, hash] = splitOnce(reste ?? "", "#");
  const suffixe = (base ? `?${base}` : "") + (hash ? `#${hash}` : "");

  if (chemin === SITE_BASE_PATH || chemin === `${SITE_BASE_PATH}/`) {
    return `${SITE_BASE_PATH}${suffixe}`;
  }
  if (chemin.startsWith(`${SITE_BASE_PATH}/`)) {
    return `${chemin}${suffixe}`;
  }

  const normalise = chemin.startsWith("/") ? chemin : `/${chemin}`;
  const absolu =
    normalise === "/" ? SITE_BASE_PATH : `${SITE_BASE_PATH}${normalise}`;
  return `${absolu}${suffixe}`;
}

export function stripSiteBasePath(pathname: string): string {
  if (pathname === SITE_BASE_PATH || pathname === `${SITE_BASE_PATH}/`) {
    return "/";
  }
  if (pathname.startsWith(`${SITE_BASE_PATH}/`)) {
    return pathname.slice(SITE_BASE_PATH.length);
  }
  return pathname;
}

export function toSiteAbsoluteUrl(to: string): string {
  const path = toSitePath(to);
  return typeof window === "undefined"
    ? path
    : `${window.location.origin}${path}`;
}

function splitOnce(
  value: string,
  separateur: string
): [string, string | undefined] {
  const i = value.indexOf(separateur);
  return i === -1
    ? [value, undefined]
    : [value.slice(0, i), value.slice(i + 1)];
}

export function useSitePathname(): string {
  const pathname = usePathname() || "/site";
  return stripSiteBasePath(pathname);
}

export function useSiteRouter() {
  const router = useRouter();

  return {
    ...router,
    prefetch: (href: string, options?: any) => {
      router.prefetch(toSitePath(href), options);
    },
    push: (href: string, options?: any) => {
      router.push(toSitePath(href), options);
    },
    replace: (href: string, options?: any) => {
      router.replace(toSitePath(href), options);
    },
  };
}

export interface SiteLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>,
    Omit<NextLinkProps, "href"> {
  children?: ReactNode;
  href: string;
}

export function Link({ href, children, ...props }: SiteLinkProps) {
  const targetHref = toSitePath(href);
  return (
    <NextLink href={targetHref} {...props}>
      {children}
    </NextLink>
  );
}

export default Link;
