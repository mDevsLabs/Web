import { describe, expect, it } from "vitest";
import { translateArgs } from "../../scripts/dev.mjs";

describe("scripts/dev.mjs - translateArgs", () => {
  it("retourne un tableau vide sans arguments", () => {
    expect(translateArgs([])).toEqual([]);
  });

  it("traduit --host seul en --hostname 0.0.0.0", () => {
    expect(translateArgs(["--host"])).toEqual(["--hostname", "0.0.0.0"]);
  });

  it("traduit --host avec une adresse IP explicite", () => {
    expect(translateArgs(["--host", "0.0.0.0"])).toEqual([
      "--hostname",
      "0.0.0.0",
    ]);
    expect(translateArgs(["--host", "192.168.1.42"])).toEqual([
      "--hostname",
      "192.168.1.42",
    ]);
  });

  it("traduit --host avec la syntaxe --host=<valeur>", () => {
    expect(translateArgs(["--host=0.0.0.0"])).toEqual([
      "--hostname",
      "0.0.0.0",
    ]);
    expect(translateArgs(["--host=10.0.0.1"])).toEqual([
      "--hostname",
      "10.0.0.1",
    ]);
    expect(translateArgs(["--host="])).toEqual(["--hostname", "0.0.0.0"]);
  });

  it("traduit --host lorsqu'il est suivi d'un autre drapeau", () => {
    expect(translateArgs(["--host", "-p", "3001"])).toEqual([
      "--hostname",
      "0.0.0.0",
      "-p",
      "3001",
    ]);
    expect(translateArgs(["--turbo", "--host"])).toEqual([
      "--turbo",
      "--hostname",
      "0.0.0.0",
    ]);
  });

  it("conserve les autres arguments tels quels", () => {
    expect(translateArgs(["-p", "3005", "--turbo"])).toEqual([
      "-p",
      "3005",
      "--turbo",
    ]);
    expect(translateArgs(["--hostname", "127.0.0.1"])).toEqual([
      "--hostname",
      "127.0.0.1",
    ]);
  });
});
