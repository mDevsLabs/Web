import { describe, expect, it } from "vitest";
import { buildCompareUrl, parseGitRemoteUrl } from "./gitRemoteUrl";

describe("gitRemoteUrl", () => {
  it("parses GitHub HTTPS remotes without credentials or .git suffix", () => {
    expect(
      parseGitRemoteUrl("https://token@github.com/acme/widgets.git")
    ).toMatchObject({
      host: "github.com",
      owner: "acme",
      provider: "github",
      repo: "widgets",
      webUrl: "https://github.com/acme/widgets",
    });
  });

  it("parses SSH shorthand remotes", () => {
    expect(
      parseGitRemoteUrl("git@gitlab.com:acme/tools/widgets.git")
    ).toMatchObject({
      host: "gitlab.com",
      owner: "acme",
      provider: "gitlab",
      repo: "widgets",
      webUrl: "https://gitlab.com/acme/tools/widgets",
    });
  });

  it("builds provider-specific compare URLs", () => {
    expect(
      buildCompareUrl(
        "git@github.com:acme/widgets.git",
        "feature/panel",
        "main"
      )
    ).toBe(
      "https://github.com/acme/widgets/compare/main...feature%2Fpanel?expand=1"
    );
    expect(
      buildCompareUrl(
        "https://gitlab.com/acme/widgets.git",
        "feature/panel",
        "main"
      )
    ).toBe(
      "https://gitlab.com/acme/widgets/-/merge_requests/new?merge_request%5Bsource_branch%5D=feature%2Fpanel&merge_request%5Btarget_branch%5D=main"
    );
    expect(
      buildCompareUrl(
        "https://bitbucket.org/acme/widgets.git",
        "feature/panel",
        "main"
      )
    ).toBe(
      "https://bitbucket.org/acme/widgets/pull-requests/new?source=feature%2Fpanel&dest=main"
    );
  });

  it("defaults the base branch to main when remote HEAD is unknown", () => {
    expect(
      buildCompareUrl(
        "https://codeberg.org/acme/widgets.git",
        "feature/panel",
        ""
      )
    ).toBe("https://codeberg.org/acme/widgets/compare/main...feature%2Fpanel");
  });
});
