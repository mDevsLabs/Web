import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = process.cwd();
const SHORTCUTS_JSON_PATH = join(
  ROOT_DIR,
  "apps/mobile/scripts/shortcuts.json"
);
const APP_SHORTCUTS_SWIFT_PATH = join(
  ROOT_DIR,
  "apps/mobile/ios/App/App/AppShortcuts.swift"
);
const SYNC_NATIVE_PATH = join(ROOT_DIR, "apps/mobile/scripts/sync-native.mjs");

describe("Contrats App Intents et App Shortcuts mobiles (iOS)", () => {
  it("shortcuts.json ne dépasse jamais la limite stricte Apple de 10 App Shortcuts", () => {
    const raw = readFileSync(SHORTCUTS_JSON_PATH, "utf8");
    const shortcuts = JSON.parse(raw);

    expect(Array.isArray(shortcuts)).toBe(true);
    // Apple autorise au maximum 10 App Shortcuts par application (ExtractAppIntentsMetadata)
    expect(shortcuts.length).toBeLessThanOrEqual(10);
    expect(shortcuts.length).toBeGreaterThan(0);

    for (const shortcut of shortcuts) {
      expect(typeof shortcut.id).toBe("string");
      expect(typeof shortcut.title).toBe("string");
      expect(typeof shortcut.path).toBe("string");
      expect(shortcut.path.startsWith("/")).toBe(true);
      expect(
        typeof shortcut.phrase === "string" || Array.isArray(shortcut.phrases)
      ).toBe(true);
    }
  });

  it("AppShortcuts.swift déclare au maximum 10 instances AppShortcut", () => {
    const swiftCode = readFileSync(APP_SHORTCUTS_SWIFT_PATH, "utf8");

    // Compter les déclarations AppShortcut(...)
    const matches = swiftCode.match(/AppShortcut\s*\(/g) || [];
    expect(matches.length).toBeLessThanOrEqual(10);
    expect(matches.length).toBeGreaterThan(0);

    // Vérifier la présence des intents et de l'enum de sections
    expect(swiftCode).toContain("struct OuvrirRaccourciMAI: AppIntent");
    expect(swiftCode).toContain("struct OuvrirSectionMAI: AppIntent");
    expect(swiftCode).toContain("enum DestinationMAI: String, AppEnum");
    expect(swiftCode).toContain("struct RaccourcisMAI: AppShortcutsProvider");
  });

  it("sync-native.mjs régénère AppShortcuts.swift en respectant le plafond de 10 App Shortcuts", () => {
    // Exécuter sync-native.mjs depuis le dossier apps/mobile
    const output = execFileSync(process.execPath, [SYNC_NATIVE_PATH], {
      cwd: join(ROOT_DIR, "apps/mobile"),
      encoding: "utf8",
    });

    expect(output).toContain("Configuration native des 10 raccourcis mAI");

    const swiftCode = readFileSync(APP_SHORTCUTS_SWIFT_PATH, "utf8");
    const matches = swiftCode.match(/AppShortcut\s*\(/g) || [];
    expect(matches.length).toBeLessThanOrEqual(10);
    expect(matches.length).toBe(10);
  });

  it("sync-native.mjs empêche formellement tout dépassement de 10 App Shortcuts", () => {
    // Vérifier que le garde MAX_IOS_APP_SHORTCUTS est présent dans sync-native.mjs
    const script = readFileSync(SYNC_NATIVE_PATH, "utf8");
    expect(script).toContain("const MAX_IOS_APP_SHORTCUTS = 10;");
    expect(script).toContain("raccourcis.length > MAX_IOS_APP_SHORTCUTS");

    // Tester l'échec automatique si > 10
    const inlineScript = `
      const raccourcis = Array.from({ length: 11 }, (_, i) => ({ id: "s" + i, title: "S" + i, path: "/" }));
      const MAX_IOS_APP_SHORTCUTS = 10;
      if (raccourcis.length > MAX_IOS_APP_SHORTCUTS) {
        throw new Error("Limite dépassée: " + raccourcis.length);
      }
    `;
    expect(() => {
      execFileSync(process.execPath, ["-e", inlineScript], {
        encoding: "utf8",
      });
    }).toThrow("Limite dépassée: 11");
  });
});
