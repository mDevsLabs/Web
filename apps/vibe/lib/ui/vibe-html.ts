/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — HTML GATEWAY (lib/ui/vibe-html.ts)
 * Serves the initial modern shell or redirects to Vite app
 * ============================================================================
 */

export function renderVibeHTML(): string {
  return `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe — Le Réseau Social avec Intelligence Artificielle mAI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
  </style>
</head>
<body class="bg-black text-white min-h-screen flex flex-col items-center justify-center p-6 antialiased selection:bg-white selection:text-black">
  <div class="max-w-xl w-full border border-zinc-800 rounded-3xl p-8 bg-zinc-950/80 backdrop-blur-xl shadow-2xl text-center space-y-6">
    <div class="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mx-auto font-black text-2xl tracking-tighter shadow-lg shadow-white/10">
      V
    </div>
    <div class="space-y-2">
      <h1 class="text-3xl font-extrabold tracking-tight">Vibe & mAI Ambient</h1>
      <p class="text-zinc-400 text-sm">Le réseau social nouvelle génération fusionné avec l'intelligence artificielle agentique.</p>
    </div>
    <div class="grid grid-cols-2 gap-3 text-left py-2">
      <div class="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <div class="text-xs text-zinc-400 font-medium">Timeline Hybride</div>
        <div class="text-sm font-semibold mt-0.5">Flux X & Smart Canvas</div>
      </div>
      <div class="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <div class="text-xs text-zinc-400 font-medium">Agent mAI Intégré</div>
        <div class="text-sm font-semibold mt-0.5">Tool Calling & Quotas</div>
      </div>
      <div class="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <div class="text-xs text-zinc-400 font-medium">Messagerie Directe</div>
        <div class="text-sm font-semibold mt-0.5">DMs & Dictée Vocale</div>
      </div>
      <div class="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <div class="text-xs text-zinc-400 font-medium">Design Épuré</div>
        <div class="text-sm font-semibold mt-0.5">Monochrome Minimaliste</div>
      </div>
    </div>
    <div class="pt-2 flex flex-col sm:flex-row gap-3">
      <a href="http://localhost:5173" class="flex-1 py-3 px-6 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all text-center">
        Ouvrir l'application Vibe (Vite)
      </a>
      <a href="/api/vibe/feed" class="py-3 px-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 transition-all text-center">
        API Endpoint
      </a>
    </div>
    <div class="text-xs text-zinc-600 font-mono">
      mAI Architecture • Powered by Val Town & Neon PostgreSQL
    </div>
  </div>
</body>
</html>`;
}
