import { describe, expect, it } from "vitest";
import {
  AUTO_REPLY_LANGUAGE_RULE_ID,
  buildAutoReplyLanguageRuleBlock,
  createAutoReplyLanguageRule,
} from "../../src/autoReplyLanguageRule.js";

describe("autoReplyLanguageRule", () => {
  it("suit la langue principale du prompt utilisateur (fr par défaut)", () => {
    const rule = createAutoReplyLanguageRule("fr", "fr" as unknown as string);
    expect(rule.id).toBe(AUTO_REPLY_LANGUAGE_RULE_ID);
    expect(rule.scope).toBe("always");
    expect(rule.enabled).toBe(true);
    expect(rule.name).toBe("Langue : suivre le prompt utilisateur");
    expect(rule.content).toContain("langue principale du prompt utilisateur");
    expect(rule.content).toContain("réponse finale");
    expect(rule.content).toContain("thinking");
    expect(rule.content).toContain("TaskCreate");
    expect(rule.content).toContain("TaskUpdate");
    expect(rule.content).toContain("ask_plan_question");
    expect(rule.content).toContain("commentaires dans le code");
    expect(rule.content).toContain("chemins de fichiers");
    expect(rule.content).toContain("identifiants");
    expect(rule.content).toContain("français par défaut");
  });

  it("block enveloppe la règle avec un header Markdown", () => {
    const block = buildAutoReplyLanguageRuleBlock(
      "fr",
      "fr" as unknown as string
    );
    expect(block).toContain("#### Rule: Langue : suivre le prompt utilisateur");
    expect(block).toContain("TaskCreate");
    expect(block).toContain("chemins de fichiers");
  });

  it("ignore les anciens paramètres locale/uiLocale (compat ascendante)", () => {
    const ruleEn = createAutoReplyLanguageRule("en", "en" as unknown as string);
    const ruleZh = createAutoReplyLanguageRule(
      "zh-CN",
      "zh-CN" as unknown as string
    );
    expect(ruleEn.name).toBe("Langue : suivre le prompt utilisateur");
    expect(ruleZh.name).toBe("Langue : suivre le prompt utilisateur");
    expect(ruleEn.content).toContain("langue principale du prompt utilisateur");
    expect(ruleZh.content).toContain("langue principale du prompt utilisateur");
  });
});
