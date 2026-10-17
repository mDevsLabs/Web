// Le rendu du terminal utilise uniquement le pont local ; aucun module Node.
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { CliState, CliTerminalBridge } from "../cli-protocol";

declare global { interface Window { maiTerminal: CliTerminalBridge; } }

const terminal = new Terminal({
  cursorBlink: true, fontSize: 14, fontFamily: "Consolas, monospace",
  theme: { background: "#0a0a0a", foreground: "#ededed", cursor: "#ededed" },
});
const fit = new FitAddon();
terminal.loadAddon(fit);
const container = document.getElementById("terminal")!;
const status = document.getElementById("status")!;
const install = document.getElementById("install") as HTMLButtonElement;
const retry = document.getElementById("retry") as HTMLButtonElement;
const help = document.getElementById("help") as HTMLButtonElement;
terminal.open(container);
const bridge = window.maiTerminal;
function update(state: CliState) {
  status.textContent = state.error || (state.installing ? "Installation du CLI en cours…"
    : state.running ? "mAI CLI · terminal local"
    : state.maiInstalled && state.nodeInstalled ? "CLI détecté"
    : state.nodeInstalled && state.npmInstalled ? "CLI absent. Installez-le pour démarrer."
    : "Node.js et npm sont nécessaires. Installez-les puis relancez la détection.");
  install.hidden = state.running || state.maiInstalled || !state.nodeInstalled || !state.npmInstalled;
  install.disabled = state.installing;
  retry.hidden = state.running || state.installing;
  help.hidden = state.nodeInstalled && state.npmInstalled;
  if (state.running) { terminal.focus(); }
}
const disposeData = bridge.onData((data) => terminal.write(data));
const disposeState = bridge.onState(update);
terminal.onData((data) => bridge.write(data));
terminal.onResize(({ cols, rows }) => bridge.resize(cols, rows));
const observer = new ResizeObserver(() => { fit.fit(); });
observer.observe(container);
async function start() {
  try { update(await bridge.start()); fit.fit(); bridge.resize(terminal.cols, terminal.rows); }
  catch { status.textContent = "Impossible de démarrer le terminal. Fermez cette fenêtre puis réessayez."; }
}
install.addEventListener("click", () => {
  install.disabled = true;
  void bridge.install().then(update).catch(() => {
    status.textContent = "Impossible de lancer l'installation.";
    install.disabled = false;
  });
});
retry.addEventListener("click", () => { void start(); });
help.addEventListener("click", () => { void bridge.openHelp(); });
window.addEventListener("beforeunload", () => {
  disposeData(); disposeState(); observer.disconnect(); terminal.dispose();
});
void start();
