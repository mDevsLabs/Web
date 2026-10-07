import { describe, expect, it, vi } from "vitest";
import type { ToolCall } from "../../../agent/agentTools.js";
import type { FeishuApiClient } from "./feishuApiClient.js";
import { buildFeishuTaskHandlers } from "./feishuTaskTools.js";

function mockClient(opts: {
  hasUserToken?: boolean;
  request?: ReturnType<typeof vi.fn>;
}): FeishuApiClient {
  return {
    canRefresh: false,
    hasUserToken: opts.hasUserToken !== false,
    lark: null as unknown as FeishuApiClient["lark"],
    request: opts.request ?? vi.fn(),
    userAccessToken: opts.hasUserToken === false ? "" : "u-token",
  };
}

function call(name: string, args: Record<string, unknown> = {}): ToolCall {
  return { arguments: args, id: `id-${name}`, name };
}

describe("feishu task tools", () => {
  it("rejects all task tools when user_access_token is missing", async () => {
    const client = mockClient({ hasUserToken: false });
    const h = buildFeishuTaskHandlers(client);
    for (const name of [
      "list_feishu_tasks",
      "create_feishu_task",
      "update_feishu_task",
      "delete_feishu_task",
    ]) {
      const fn = h[name]!;
      const res = await fn(
        call(name, {
          taskGuid: "g",
          taskGuids: ["g"],
          tasks: [{ summary: "s" }],
        })
      );
      expect(res.isError).toBe(true);
      expect(res.content).toMatch(/user_access_token/);
    }
  });

  it("list_feishu_tasks slims items and respects has_more for second page", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          has_more: true,
          items: Array.from({ length: 50 }, (_, i) => ({
            _internal: "drop",
            guid: `g${i}`,
            summary: `s${i}`,
          })),
          page_token: "p1",
        },
      })
      .mockResolvedValueOnce({
        data: {
          has_more: false,
          items: [{ guid: "g50", summary: "s50" }],
          page_token: "p2",
        },
      });
    const client = mockClient({ request });
    const h = buildFeishuTaskHandlers(client);
    const res = await h.list_feishu_tasks!(call("list_feishu_tasks", {}));
    expect(res.isError).toBe(false);
    const parsed = JSON.parse(res.content);
    expect(parsed.items).toHaveLength(51);
    expect(parsed.items[0]).toEqual({ guid: "g0", summary: "s0" }); // _internal stripped
    expect(parsed.has_more).toBe(false);
    expect(parsed.page_token).toBe("p2");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("list_feishu_tasks does not paginate when first response says no more", async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        has_more: false,
        items: [{ guid: "g1", summary: "s" }],
        page_token: "",
      },
    });
    const client = mockClient({ request });
    const h = buildFeishuTaskHandlers(client);
    await h.list_feishu_tasks!(call("list_feishu_tasks", {}));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("create_feishu_task supports nested subtasks via depth-first POST", async () => {
    const request = vi
      .fn()
      .mockImplementation(async ({ url }: { url: string }) => {
        if (url === "/open-apis/task/v2/tasks") {
          return { data: { task: { guid: "gp", summary: "parent" } } };
        }
        return { data: { subtask: { guid: "gc", summary: "child" } } };
      });
    const client = mockClient({ request });
    const h = buildFeishuTaskHandlers(client);
    const res = await h.create_feishu_task!(
      call("create_feishu_task", {
        tasks: [{ subTasks: [{ summary: "child" }], summary: "parent" }],
      })
    );
    expect(res.isError).toBe(false);
    const parsed = JSON.parse(res.content);
    expect(parsed.errors).toEqual([]);
    expect(parsed.results[0].task.guid).toBe("gp");
    expect(parsed.results[0].subTasks[0].task.guid).toBe("gc");
    // First call: top-level POST. Second call: subtask under gp.
    expect(request.mock.calls[1]![0].url).toBe(
      "/open-apis/task/v2/tasks/gp/subtasks"
    );
  });

  it("create_feishu_task records per-path errors but keeps creating siblings", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce({ data: { task: { guid: "g2", summary: "b" } } });
    const client = mockClient({ request });
    const h = buildFeishuTaskHandlers(client);
    const res = await h.create_feishu_task!(
      call("create_feishu_task", {
        tasks: [{ summary: "a" }, { summary: "b" }],
      })
    );
    const parsed = JSON.parse(res.content);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].path).toBe("[0]");
    expect(parsed.results).toHaveLength(1);
  });

  it("update_feishu_task requires at least one editable field", async () => {
    const client = mockClient({ request: vi.fn() });
    const h = buildFeishuTaskHandlers(client);
    const res = await h.update_feishu_task!(
      call("update_feishu_task", { taskGuid: "g" })
    );
    expect(res.isError).toBe(true);
    expect(res.content).toMatch(/at least one editable field/i);
  });

  it("update_feishu_task sends update_fields list matching provided keys", async () => {
    const request = vi
      .fn()
      .mockResolvedValue({ data: { task: { guid: "g", summary: "x" } } });
    const client = mockClient({ request });
    const h = buildFeishuTaskHandlers(client);
    await h.update_feishu_task!(
      call("update_feishu_task", {
        dueTimestamp: "1700000000000",
        summary: "x",
        taskGuid: "g",
      })
    );
    const body = request.mock.calls[0]![0].data;
    expect(body.update_fields).toEqual(["summary", "due"]);
    expect(body.task.due).toEqual({
      is_all_day: false,
      timestamp: "1700000000000",
    });
  });

  it("delete_feishu_task processes each guid independently", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce({});
    const client = mockClient({ request });
    const h = buildFeishuTaskHandlers(client);
    const res = await h.delete_feishu_task!(
      call("delete_feishu_task", { taskGuids: ["g1", "g2", "g3"] })
    );
    const parsed = JSON.parse(res.content);
    expect(parsed.deleted).toEqual(["g1", "g3"]);
    expect(parsed.errors).toEqual([{ error: "not found", guid: "g2" }]);
  });
});
