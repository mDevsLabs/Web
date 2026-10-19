import { describe, expect, it } from "vitest";
import {
  classifyGitUnavailableReason,
  gitBranchTriggerTitle,
  gitUnavailableCopy,
} from "./gitAvailability";
import { createTranslate } from "./i18n/createTranslate";

describe("gitAvailability", () => {
  const t = createTranslate("fr");

  it("classifies missing Git distinctly", () => {
    expect(classifyGitUnavailableReason("Git is not installed")).toBe(
      "missing"
    );
  });

  it("classifies non-repository workspaces distinctly", () => {
    expect(
      classifyGitUnavailableReason("Current workspace is not a Git repository")
    ).toBe("not_repo");
  });

  it("treats blank and unexpected errors as generic unavailable states", () => {
    expect(classifyGitUnavailableReason("")).toBe("error");
    expect(classifyGitUnavailableReason("Failed to load changes")).toBe(
      "error"
    );
  });

  it("returns missing-git copy that tells the user to install Git first", () => {
    expect(gitUnavailableCopy(t, "missing")).toEqual({
      body: t("app.gitMissingBody"),
      title: t("app.gitMissingTitle"),
    });
  });

  it("returns non-repo copy that explains how to enable source control", () => {
    expect(gitUnavailableCopy(t, "not_repo")).toEqual({
      body: t("app.gitNotRepoBody"),
      title: t("app.gitNotRepoTitle"),
    });
  });

  it("returns trigger titles that match the classified state", () => {
    expect(gitBranchTriggerTitle(t, true, "none")).toBe(
      t("git.branchPicker.triggerTitle")
    );
    expect(gitBranchTriggerTitle(t, false, "missing")).toBe(
      t("git.branchPicker.gitMissing")
    );
    expect(gitBranchTriggerTitle(t, false, "not_repo")).toBe(
      t("git.branchPicker.notRepo")
    );
    expect(gitBranchTriggerTitle(t, false, "error")).toBe(
      t("git.branchPicker.unavailable")
    );
  });
});
