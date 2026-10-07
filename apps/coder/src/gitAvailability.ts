import type { TFunction } from "./i18n";

export type GitUnavailableReason = "none" | "missing" | "not_repo" | "error";

export function classifyGitUnavailableReason(
  error: string | null | undefined
): GitUnavailableReason {
  const text = String(error ?? "").trim();
  if (!text) {
    return "error";
  }
  if (/^Git is not installed$/i.test(text)) {
    return "missing";
  }
  if (/^Current workspace is not a Git repository$/i.test(text)) {
    return "not_repo";
  }
  return "error";
}

export function gitUnavailableCopy(
  t: TFunction,
  reason: Exclude<GitUnavailableReason, "none">
): { title: string; body: string } {
  switch (reason) {
    case "missing":
      return {
        body: t("app.gitMissingBody"),
        title: t("app.gitMissingTitle"),
      };
    case "not_repo":
      return {
        body: t("app.gitNotRepoBody"),
        title: t("app.gitNotRepoTitle"),
      };
    default:
      return {
        body: t("app.gitUnavailableBody"),
        title: t("app.gitUnavailableTitle"),
      };
  }
}

export function gitBranchTriggerTitle(
  t: TFunction,
  gitStatusOk: boolean,
  reason: GitUnavailableReason
): string {
  if (gitStatusOk) {
    return t("git.branchPicker.triggerTitle");
  }
  if (reason === "missing") {
    return t("git.branchPicker.gitMissing");
  }
  if (reason === "not_repo") {
    return t("git.branchPicker.notRepo");
  }
  return t("git.branchPicker.unavailable");
}
