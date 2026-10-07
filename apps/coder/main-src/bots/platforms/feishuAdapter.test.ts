import { describe, expect, it } from "vitest";
import {
  buildFeishuReplyPayload,
  extractFeishuMessageEvent,
} from "./feishuAdapter.js";

describe("buildFeishuReplyPayload", () => {
  it("uses path.message_id required by the SDK", () => {
    expect(buildFeishuReplyPayload("om_123", "hello")).toEqual({
      data: {
        content: '{"text":"hello"}',
        msg_type: "text",
      },
      path: { message_id: "om_123" },
    });
  });
});

describe("extractFeishuMessageEvent", () => {
  it("reads top-level long connection payloads", () => {
    const result = extractFeishuMessageEvent({
      message: {
        chat_id: "oc_123",
        chat_type: "p2p",
        content: '{"text":"hello"}',
        message_id: "om_123",
        message_type: "text",
      },
      sender: {
        sender_id: {
          open_id: "ou_123",
          user_id: "u_123",
        },
        sender_type: "user",
      },
    });

    expect(result?.sender?.sender_id?.open_id).toBe("ou_123");
    expect(result?.message?.message_id).toBe("om_123");
  });

  it("also supports nested webhook-style payloads", () => {
    const result = extractFeishuMessageEvent({
      event: {
        message: {
          chat_id: "oc_456",
          chat_type: "group",
          content: '{"text":"hello"}',
          message_id: "om_456",
          message_type: "text",
        },
        sender: {
          sender_id: {
            union_id: "on_123",
          },
          sender_type: "user",
        },
      },
    });

    expect(result?.sender?.sender_id?.union_id).toBe("on_123");
    expect(result?.message?.chat_id).toBe("oc_456");
  });

  it("returns null for invalid payloads", () => {
    expect(extractFeishuMessageEvent(null)).toBeNull();
    expect(extractFeishuMessageEvent("oops")).toBeNull();
  });
});
