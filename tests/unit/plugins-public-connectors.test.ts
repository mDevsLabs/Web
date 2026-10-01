import { afterEach, describe, expect, it, vi } from "vitest";
import { getEurostatData } from "@/lib/plugins/eurostat";
import {
  getGitlabProjectSummary,
  readGitlabFile,
} from "@/lib/plugins/gitlab-public";
import { getOpenAlexWork, searchOpenAlexWorks } from "@/lib/plugins/openalex";
import { fetchPublicJson } from "@/lib/plugins/shared/public-api";
import {
  getWikidataEntity,
  searchWikidataEntities,
} from "@/lib/plugins/wikidata";

const TOOL_CALL_OPTIONS = {
  abortSignal: new AbortController().signal,
  context: {},
  messages: [],
  toolCallId: "test-call",
} as const;

type ExecutableTool = {
  execute?: (input: never, options: never) => unknown;
};

async function runTool<TInput>(
  tool: unknown,
  input: TInput
): Promise<Record<string, unknown>> {
  const execute = (tool as ExecutableTool).execute;
  expect(execute).toBeTypeOf("function");
  return (await execute?.(
    input as never,
    TOOL_CALL_OPTIONS as never
  )) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Connecteurs publics du lot Plugins", () => {
  it("autorise uniquement les quatre sources HTTPS ajoutées", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    for (const url of [
      "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json",
      "https://gitlab.com/api/v4/projects/1",
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjanind",
      "https://api.openalex.org/works?search=test",
    ]) {
      const result = await fetchPublicJson(url);
      expect(result.ok).toBe(true);
    }
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("borne et valide une recherche Wikidata", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json({
          search: [
            {
              description: "physicienne",
              id: "Q7186",
              label: "Marie Curie",
              match: { text: "Marie Curie", type: "label" },
            },
          ],
          success: 1,
        });
      })
    );

    const result = await runTool(searchWikidataEntities, {
      language: "fr",
      limit: 1,
      query: "Marie Curie",
    });
    expect(calls[0]).toContain("action=wbsearchentities");
    expect(result).toMatchObject({
      entities: [
        {
          id: "Q7186",
          label: "Marie Curie",
          url: "https://www.wikidata.org/wiki/Q7186",
        },
      ],
    });
  });

  it("refuse une réponse Wikidata mal formée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ search: "not-an-array" }))
    );
    const result = await runTool(searchWikidataEntities, {
      language: "fr",
      limit: 3,
      query: "invalide",
    });
    expect(String(result.error)).toContain("invalide");
  });

  it("lit une entité Wikidata en bornant les valeurs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          entities: {
            Q42: {
              aliases: { en: [{ language: "en", value: "Douglas Adams" }] },
              claims: {
                P31: [{ mainsnak: { datavalue: { value: { id: "Q5" } } } }],
              },
              descriptions: { fr: { language: "fr", value: "écrivain" } },
              labels: { fr: { language: "fr", value: "Douglas Adams" } },
            },
          },
        })
      )
    );
    const result = await runTool(getWikidataEntity, {
      entityId: "q42",
      language: "fr",
    });
    expect(result.entity).toMatchObject({
      description: "écrivain",
      id: "Q42",
      label: "Douglas Adams",
    });
    expect(result.source).toMatchObject({
      url: "https://www.wikidata.org/wiki/Q42",
    });
  });

  it("confirme la visibilité publique avant de lire un projet GitLab", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json({
          default_branch: "main",
          description: "Projet public",
          id: 42,
          name: "demo",
          open_issues_count: 2,
          path_with_namespace: "group/demo",
          star_count: 7,
          visibility: "public",
          web_url: "https://gitlab.com/group/demo",
        });
      })
    );
    const result = await runTool(getGitlabProjectSummary, {
      project: "group/demo",
    });
    expect(calls).toEqual(["https://gitlab.com/api/v4/projects/group%2Fdemo"]);
    expect(result).toMatchObject({
      openIssues: 2,
      path: "group/demo",
      stars: 7,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          id: 43,
          path_with_namespace: "group/private",
          visibility: "private",
        })
      )
    );
    const privateResult = await runTool(getGitlabProjectSummary, {
      project: "group/private",
    });
    expect(String(privateResult.error)).toContain("public");
  });

  it("décode un fichier GitLab public avec une limite de sortie", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/repository/files/")) {
          return Response.json({
            content: Buffer.from("hello public").toString("base64"),
            encoding: "base64",
            file_path: "README.md",
            ref: "main",
            size: 12,
          });
        }
        return Response.json({
          id: 42,
          path_with_namespace: "group/demo",
          visibility: "public",
        });
      })
    );
    const result = await runTool(readGitlabFile, {
      filePath: "README.md",
      project: "group/demo",
      ref: "main",
    });
    expect(result).toMatchObject({
      content: "hello public",
      path: "README.md",
      truncated: false,
    });
  });

  it("convertit les données JSON-stat Eurostat en observations bornées", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json({
          dimension: {
            geo: {
              category: {
                index: { DE: 0, FR: 1 },
                label: { DE: "Allemagne", FR: "France" },
              },
              label: "Pays",
            },
            time: {
              category: { index: { "2020": 0 }, label: { "2020": "2020" } },
              label: "Année",
            },
          },
          id: ["geo", "time"],
          label: "Test",
          size: [2, 1],
          updated: "2026-09-25T00:00:00Z",
          value: { "0": 1, "1": 2 },
        });
      })
    );
    const result = await runTool(getEurostatData, {
      dataset: "nama_10_gdp",
      geo: ["FR", "DE"],
      limit: 1,
      time: "2020",
    });
    expect(calls[0]).toContain("format=JSON");
    expect(calls[0]).toContain("geo=FR%2BDE");
    expect(result.observations).toHaveLength(1);
    expect(result.totalReturned).toBe(1);
    expect(result.source).toMatchObject({
      url: expect.stringContaining("ec.europa.eu"),
    });
  });

  it("valide et limite une recherche OpenAlex", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json({
          meta: { count: 1 },
          results: [
            {
              authorships: [
                {
                  author: {
                    display_name: "Ada Example",
                    id: "https://openalex.org/A1",
                  },
                },
              ],
              cited_by_count: 12,
              id: "https://openalex.org/W123",
              publication_year: 2024,
              title: "Un travail",
            },
          ],
        });
      })
    );
    const result = await runTool(searchOpenAlexWorks, {
      limit: 1,
      query: "open science",
    });
    expect(calls[0]).toContain("per-page=1");
    expect(calls[0]).toContain("select=");
    expect(result).toMatchObject({
      totalMatches: 1,
      works: [{ citedBy: 12, id: "https://openalex.org/W123" }],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ meta: { count: 0 }, results: {} }))
    );
    const invalid = await runTool(searchOpenAlexWorks, {
      limit: 1,
      query: "invalide",
    });
    expect(String(invalid.error)).toContain("invalide");
  });

  it("lit une publication OpenAlex par identifiant stable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          id: "https://openalex.org/W123",
          title: "Publication",
        })
      )
    );
    const result = await runTool(getOpenAlexWork, { workId: "W123" });
    expect(result.work).toMatchObject({
      id: "https://openalex.org/W123",
      title: "Publication",
    });
  });
});
