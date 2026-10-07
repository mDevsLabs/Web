import { describe, expect, it } from "vitest";
import {
  getSlashExecutableHandler,
  registerSlashExecutable,
} from "./slashExecutableTypes";

describe("slashExecutableTypes — 阶段3 扩展点占位", () => {
  it("registerSlashExecutable 规范化 key 并支持卸载", () => {
    const fn = async () => ({ handled: true as const });
    const off = registerSlashExecutable("/Foo", fn);
    expect(getSlashExecutableHandler("foo")).toBe(fn);
    expect(getSlashExecutableHandler("FOO")).toBe(fn);
    off();
    expect(getSlashExecutableHandler("foo")).toBeUndefined();
  });

  it("空 slash 不注册", () => {
    const off = registerSlashExecutable("   ", async () => ({ handled: true }));
    expect(getSlashExecutableHandler("")).toBeUndefined();
    off();
  });
});
