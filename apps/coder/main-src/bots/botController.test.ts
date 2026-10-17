import { describe, expect, it } from "vitest";
import {
  botAttachmentDedupeKey,
  filterUnsentBotReplyImages,
} from "./botController.js";

describe("botAttachmentDedupeKey", () => {
  it("normalizes path separators and casing for duplicate detection", () => {
    expect(botAttachmentDedupeKey("D:\\Temp\\Capture.PNG")).toBe(
      botAttachmentDedupeKey("d:/temp/capture.png")
    );
  });
});

describe("filterUnsentBotReplyImages", () => {
  it("skips screenshots that were already sent via send_local_attachment", () => {
    const sent = ["D:\\Temp\\capture.png"];
    const imagePaths = ["d:/temp/capture.png", "D:\\Temp\\other.png"];

    expect(filterUnsentBotReplyImages(imagePaths, sent)).toEqual([
      "D:\\Temp\\other.png",
    ]);
  });
});
