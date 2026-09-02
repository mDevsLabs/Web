import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  description:
    "mAI Web — Votre assistant d'intelligence artificielle tout-en-un.",
  icons: {
    apple: [{ type: "image/png", url: "/logo.png" }],
    icon: [{ type: "image/png", url: "/logo.png" }],
    shortcut: { type: "image/png", url: "/logo.png" },
  },
  metadataBase: new URL("https://mai.val.run"),
  openGraph: {
    description:
      "mAI Web — Votre assistant d'intelligence artificielle tout-en-un.",
    images: [
      {
        alt: "mAI Web Logo",
        height: 512,
        url: "/logo.png",
        width: 512,
      },
    ],
    locale: "fr_FR",
    siteName: "mAI Web",
    title: "mAI Web",
    type: "website",
  },
  title: {
    default: "mAI Web",
    template: "%s | mAI Web",
  },
  twitter: {
    card: "summary",
    description:
      "mAI Web — Votre assistant d'intelligence artificielle tout-en-un.",
    images: ["/logo.png"],
    title: "mAI Web",
  },
};

export const viewport = {
  initialScale: 1,
  interactiveWidget: "resizes-visual",
  maximumScale: 5,
  viewportFit: "cover",
  width: "device-width",
};

const fontSans = Plus_Jakarta_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${fontSans.variable} ${fontMono.variable} font-sans`}
      lang="fr"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <SessionProvider
            basePath={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`}
          >
            <TooltipProvider>{children}</TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
