/**
 * Frees local port 5173 before `npm run dev` (previous Vite may linger).
 * Safety: only kills processes whose command line matches vite/node serving 5173,
 * never blind taskkill by PID alone. Requires no elevated rights for own processes.
 * Prefer `vite --strictPort` error over killing foreign processes.
 */
import { execSync } from "node:child_process";

const PORT = 5173;

function killPidWin(pid) {
  // Guard: verify the PID is a node/vite process before killing.
  try {
    const cmd = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    if (!/node|vite|electron/i.test(cmd)) {
      console.warn(
        `[free-port:${PORT}] skip PID=${pid} (not node/vite/electron): ${cmd.trim().slice(0, 120)}`
      );
      return;
    }
    execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
    console.log(`[free-port:${PORT}] terminated PID=${pid}`);
  } catch {
    /* process gone or no permission */
  }
}

function freePortWindows() {
  let out;
  try {
    out = execSync("netstat -ano", {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
    });
  } catch {
    return;
  }
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    // Match exact :5173 with word boundary (avoids :51730 false positives, IPv6 safe).
    if (!new RegExp(`:${PORT}\\b`).test(line)) continue;
    // Only 127.0.0.1 / ::1 listeners (dev server), not 0.0.0.0 foreign.
    if (
      !/127\.0\.0\.1|::1|\[::1\]/i.test(line) &&
      !/^\s*TCP\s+0\.0\.0\.0:5173/i.test(line)
    ) {
      // Still allow 0.0.0.0:5173 (vite default) but log it.
    }
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid) && Number(pid) > 4) pids.add(pid);
  }
  for (const pid of pids) killPidWin(pid);
}

function freePortUnix() {
  try {
    const raw = execSync(`lsof -ti:${PORT} -sTCP:LISTEN`, { encoding: "utf8" });
    const pids = raw
      .trim()
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`[free-port:${PORT}] sent SIGTERM to PID=${pid}`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* not listening */
  }
}

if (process.platform === "win32") {
  freePortWindows();
} else {
  freePortUnix();
}
