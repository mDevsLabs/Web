import { describe, expect, it } from "vitest";
import {
  substituteSkillParams,
  validateSkillParams,
  withSkillDefaults,
} from "@/lib/ai/skill-params";

const parameters = [
  { name: "query", required: true, type: "string" },
  { defaultValue: "10", name: "limit", type: "integer" },
  { defaultValue: "false", name: "verbose", type: "boolean" },
  { enumValues: ["fast", "deep"], name: "mode", type: "enum" },
];

describe("Paramètres de Skill", () => {
  it("valide les champs obligatoires et les types", () => {
    expect(validateSkillParams(parameters, {})).toMatch(/query/);
    expect(
      validateSkillParams(parameters, {
        limit: "2.5",
        mode: "fast",
        query: "test",
      })
    ).toMatch(/entier/);
    expect(
      validateSkillParams(parameters, {
        mode: "invalid",
        query: "test",
      })
    ).toMatch(/valeurs proposées/);
  });

  it("applique les valeurs par défaut et les injecte dans les instructions", () => {
    const effective = withSkillDefaults(parameters, { query: "test" });
    expect(effective).toMatchObject({
      limit: "10",
      mode: "",
      query: "test",
      verbose: "false",
    });
    expect(substituteSkillParams("{{query}} / {{limit}}", effective)).toBe(
      "test / 10"
    );
  });
});
