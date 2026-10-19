import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, "../src/styles/mac-codex.css");
let s = fs.readFileSync(p, "utf8");
const orig = s;

function pct(a) {
  return Math.round(Number.parseFloat(a) * 100);
}

function mixTok(tok, alpha) {
  return `color-mix(in srgb, var(${tok}) ${pct(alpha)}%, transparent)`;
}

s = s.replace(/rgba\(55,\s*214,\s*212,\s*([\d.]+)\)/g, (_, a) =>
  mixTok("--void-accent-cool", a)
);
s = s.replace(/rgba\(255,\s*157,\s*89,\s*([\d.]+)\)/g, (_, a) =>
  mixTok("--void-accent-warm", a)
);
s = s.replace(/rgba\(205,\s*217,\s*224,\s*([\d.]+)\)/g, (_, a) =>
  mixTok("--void-fg-0", a)
);

/** 深色投影条带（青 + 底） */
s = s.replace(
  /rgba\(8,\s*33,\s*36,\s*([\d.]+)\)/g,
  (_, a) =>
    `color-mix(in srgb, color-mix(in srgb, var(--void-accent-cool) 22%, var(--void-bg-0) 78%) ${pct(a)}%, transparent)`
);

s = s.replace(/rgba\(242,\s*244,\s*247,\s*([\d.]+)\)/g, (_, a) =>
  mixTok("--void-bg-1", a)
);

const bgMap = [
  [[19, 25, 31], "--void-bg-1"],
  [[18, 24, 31], "--void-bg-1"],
  [[18, 24, 30], "--void-bg-1"],
  [[18, 23, 29], "--void-bg-0"],
  [[18, 25, 31], "--void-bg-1"],
  [[17, 23, 28], "--void-bg-0"],
  [[16, 22, 28], "--void-bg-0"],
  [[16, 22, 27], "--void-bg-0"],
  [[15, 20, 26], "--void-bg-0"],
  [[15, 20, 25], "--void-bg-0"],
  [[14, 19, 24], "--void-bg-0"],
  [[14, 19, 25], "--void-bg-0"],
  [[13, 18, 23], "--void-bg-0"],
  [[13, 18, 24], "--void-bg-0"],
  [[12, 17, 22], "--void-bg-0"],
  [[12, 16, 21], "--void-bg-0"],
  [[11, 15, 19], "--void-bg-0"],
  [[20, 27, 33], "--void-bg-1"],
  [[21, 28, 34], "--void-bg-1"],
  [[21, 27, 33], "--void-bg-1"],
  [[21, 29, 36], "--void-bg-2"],
  [[22, 28, 35], "--void-bg-1"],
  [[22, 29, 35], "--void-bg-1"],
  [[22, 30, 36], "--void-bg-2"],
  [[22, 34, 46], "--void-bg-2"],
  [[23, 31, 38], "--void-bg-1"],
  [[23, 133, 141], "--void-accent-cool"],
  [[24, 31, 38], "--void-bg-2"],
  [[25, 33, 40], "--void-bg-2"],
  [[26, 33, 40], "--void-bg-2"],
  [[26, 34, 41], "--void-bg-2"],
  [[27, 35, 42], "--void-bg-2"],
  [[28, 36, 43], "--void-bg-2"],
  [[28, 37, 45], "--void-bg-3"],
  [[28, 37, 46], "--void-bg-2"],
  [[29, 37, 45], "--void-bg-3"],
  [[30, 39, 47], "--void-bg-3"],
  [[31, 40, 48], "--void-bg-2"],
  [[31, 42, 50], "--void-bg-3"],
  [[32, 41, 49], "--void-bg-2"],
  [[32, 41, 50], "--void-bg-3"],
  [[33, 42, 51], "--void-bg-3"],
  [[33, 44, 54], "--void-bg-3"],
  [[35, 45, 54], "--void-bg-3"],
  [[35, 45, 55], "--void-bg-3"],
  [[36, 68, 93], "--void-accent-assist"],
  [[39, 49, 59], "--void-bg-3"],
  [[41, 53, 63], "--void-bg-3"],
  [[4, 6, 9], "--void-bg-0"],
  [[5, 8, 12], "--void-bg-0"],
  [[6, 8, 12], "--void-bg-0"],
  [[7, 10, 16], "--void-bg-0"],
  [[8, 27, 31], "--void-bg-0"],
  [[10, 94, 99], "--void-accent-cool"],
  [[12, 95, 101], "--void-accent-cool"],
  [[14, 102, 109], "--void-accent-cool"],
  [[17, 113, 121], "--void-accent-cool"],
  [[18, 121, 129], "--void-accent-cool"],
  [[19, 26, 32], "--void-bg-1"],
  [[19, 114, 120], "--void-accent-cool"],
  [[19, 130, 135], "--void-accent-cool"],
  [[20, 27, 34], "--void-bg-1"],
  [[22, 29, 36], "--void-bg-1"],
  [[28, 39, 47], "--void-bg-2"],
  [[32, 41, 50], "--void-bg-3"],
  [[83, 95, 108], "--void-fg-3"],
  [[84, 97, 108], "--void-fg-3"],
  [[82, 95, 105], "--void-fg-3"],
  [[90, 104, 114], "--void-fg-3"],
  [[92, 106, 117], "--void-fg-3"],
  [[47, 184, 185], "--void-accent-cool"],
  [[41, 170, 173], "--void-accent-cool"],
  [[255, 177, 104], "--void-accent-warm"],
  [[222, 129, 59], "--void-accent-warm"],
  [[255, 121, 110], "--void-git-deleted"],
  [[202, 83, 85], "--void-git-deleted"],
  [[233, 146, 77], "--void-accent-warm"],
  [[224, 95, 98], "--void-git-deleted"],
  [[255, 173, 97], "--void-accent-warm"],
  [[150, 89, 42], "--void-accent-warm"],
  [[255, 163, 84], "--void-accent-warm"],
  [[128, 76, 32], "--void-accent-warm"],
  [[255, 122, 114], "--void-git-deleted"],
  [[130, 52, 61], "--void-git-deleted"],
  [[255, 126, 118], "--void-git-deleted"],
  [[118, 40, 48], "--void-git-deleted"],
  [[110, 160, 255], "--void-accent-assist"],
  [[75, 111, 214], "--void-accent-assist"],
  [[95, 138, 236], "--void-accent-assist"],
  [[118, 165, 255], "--void-accent-assist"],
  [[120, 164, 255], "--void-accent-assist"],
  [[62, 84, 165], "--void-accent-assist"],
  [[49, 74, 152], "--void-accent-assist"],
  [[18, 34, 51], "--void-accent-assist"],
];

for (const [rgb, tok] of bgMap) {
  const [r, g, b] = rgb;
  const re = new RegExp(`rgba\\(${r},\\s*${g},\\s*${b},\\s*([\\d.]+)\\)`, "g");
  s = s.replace(re, (_, a) => mixTok(tok, a));
}

s = s.replace(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/g, (_, a) =>
  mixTok("--void-fg-0", a)
);

s = s.replace(
  /rgba\(0,\s*0,\s*0,\s*([\d.]+)\)/g,
  (_, a) => `color-mix(in srgb, black ${pct(a)}%, transparent)`
);

const gitMap = [
  [[92, 217, 184], "--void-git-untracked"],
  [[112, 216, 157], "--void-git-added"],
  [[255, 157, 89], "--void-git-modified"],
  [[255, 123, 134], "--void-git-deleted"],
  [[90, 234, 231], "--void-accent-cool"],
  [[79, 212, 209], "--void-accent-cool"],
  [[58, 122, 147], "--void-accent-cool"],
];
for (const [rgb, tok] of gitMap) {
  const [r, g, b] = rgb;
  const re = new RegExp(`rgba\\(${r},\\s*${g},\\s*${b},\\s*([\\d.]+)\\)`, "g");
  s = s.replace(re, (_, a) => mixTok(tok, a));
}

fs.writeFileSync(p, s);
console.log("written", p, "bytes", orig.length, "->", s.length);
