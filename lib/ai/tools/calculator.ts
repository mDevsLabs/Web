import { tool } from "ai";
import { z } from "zod";

const SUPPORTED_FUNCTIONS = [
  "abs",
  "ceil",
  "cos",
  "cosh",
  "exp",
  "floor",
  "ln",
  "log10",
  "log2",
  "max",
  "min",
  "pow",
  "round",
  "sin",
  "sinh",
  "sqrt",
  "tan",
  "tanh",
  "trunc",
] as const;

const CONSTANTS: Record<string, number> = {
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  pi: Math.PI,
  tau: 2 * Math.PI,
};

type ConvertUnit = {
  aliases?: string[];
  factor?: number;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
};

type ConvertCategory = {
  base: string;
  units: Record<string, ConvertUnit>;
};

const CONVERSION_TABLES: Record<string, ConvertCategory> = {
  angle: {
    base: "radian",
    units: {
      degree: {
        fromBase: (v) => (v * 180) / Math.PI,
        toBase: (v) => (v * Math.PI) / 180,
      },
      gradian: {
        fromBase: (v) => (v * 200) / Math.PI,
        toBase: (v) => (v * Math.PI) / 200,
      },
      radian: {
        fromBase: (v) => v,
        toBase: (v) => v,
      },
      turn: {
        fromBase: (v) => v / (2 * Math.PI),
        toBase: (v) => v * 2 * Math.PI,
      },
    },
  },
  area: {
    base: "square_meter",
    units: {
      are: {
        aliases: ["a"],
        factor: 100,
        fromBase: (v) => v / 100,
        toBase: (v) => v * 100,
      },
      hectare: {
        aliases: ["ha"],
        factor: 10_000,
        fromBase: (v) => v / 10_000,
        toBase: (v) => v * 10_000,
      },
      square_centimeter: {
        aliases: ["cm2", "cm^2"],
        factor: 0.0001,
        fromBase: (v) => v / 0.0001,
        toBase: (v) => v * 0.0001,
      },
      square_foot: {
        aliases: ["ft2", "sqft"],
        factor: 0.092_903_04,
        fromBase: (v) => v / 0.092_903_04,
        toBase: (v) => v * 0.092_903_04,
      },
      square_inch: {
        aliases: ["in2", "sqin"],
        factor: 0.000_645_16,
        fromBase: (v) => v / 0.000_645_16,
        toBase: (v) => v * 0.000_645_16,
      },
      square_kilometer: {
        aliases: ["km2", "km^2"],
        factor: 1_000_000,
        fromBase: (v) => v / 1_000_000,
        toBase: (v) => v * 1_000_000,
      },
      square_meter: {
        aliases: ["m2", "m^2", "sqm"],
        fromBase: (v) => v,
        toBase: (v) => v,
      },
      square_mile: {
        aliases: ["mi2", "sqmi"],
        factor: 2_589_988.110_336,
        fromBase: (v) => v / 2_589_988.110_336,
        toBase: (v) => v * 2_589_988.110_336,
      },
      square_millimeter: {
        aliases: ["mm2", "mm^2"],
        factor: 0.000_001,
        fromBase: (v) => v / 0.000_001,
        toBase: (v) => v * 0.000_001,
      },
      square_yard: {
        aliases: ["yd2", "sqyd"],
        factor: 0.836_127_36,
        fromBase: (v) => v / 0.836_127_36,
        toBase: (v) => v * 0.836_127_36,
      },
    },
  },
  data: {
    base: "byte",
    units: {
      bit: {
        aliases: ["b"],
        factor: 0.125,
        fromBase: (v) => v / 0.125,
        toBase: (v) => v * 0.125,
      },
      byte: { aliases: ["B"], fromBase: (v) => v, toBase: (v) => v },
      gigabit: {
        aliases: ["Gb", "gbit"],
        factor: 125_000_000,
        fromBase: (v) => v / 125_000_000,
        toBase: (v) => v * 125_000_000,
      },
      gigabyte: {
        aliases: ["GB", "Go"],
        factor: 1_000_000_000,
        fromBase: (v) => v / 1_000_000_000,
        toBase: (v) => v * 1_000_000_000,
      },
      kilobit: {
        aliases: ["Kb", "kbit"],
        factor: 125,
        fromBase: (v) => v / 125,
        toBase: (v) => v * 125,
      },
      kilobyte: {
        aliases: ["KB", "ko"],
        factor: 1000,
        fromBase: (v) => v / 1000,
        toBase: (v) => v * 1000,
      },
      megabit: {
        aliases: ["Mb", "mbit"],
        factor: 125_000,
        fromBase: (v) => v / 125_000,
        toBase: (v) => v * 125_000,
      },
      megabyte: {
        aliases: ["MB", "Mo"],
        factor: 1_000_000,
        fromBase: (v) => v / 1_000_000,
        toBase: (v) => v * 1_000_000,
      },
      petabyte: {
        aliases: ["PB"],
        factor: 1_000_000_000_000_000,
        fromBase: (v) => v / 1_000_000_000_000_000,
        toBase: (v) => v * 1_000_000_000_000_000,
      },
      terabit: {
        aliases: ["Tb", "tbit"],
        factor: 125_000_000_000,
        fromBase: (v) => v / 125_000_000_000,
        toBase: (v) => v * 125_000_000_000,
      },
      terabyte: {
        aliases: ["TB", "To"],
        factor: 1_000_000_000_000,
        fromBase: (v) => v / 1_000_000_000_000,
        toBase: (v) => v * 1_000_000_000_000,
      },
    },
  },
  energy: {
    base: "joule",
    units: {
      calorie: {
        aliases: ["cal"],
        factor: 4.184,
        fromBase: (v) => v / 4.184,
        toBase: (v) => v * 4.184,
      },
      electronvolt: {
        aliases: ["eV"],
        factor: 1.602_176_634e-19,
        fromBase: (v) => v / 1.602_176_634e-19,
        toBase: (v) => v * 1.602_176_634e-19,
      },
      joule: { aliases: ["J"], fromBase: (v) => v, toBase: (v) => v },
      kilojoule: {
        aliases: ["kJ"],
        factor: 1000,
        fromBase: (v) => v / 1000,
        toBase: (v) => v * 1000,
      },
      kilowatt_hour: {
        aliases: ["kWh"],
        factor: 3_600_000,
        fromBase: (v) => v / 3_600_000,
        toBase: (v) => v * 3_600_000,
      },
      megajoule: {
        aliases: ["MJ"],
        factor: 1_000_000,
        fromBase: (v) => v / 1_000_000,
        toBase: (v) => v * 1_000_000,
      },
      watt_hour: {
        aliases: ["Wh"],
        factor: 3600,
        fromBase: (v) => v / 3600,
        toBase: (v) => v * 3600,
      },
    },
  },
  length: {
    base: "meter",
    units: {
      centimeter: {
        aliases: ["cm"],
        factor: 0.01,
        fromBase: (v) => v / 0.01,
        toBase: (v) => v * 0.01,
      },
      foot: {
        aliases: ["ft"],
        factor: 0.3048,
        fromBase: (v) => v / 0.3048,
        toBase: (v) => v * 0.3048,
      },
      inch: {
        aliases: ["in"],
        factor: 0.0254,
        fromBase: (v) => v / 0.0254,
        toBase: (v) => v * 0.0254,
      },
      kilometer: {
        aliases: ["km"],
        factor: 1000,
        fromBase: (v) => v / 1000,
        toBase: (v) => v * 1000,
      },
      meter: { aliases: ["m"], fromBase: (v) => v, toBase: (v) => v },
      mile: {
        aliases: ["mi"],
        factor: 1609.344,
        fromBase: (v) => v / 1609.344,
        toBase: (v) => v * 1609.344,
      },
      millimeter: {
        aliases: ["mm"],
        factor: 0.001,
        fromBase: (v) => v / 0.001,
        toBase: (v) => v * 0.001,
      },
      nautical_mile: {
        aliases: ["nmi"],
        factor: 1852,
        fromBase: (v) => v / 1852,
        toBase: (v) => v * 1852,
      },
      yard: {
        aliases: ["yd"],
        factor: 0.9144,
        fromBase: (v) => v / 0.9144,
        toBase: (v) => v * 0.9144,
      },
    },
  },
  mass: {
    base: "gram",
    units: {
      gram: { aliases: ["g"], fromBase: (v) => v, toBase: (v) => v },
      kilogram: {
        aliases: ["kg"],
        factor: 1000,
        fromBase: (v) => v / 1000,
        toBase: (v) => v * 1000,
      },
      microgram: {
        aliases: ["µg", "ug"],
        factor: 0.000_001,
        fromBase: (v) => v / 0.000_001,
        toBase: (v) => v * 0.000_001,
      },
      milligram: {
        aliases: ["mg"],
        factor: 0.001,
        fromBase: (v) => v / 0.001,
        toBase: (v) => v * 0.001,
      },
      ounce: {
        aliases: ["oz"],
        factor: 28.349_523_125,
        fromBase: (v) => v / 28.349_523_125,
        toBase: (v) => v * 28.349_523_125,
      },
      pound: {
        aliases: ["lb", "lbs"],
        factor: 453.592_37,
        fromBase: (v) => v / 453.592_37,
        toBase: (v) => v * 453.592_37,
      },
      stone: {
        aliases: ["st"],
        factor: 6350.293_18,
        fromBase: (v) => v / 6350.293_18,
        toBase: (v) => v * 6350.293_18,
      },
      ton: {
        aliases: ["t", "tonne"],
        factor: 1_000_000,
        fromBase: (v) => v / 1_000_000,
        toBase: (v) => v * 1_000_000,
      },
    },
  },
  pressure: {
    base: "pascal",
    units: {
      atmosphere: {
        aliases: ["atm"],
        factor: 101_325,
        fromBase: (v) => v / 101_325,
        toBase: (v) => v * 101_325,
      },
      bar: {
        factor: 100_000,
        fromBase: (v) => v / 100_000,
        toBase: (v) => v * 100_000,
      },
      hectopascal: {
        aliases: ["hPa", "mbar"],
        factor: 100,
        fromBase: (v) => v / 100,
        toBase: (v) => v * 100,
      },
      kilopascal: {
        aliases: ["kPa"],
        factor: 1000,
        fromBase: (v) => v / 1000,
        toBase: (v) => v * 1000,
      },
      millimeter_mercury: {
        aliases: ["mmHg", "Torr"],
        factor: 133.322_387_415,
        fromBase: (v) => v / 133.322_387_415,
        toBase: (v) => v * 133.322_387_415,
      },
      pascal: { aliases: ["Pa"], fromBase: (v) => v, toBase: (v) => v },
      psi: {
        factor: 6894.757_293_168,
        fromBase: (v) => v / 6894.757_293_168,
        toBase: (v) => v * 6894.757_293_168,
      },
    },
  },
  speed: {
    base: "meter_per_second",
    units: {
      kilometer_per_hour: {
        aliases: ["kmh", "km/h"],
        factor: 0.277_777_777_777_78,
        fromBase: (v) => v / 0.277_777_777_777_78,
        toBase: (v) => v * 0.277_777_777_777_78,
      },
      knot: {
        aliases: ["kn", "kt"],
        factor: 0.514_444_444_444_44,
        fromBase: (v) => v / 0.514_444_444_444_44,
        toBase: (v) => v * 0.514_444_444_444_44,
      },
      meter_per_second: {
        aliases: ["mps", "m/s"],
        fromBase: (v) => v,
        toBase: (v) => v,
      },
      mile_per_hour: {
        aliases: ["mph", "mi/h"],
        factor: 0.447_04,
        fromBase: (v) => v / 0.447_04,
        toBase: (v) => v * 0.447_04,
      },
    },
  },
  temperature: {
    base: "celsius",
    units: {
      celsius: {
        aliases: ["C", "°C", "degC"],
        fromBase: (v) => v,
        toBase: (v) => v,
      },
      fahrenheit: {
        aliases: ["F", "°F", "degF"],
        fromBase: (v) => (v * 9) / 5 + 32,
        toBase: (v) => ((v - 32) * 5) / 9,
      },
      kelvin: {
        aliases: ["K"],
        fromBase: (v) => v + 273.15,
        toBase: (v) => v - 273.15,
      },
    },
  },
  time: {
    base: "second",
    units: {
      day: {
        aliases: ["d", "jour", "jours"],
        factor: 86_400,
        fromBase: (v) => v / 86_400,
        toBase: (v) => v * 86_400,
      },
      hour: {
        aliases: ["h", "heure", "heures"],
        factor: 3600,
        fromBase: (v) => v / 3600,
        toBase: (v) => v * 3600,
      },
      microsecond: {
        aliases: ["µs", "us"],
        factor: 0.000_001,
        fromBase: (v) => v / 0.000_001,
        toBase: (v) => v * 0.000_001,
      },
      millisecond: {
        aliases: ["ms"],
        factor: 0.001,
        fromBase: (v) => v / 0.001,
        toBase: (v) => v * 0.001,
      },
      minute: {
        aliases: ["min"],
        factor: 60,
        fromBase: (v) => v / 60,
        toBase: (v) => v * 60,
      },
      second: { aliases: ["s", "sec"], fromBase: (v) => v, toBase: (v) => v },
      week: {
        aliases: ["w", "semaine", "semaines"],
        factor: 604_800,
        fromBase: (v) => v / 604_800,
        toBase: (v) => v * 604_800,
      },
      year: {
        aliases: ["y", "yr", "année", "annee", "années"],
        factor: 31_536_000,
        fromBase: (v) => v / 31_536_000,
        toBase: (v) => v * 31_536_000,
      },
    },
  },
  volume: {
    base: "liter",
    units: {
      centiliter: {
        aliases: ["cl"],
        factor: 0.01,
        fromBase: (v) => v / 0.01,
        toBase: (v) => v * 0.01,
      },
      cubic_meter: {
        aliases: ["m3", "m^3"],
        factor: 1000,
        fromBase: (v) => v / 1000,
        toBase: (v) => v * 1000,
      },
      cup: { factor: 0.24, fromBase: (v) => v / 0.24, toBase: (v) => v * 0.24 },
      deciliter: {
        aliases: ["dl"],
        factor: 0.1,
        fromBase: (v) => v / 0.1,
        toBase: (v) => v * 0.1,
      },
      fluid_ounce: {
        aliases: ["fl_oz", "floz"],
        factor: 0.029_573_5,
        fromBase: (v) => v / 0.029_573_5,
        toBase: (v) => v * 0.029_573_5,
      },
      gallon: {
        aliases: ["gal"],
        factor: 3.785_411_784,
        fromBase: (v) => v / 3.785_411_784,
        toBase: (v) => v * 3.785_411_784,
      },
      liter: {
        aliases: ["l", "L", "litre", "litres"],
        fromBase: (v) => v,
        toBase: (v) => v,
      },
      milliliter: {
        aliases: ["ml", "mL"],
        factor: 0.001,
        fromBase: (v) => v / 0.001,
        toBase: (v) => v * 0.001,
      },
      pint: {
        factor: 0.473_176_473,
        fromBase: (v) => v / 0.473_176_473,
        toBase: (v) => v * 0.473_176_473,
      },
      quart: {
        factor: 0.946_352_946,
        fromBase: (v) => v / 0.946_352_946,
        toBase: (v) => v * 0.946_352_946,
      },
      tablespoon: {
        aliases: ["tbsp"],
        factor: 0.014_786_76,
        fromBase: (v) => v / 0.014_786_76,
        toBase: (v) => v * 0.014_786_76,
      },
      teaspoon: {
        aliases: ["tsp"],
        factor: 0.004_928_92,
        fromBase: (v) => v / 0.004_928_92,
        toBase: (v) => v * 0.004_928_92,
      },
    },
  },
};

function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/\s+/g, "_");
}

function findUnit(category: string, name: string): ConvertUnit | null {
  const cat = CONVERSION_TABLES[category];
  if (!cat) {
    return null;
  }
  const normalized = normalizeUnit(name);
  if (cat.units[normalized]) {
    return cat.units[normalized];
  }
  for (const [key, unit] of Object.entries(cat.units)) {
    if (unit.aliases?.map((a) => normalizeUnit(a)).includes(normalized)) {
      return unit;
    }
    if (key === normalized) {
      return unit;
    }
  }
  return null;
}

function findUnitKey(category: string, name: string): string | null {
  const cat = CONVERSION_TABLES[category];
  if (!cat) {
    return null;
  }
  const normalized = normalizeUnit(name);
  if (cat.units[normalized]) {
    return normalized;
  }
  for (const [key, unit] of Object.entries(cat.units)) {
    if (unit.aliases?.map((a) => normalizeUnit(a)).includes(normalized)) {
      return key;
    }
  }
  return null;
}

function convert(category: string, value: number, from: string, to: string) {
  const fromUnit = findUnit(category, from);
  const toUnit = findUnit(category, to);
  const fromKey = findUnitKey(category, from);
  const toKey = findUnitKey(category, to);
  if (!fromUnit || !toUnit || !fromKey || !toKey) {
    return null;
  }
  const baseValue = fromUnit.toBase(value);
  const result = toUnit.fromBase(baseValue);
  return {
    category,
    from: fromKey,
    result,
    to: toKey,
    value,
  };
}

const MAX_EXPR_LENGTH = 1000;

/**
 * Évaluateur d'expressions mathématiques pur (Descente Récursive).
 * N'utilise JAMAIS eval() ou new Function() pour une sécurité absolue contre les RCE.
 */
class SafeMathEvaluator {
  private pos = 0;
  private expr = "";

  constructor(expression: string) {
    this.expr = expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/\bmod\b/gi, "%");
  }

  private peek(): string {
    while (this.pos < this.expr.length && /\s/.test(this.expr[this.pos])) {
      this.pos++;
    }
    return this.pos < this.expr.length ? this.expr[this.pos] : "";
  }

  private get(): string {
    const ch = this.peek();
    if (ch) this.pos++;
    return ch;
  }

  public evaluate(): number {
    const res = this.parseExpression();
    if (this.peek() !== "") {
      throw new Error(`Caractère inattendu : "${this.peek()}"`);
    }
    return res;
  }

  private parseExpression(): number {
    let val = this.parseTerm();
    while (true) {
      const op = this.peek();
      if (op === "+" || op === "-") {
        this.get();
        const next = this.parseTerm();
        val = op === "+" ? val + next : val - next;
      } else {
        break;
      }
    }
    return val;
  }

  private parseTerm(): number {
    let val = this.parsePower();
    while (true) {
      const op = this.peek();
      if (op === "*" || op === "/" || op === "%") {
        this.get();
        const next = this.parsePower();
        if ((op === "/" || op === "%") && next === 0) {
          throw new Error("Division par zéro");
        }
        val = op === "*" ? val * next : op === "/" ? val / next : val % next;
      } else {
        break;
      }
    }
    return val;
  }

  private parsePower(): number {
    const base = this.parseFactor();
    if (
      this.peek() === "^" ||
      (this.expr[this.pos] === "*" && this.expr[this.pos + 1] === "*")
    ) {
      if (this.peek() === "^") {
        this.get();
      } else {
        this.get();
        this.get();
      }
      const exp = this.parsePower(); // associatif à droite
      return base ** exp;
    }
    return base;
  }

  private parseFactor(): number {
    const op = this.peek();
    if (op === "+") {
      this.get();
      return this.parseFactor();
    }
    if (op === "-") {
      this.get();
      return -this.parseFactor();
    }

    if (op === "(") {
      this.get();
      const val = this.parseExpression();
      if (this.peek() !== ")") {
        throw new Error("Parenthèse fermante ')' manquante");
      }
      this.get();
      return val;
    }

    // Nombre ou constante ou fonction
    if (/[0-9.]/.test(op)) {
      return this.parseNumber();
    }

    if (/[a-zA-Z_]/.test(op)) {
      return this.parseIdentifierOrFunction();
    }

    throw new Error(`Symbole invalide : "${op || "Fin de l'expression"}"`);
  }

  private parseNumber(): number {
    const start = this.pos;
    while (this.pos < this.expr.length && /[0-9.]/.test(this.expr[this.pos])) {
      this.pos++;
    }
    // Notation scientifique 1e-5
    if (this.pos < this.expr.length && /[eE]/.test(this.expr[this.pos])) {
      this.pos++;
      if (this.pos < this.expr.length && /[+-]/.test(this.expr[this.pos])) {
        this.pos++;
      }
      while (this.pos < this.expr.length && /[0-9]/.test(this.expr[this.pos])) {
        this.pos++;
      }
    }
    const numStr = this.expr.slice(start, this.pos);
    const num = Number(numStr);
    if (Number.isNaN(num)) {
      throw new Error(`Nombre invalide : "${numStr}"`);
    }
    return num;
  }

  private parseIdentifierOrFunction(): number {
    const start = this.pos;
    while (
      this.pos < this.expr.length &&
      /[a-zA-Z0-9_]/.test(this.expr[this.pos])
    ) {
      this.pos++;
    }
    const name = this.expr.slice(start, this.pos).toLowerCase();

    // Constantes
    if (name === "pi" || name === "π") return Math.PI;
    if (name === "e") return Math.E;
    if (name === "ln2") return Math.LN2;
    if (name === "ln10") return Math.LN10;
    if (name === "sqrt2") return Math.SQRT2;

    // Appel de fonction
    if (this.peek() === "(") {
      this.get();
      const args: number[] = [];
      if (this.peek() !== ")") {
        while (true) {
          args.push(this.parseExpression());
          if (this.peek() === ",") {
            this.get();
          } else {
            break;
          }
        }
      }
      if (this.peek() !== ")") {
        throw new Error(
          `Parenthèse fermante ')' manquante après l'appel de "${name}"`
        );
      }
      this.get();

      switch (name) {
        case "sqrt":
          if (args.length !== 1) throw new Error("sqrt attend 1 argument");
          if (args[0] < 0) throw new Error("sqrt d'un nombre négatif");
          return Math.sqrt(args[0]);
        case "abs":
          if (args.length !== 1) throw new Error("abs attend 1 argument");
          return Math.abs(args[0]);
        case "sin":
          if (args.length !== 1) throw new Error("sin attend 1 argument");
          return Math.sin(args[0]);
        case "cos":
          if (args.length !== 1) throw new Error("cos attend 1 argument");
          return Math.cos(args[0]);
        case "tan":
          if (args.length !== 1) throw new Error("tan attend 1 argument");
          return Math.tan(args[0]);
        case "asin":
          if (args.length !== 1) throw new Error("asin attend 1 argument");
          return Math.asin(args[0]);
        case "acos":
          if (args.length !== 1) throw new Error("acos attend 1 argument");
          return Math.acos(args[0]);
        case "atan":
          if (args.length !== 1) throw new Error("atan attend 1 argument");
          return Math.atan(args[0]);
        case "exp":
          if (args.length !== 1) throw new Error("exp attend 1 argument");
          return Math.exp(args[0]);
        case "ln":
        case "log":
          if (args.length !== 1) throw new Error("ln attend 1 argument");
          if (args[0] <= 0) throw new Error("ln d'un nombre négatif ou nul");
          return Math.log(args[0]);
        case "log10":
          if (args.length !== 1) throw new Error("log10 attend 1 argument");
          if (args[0] <= 0) throw new Error("log10 d'un nombre négatif ou nul");
          return Math.log10(args[0]);
        case "log2":
          if (args.length !== 1) throw new Error("log2 attend 1 argument");
          if (args[0] <= 0) throw new Error("log2 d'un nombre négatif ou nul");
          return Math.log2(args[0]);
        case "ceil":
          if (args.length !== 1) throw new Error("ceil attend 1 argument");
          return Math.ceil(args[0]);
        case "floor":
          if (args.length !== 1) throw new Error("floor attend 1 argument");
          return Math.floor(args[0]);
        case "round":
          if (args.length !== 1) throw new Error("round attend 1 argument");
          return Math.round(args[0]);
        case "trunc":
          if (args.length !== 1) throw new Error("trunc attend 1 argument");
          return Math.trunc(args[0]);
        case "min":
          if (args.length === 0)
            throw new Error("min attend au moins 1 argument");
          return Math.min(...args);
        case "max":
          if (args.length === 0)
            throw new Error("max attend au moins 1 argument");
          return Math.max(...args);
        case "pow":
          if (args.length !== 2) throw new Error("pow attend 2 arguments");
          return args[0] ** args[1];
        default:
          throw new Error(
            `Fonction mathématique inconnue ou non supportée : "${name}"`
          );
      }
    }

    throw new Error(`Identifiant mathématique inconnu : "${name}"`);
  }
}

function safeEvalExpression(expression: string): {
  error?: string;
  result?: number;
  formatted?: string;
} {
  const expr = expression.trim();
  if (!expr) {
    return { error: "Expression vide" };
  }
  if (expr.length > MAX_EXPR_LENGTH) {
    return {
      error: `Expression trop longue (max ${MAX_EXPR_LENGTH} caractères)`,
    };
  }

  let result: number;
  try {
    const evaluator = new SafeMathEvaluator(expr);
    result = evaluator.evaluate();
  } catch (e: any) {
    return { error: `Erreur d'évaluation : ${e?.message || "inconnue"}` };
  }

  if (typeof result !== "number" || Number.isNaN(result)) {
    return { error: "Résultat non numérique (NaN)" };
  }
  if (!Number.isFinite(result)) {
    return { error: "Résultat infini" };
  }

  return {
    formatted: formatNumber(result),
    result,
  };
}

function formatNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e16) {
    return n.toString();
  }
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-6 || abs >= 1e16)) {
    return n.toExponential(10).replace(/\.?0+e/, "e");
  }
  return Number(n.toPrecision(15)).toString();
}

export const calculator = tool({
  description:
    "Effectuer des calculs mathématiques précis (arithmétique, fonctions trigonométriques, logarithmes, puissances, racines, factorielles via max/min, etc.) OU convertir des unités entre systèmes (longueur, masse, température, temps, volume, données, énergie, pression, vitesse, surface, angle). Supporte les constantes pi, e, tau, phi.",
  execute: async (input) => {
    if (
      input.operation === "convert" &&
      input.category &&
      input.value !== undefined &&
      input.fromUnit !== undefined &&
      input.toUnit !== undefined
    ) {
      const value = Number(input.value);
      if (!Number.isFinite(value)) {
        return { error: "La valeur à convertir est invalide." };
      }
      const result = convert(
        input.category,
        value,
        String(input.fromUnit),
        String(input.toUnit)
      );
      if (!result) {
        return {
          availableUnits: Object.keys(
            CONVERSION_TABLES[input.category]?.units ?? {}
          ),
          error: `Conversion impossible. Unité inconnue. Catégorie : ${input.category}. Unités disponibles listées ci-dessus.`,
        };
      }
      return {
        ...result,
        formatted: `${formatNumber(value)} ${result.from} = ${formatNumber(result.result)} ${result.to}`,
      };
    }

    if (
      input.operation === "evaluate" &&
      typeof input.expression === "string"
    ) {
      const result = safeEvalExpression(input.expression);
      return {
        explanation:
          result.result === undefined
            ? undefined
            : `Résultat du calcul : ${result.formatted}`,
        expression: input.expression,
        ...result,
      };
    }

    if (input.operation === "list_units" && input.category) {
      const cat = CONVERSION_TABLES[input.category];
      if (!cat) {
        return {
          availableCategories: Object.keys(CONVERSION_TABLES),
          error: `Catégorie inconnue : ${input.category}. Catégories disponibles listées ci-dessus.`,
        };
      }
      return {
        category: input.category,
        units: Object.entries(cat.units).map(([key, unit]) => ({
          aliases: unit.aliases ?? [],
          key,
        })),
      };
    }

    if (input.operation === "list_categories") {
      return {
        categories: Object.keys(CONVERSION_TABLES),
        constants: Object.keys(CONSTANTS),
        supportedFunctions: SUPPORTED_FUNCTIONS,
      };
    }

    if (
      input.operation === "convert_temperature" &&
      input.value !== undefined
    ) {
      const from = String(input.fromUnit).toLowerCase();
      const to = String(input.toUnit).toLowerCase();
      const result = convert("temperature", Number(input.value), from, to);
      if (!result) {
        return {
          error:
            "Unités de température invalides. Utilisez celsius, fahrenheit ou kelvin.",
        };
      }
      return {
        ...result,
        formatted: `${formatNumber(Number(input.value))} ${result.from} = ${formatNumber(result.result)} ${result.to}`,
      };
    }

    if (input.operation === "percentage" && input.percentage !== undefined) {
      const pct = Number(input.percentage);
      const base = Number(input.base ?? 0);
      if (!Number.isFinite(pct) || !Number.isFinite(base)) {
        return { error: "Pourcentage ou base invalide." };
      }
      const op = input.mode ?? "of";
      let result: number;
      let description: string;
      if (op === "of") {
        result = (pct / 100) * base;
        description = `${pct}% de ${base} = ${formatNumber(result)}`;
      } else if (op === "change") {
        result = base * (1 + pct / 100);
        description = `${base} + ${pct}% = ${formatNumber(result)}`;
      } else {
        result = ((base - pct) / pct) * 100;
        description = `Variation de ${pct} à ${base} = ${formatNumber(result)}%`;
      }
      return { description, formatted: description, result };
    }

    if (input.operation === "percentage") {
      return {
        error: "Fournissez un pourcentage (et optionnellement une base).",
      };
    }

    return {
      error:
        "Opération invalide. Spécifiez operation='evaluate' avec expression, ou operation='convert' avec category/value/fromUnit/toUnit.",
    };
  },
  inputSchema: z.object({
    base: z
      .number()
      .optional()
      .describe("Valeur de base (pour percentage, défaut 0)"),
    category: z
      .enum([
        "angle",
        "area",
        "data",
        "energy",
        "length",
        "mass",
        "pressure",
        "speed",
        "temperature",
        "time",
        "volume",
      ])
      .optional()
      .describe("Catégorie de conversion"),
    expression: z
      .string()
      .min(1)
      .max(MAX_EXPR_LENGTH)
      .optional()
      .describe(
        "Expression mathématique à évaluer (ex: '2*pi*5', 'sqrt(16)+3', 'log10(100)')"
      ),
    fromUnit: z
      .string()
      .min(1)
      .max(20)
      .optional()
      .describe("Unité source (ex: 'km', 'celsius', 'GB')"),
    mode: z
      .enum(["of", "change", "delta"])
      .optional()
      .describe(
        "Mode pourcentage : 'of' (X% de Y), 'change' (Y + X%), 'delta' (variation de X à Y)"
      ),
    operation: z
      .enum([
        "evaluate",
        "convert",
        "convert_temperature",
        "list_units",
        "list_categories",
        "percentage",
      ])
      .describe("Opération à effectuer"),
    percentage: z
      .number()
      .optional()
      .describe("Valeur du pourcentage (pour operation='percentage')"),
    toUnit: z
      .string()
      .min(1)
      .max(20)
      .optional()
      .describe("Unité cible (ex: 'miles', 'fahrenheit', 'TB')"),
    value: z
      .number()
      .optional()
      .describe(
        "Valeur à convertir (utilisée avec convert/convert_temperature)"
      ),
  }),
});
