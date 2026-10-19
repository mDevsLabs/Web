import { describe, expect, it } from "vitest";
import {
  extractRequestUserInputAnswers,
  normalizeRequestUserInputArgs,
} from "./requestUserInputTool.js";

describe("normalizeRequestUserInputArgs", () => {
  it("accepts up to three structured questions", () => {
    const out = normalizeRequestUserInputArgs({
      questions: [
        {
          header: "Scope",
          id: "scope",
          options: [
            {
              description: "Improve visuals and layout consistency first.",
              label: "UI polish",
            },
            {
              description: "Clean up structure before more features.",
              label: "Refactor",
            },
            {
              description: "Focus on speed and responsiveness first.",
              label: "Performance",
            },
          ],
          question: "Which area should I prioritize first?",
        },
        {
          header: "Constraints",
          id: "constraints",
          options: [
            {
              description: "Prefer the quickest shippable approach.",
              label: "Fastest path",
            },
            {
              description: "Favor safer, smaller changes.",
              label: "Lowest risk",
            },
          ],
          question: "What is the main delivery constraint?",
        },
      ],
    });

    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.questions).toHaveLength(2);
    expect(out.questions[0]?.options).toHaveLength(3);
    expect(out.questions[1]?.options).toHaveLength(2);
  });

  it("rejects invalid payloads without valid questions", () => {
    const out = normalizeRequestUserInputArgs({
      questions: [{ header: "", id: "broken", options: [], question: "" }],
    });

    expect(out.ok).toBe(false);
  });
});

describe("extractRequestUserInputAnswers", () => {
  it("extracts answer values from tool result json", () => {
    expect(
      extractRequestUserInputAnswers(
        JSON.stringify({
          answers: {
            constraints: "Lowest risk",
            scope: "UI polish",
          },
        })
      )
    ).toEqual(["Lowest risk", "UI polish"]);
  });
});
