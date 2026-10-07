import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  decodeTextBuffer,
  encodeTextBuffer,
  readTextFileSyncWithMetadata,
} from "../textEncoding.js";

const resolveTerminalToolExecCreateOptsMock = vi.fn();
const createTerminalSessionMock = vi.fn();
const startOneShotCommandSessionMock = vi.fn();
const runOneShotCommandMock = vi.fn();
const runTerminalSessionToExitMock = vi.fn();
const executeShellCommandMock = vi.fn();
const httpsRequestMock = vi.fn();

vi.mock("../terminalProfileStore.js", () => ({
  resolveTerminalToolExecCreateOpts: (...args: unknown[]) =>
    resolveTerminalToolExecCreateOptsMock(...args),
}));

vi.mock("../terminalSessionService.js", () => ({
  createTerminalSession: (...args: unknown[]) =>
    createTerminalSessionMock(...args),
  runOneShotCommand: (...args: unknown[]) => runOneShotCommandMock(...args),
  runTerminalSessionToExit: (...args: unknown[]) =>
    runTerminalSessionToExitMock(...args),
  startOneShotCommandSession: (...args: unknown[]) =>
    startOneShotCommandSessionMock(...args),
}));

vi.mock("../shell/commandExecutor.js", () => ({
  executeShellCommand: (...args: unknown[]) => executeShellCommandMock(...args),
}));

vi.mock("node:https", () => ({
  request: (...args: unknown[]) => httpsRequestMock(...args),
}));

import { executeTool } from "./toolExecutor.js";

beforeEach(() => {
  vi.clearAllMocks();
  executeShellCommandMock.mockResolvedValue({
    args: [],
    command: "",
    cwd: undefined,
    executable: "",
    exitCode: 0,
    output: "",
    shellType: "external",
    signal: null,
    stderr: "",
    stdout: "",
    timedOut: false,
    truncated: false,
  });
});

describe("executeTool Bash", () => {
  it("runs shell commands without crashing on missing hooks scope", async () => {
    const command = process.platform === "win32" ? "Get-Location" : "pwd";
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tool-bash-test-"));
    const result = await executeTool(
      {
        arguments: { command },
        id: "bash-1",
        name: "Bash",
      },
      undefined,
      { workspaceRoot: tempDir }
    );

    expect(result.isError).toBe(false);
    expect(result.content).not.toContain("hooks is not defined");
  }, 20_000);

  it("blocks direct shell redirection writes", async () => {
    const result = await executeTool(
      {
        arguments: { command: "echo hello > notes.txt" },
        id: "bash-write-1",
        name: "Bash",
      },
      undefined,
      { workspaceRoot: process.cwd() }
    );

    expect(result.isError).toBe(true);
    expect(result.content).toContain("Blocked unsafe Bash command");
    expect(executeShellCommandMock).not.toHaveBeenCalled();
  });
});

describe("executeTool file encoding", () => {
  it("preserves UTF-16LE BOM when Write overwrites an existing text file", async () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-write-encoding-")
    );
    const file = path.join(workspaceRoot, "utf16.txt");
    fs.writeFileSync(file, encodeTextBuffer("旧内容", "utf16le-bom"));

    const result = await executeTool(
      {
        arguments: { content: "新内容", file_path: "utf16.txt" },
        id: "write-utf16-1",
        name: "Write",
      },
      undefined,
      { workspaceRoot }
    );

    expect(result.isError).toBe(false);
    const raw = fs.readFileSync(file);
    expect([...raw.subarray(0, 2)]).toEqual([0xff, 0xfe]);
    expect(readTextFileSyncWithMetadata(file).text).toBe("新内容");
  });

  it("preserves GB18030 when Edit modifies an existing legacy-encoded file", async () => {
    const previous = process.env.MAI_CODER_LEGACY_TEXT_ENCODING;
    process.env.MAI_CODER_LEGACY_TEXT_ENCODING = "gb18030";
    try {
      const workspaceRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "async-edit-encoding-")
      );
      const file = path.join(workspaceRoot, "gbk.txt");
      fs.writeFileSync(file, encodeTextBuffer("中文 old", "gb18030"));

      const result = await executeTool(
        {
          arguments: {
            file_path: "gbk.txt",
            new_string: "new",
            old_string: "old",
          },
          id: "edit-gb18030-1",
          name: "Edit",
        },
        undefined,
        { workspaceRoot }
      );

      expect(result.isError).toBe(false);
      const decoded = decodeTextBuffer(fs.readFileSync(file), {
        preferredLegacyEncoding: "gb18030",
      });
      expect(decoded.text).toBe("中文 new");
      expect(decoded.encoding).toBe("gb18030");
    } finally {
      if (previous === undefined) {
        delete process.env.MAI_CODER_LEGACY_TEXT_ENCODING;
      } else {
        process.env.MAI_CODER_LEGACY_TEXT_ENCODING = previous;
      }
    }
  });
});

describe("executeTool active skill/plugin readable roots", () => {
  it("allows Read to resolve files from registered read-only plugin roots", async () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-read-workspace-")
    );
    const pluginRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-read-plugin-")
    );
    const refFile = path.join(pluginRoot, "知识库", "ref.md");
    fs.mkdirSync(path.dirname(refFile), { recursive: true });
    fs.writeFileSync(refFile, "plugin reference body", "utf8");

    const result = await executeTool(
      {
        arguments: { file_path: "/知识库/ref.md" },
        id: "read-plugin-root",
        name: "Read",
      },
      undefined,
      { extraReadableRoots: [pluginRoot], workspaceRoot }
    );

    expect(result.isError).toBe(false);
    expect(result.content).toContain("plugin reference body");
  });

  it("keeps Write constrained to the workspace even when plugin roots are readable", async () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-write-workspace-")
    );
    const pluginRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-write-plugin-")
    );

    const result = await executeTool(
      {
        arguments: {
          content: "nope",
          file_path: path.join(pluginRoot, "ref.md"),
        },
        id: "write-plugin-root",
        name: "Write",
      },
      undefined,
      { extraReadableRoots: [pluginRoot], workspaceRoot }
    );

    expect(result.isError).toBe(true);
    expect(result.content).toContain("Path escapes workspace boundary");
    expect(fs.existsSync(path.join(pluginRoot, "ref.md"))).toBe(false);
  });

  it("rejects relative path escapes from registered readable roots", async () => {
    const parentRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-readable-boundary-")
    );
    const workspaceRoot = path.join(parentRoot, "workspace");
    const pluginRoot = path.join(parentRoot, "plugin");
    fs.mkdirSync(workspaceRoot, { recursive: true });
    fs.mkdirSync(pluginRoot, { recursive: true });
    fs.writeFileSync(path.join(parentRoot, "outside.md"), "outside", "utf8");

    const result = await executeTool(
      {
        arguments: { file_path: "../outside.md" },
        id: "read-plugin-escape",
        name: "Read",
      },
      undefined,
      { extraReadableRoots: [pluginRoot], workspaceRoot }
    );

    expect(result.isError).toBe(true);
    expect(result.content).toContain(
      "Path escapes workspace and registered skill/plugin roots"
    );
  });

  it("returns absolute paths for Glob results under plugin roots", async () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-glob-workspace-")
    );
    const pluginRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-glob-plugin-")
    );
    const refFile = path.join(pluginRoot, "templates", "viewer.html");
    fs.mkdirSync(path.dirname(refFile), { recursive: true });
    fs.writeFileSync(refFile, "<html></html>", "utf8");

    const result = await executeTool(
      {
        arguments: { path: pluginRoot, pattern: "templates/*.html" },
        id: "glob-plugin-root",
        name: "Glob",
      },
      undefined,
      { extraReadableRoots: [pluginRoot], workspaceRoot }
    );

    expect(result.isError).toBe(false);
    expect(result.content).toContain(refFile.replace(/\\/g, "/"));
  });

  it("allows list_dir to inspect registered read-only plugin roots", async () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-list-workspace-")
    );
    const pluginRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-list-plugin-")
    );
    const refDir = path.join(pluginRoot, "templates");
    fs.mkdirSync(refDir, { recursive: true });
    fs.writeFileSync(path.join(refDir, "viewer.html"), "<html></html>", "utf8");

    const result = await executeTool(
      {
        arguments: { path: "/templates" },
        id: "list-plugin-root",
        name: "list_dir",
      },
      undefined,
      { extraReadableRoots: [pluginRoot], workspaceRoot }
    );

    expect(result.isError).toBe(false);
    expect(result.content).toContain("[file] viewer.html");
  });
});

describe("executeTool Browser", () => {
  it("fails gracefully when no host window is attached", async () => {
    const result = await executeTool({
      arguments: { action: "get_config" },
      id: "browser-1",
      name: "Browser",
    });

    expect(result.isError).toBe(true);
    expect(result.content).toContain("attached to an app window");
  });
});

describe("executeTool BrowserCapture", () => {
  it("fails gracefully when no host window is attached", async () => {
    const result = await executeTool({
      arguments: { action: "get_state" },
      id: "browser-capture-1",
      name: "BrowserCapture",
    });

    expect(result.isError).toBe(true);
    expect(result.content).toContain("attached to an app window");
  });
});

describe("executeTool view_image", () => {
  it("loads a local workspace image without using the browser tool", async () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "async-view-image-")
    );
    const imagePath = path.join(workspaceRoot, "tiny.png");
    fs.writeFileSync(
      imagePath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX6QAAAAASUVORK5CYII=",
        "base64"
      )
    );

    const result = await executeTool(
      {
        arguments: { path: "tiny.png" },
        id: "view-image-1",
        name: "view_image",
      },
      undefined,
      { workspaceRoot }
    );

    expect(result.isError).toBe(false);
    expect(result.content).toContain('"relPath": "tiny.png"');
    expect(Array.isArray(result.structuredContent)).toBe(true);
    const blocks = result.structuredContent as Array<{
      type: string;
      source?: { media_type?: string };
    }>;
    expect(
      blocks.some(
        (block) =>
          block.type === "image" && block.source?.media_type === "image/png"
      )
    ).toBe(true);
  });
});

describe("executeTool Terminal exec", () => {
  it("waits for a saved SSH profile command to finish", async () => {
    resolveTerminalToolExecCreateOptsMock.mockReturnValue({
      createOpts: {
        args: ["user@example.com", "sh -lc 'uname -a'"],
        shell: "ssh",
        title: "Prod SSH",
      },
      profile: {
        authMode: "publicKey",
        defaultProfile: false,
        hasRemoteCommand: false,
        hasStoredPassword: false,
        id: "ssh-prod",
        kind: "ssh",
        name: "Prod SSH",
        source: "user",
        target: "root@example.com",
      },
    });
    executeShellCommandMock.mockResolvedValue({
      args: ["user@example.com", "sh -lc 'uname -a'"],
      command: "uname -a",
      cwd: undefined,
      executable: "ssh",
      exitCode: 0,
      output: "Linux host 6.8.0",
      shellType: "external",
      signal: null,
      stderr: "",
      stdout: "Linux host 6.8.0",
      timedOut: false,
      truncated: false,
    });

    const result = await executeTool({
      arguments: {
        action: "exec",
        command: "uname -a",
        profile_id: "ssh-prod",
      },
      id: "terminal-exec-1",
      name: "Terminal",
    });

    expect(resolveTerminalToolExecCreateOptsMock).toHaveBeenCalledWith(
      "ssh-prod",
      "uname -a"
    );
    expect(executeShellCommandMock).toHaveBeenCalledWith("uname -a", {
      args: ["user@example.com", "sh -lc 'uname -a'"],
      cwd: undefined,
      env: undefined,
      shell: "ssh",
      signal: undefined,
      timeoutMs: undefined,
    });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("profile=Prod SSH");
    expect(result.content).toContain("Linux host 6.8.0");
  });

  it("can start a saved SSH profile command in the background and return a session id immediately", async () => {
    resolveTerminalToolExecCreateOptsMock.mockReturnValue({
      createOpts: {
        args: ["user@example.com", "sh -lc 'uname -a'"],
        shell: "ssh",
        title: "Prod SSH",
      },
      profile: {
        authMode: "publicKey",
        defaultProfile: false,
        hasRemoteCommand: false,
        hasStoredPassword: false,
        id: "ssh-prod",
        kind: "ssh",
        name: "Prod SSH",
        source: "user",
        target: "root@example.com",
      },
    });
    createTerminalSessionMock.mockReturnValue({
      alive: true,
      bufferBytes: 0,
      cols: 120,
      createdAt: Date.now(),
      cwd: process.cwd(),
      id: "term-bg-1",
      rows: 30,
      shell: "ssh",
      title: "Prod SSH",
    });

    const result = await executeTool({
      arguments: {
        action: "exec",
        command: "uname -a",
        profile_id: "ssh-prod",
        run_in_background: true,
      },
      id: "terminal-exec-bg-1",
      name: "Terminal",
    });

    expect(createTerminalSessionMock).toHaveBeenCalledWith({
      args: ["user@example.com", "sh -lc 'uname -a'"],
      cols: undefined,
      cwd: undefined,
      rows: undefined,
      shell: "ssh",
      title: "Prod SSH",
    });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("session_id=term-bg-1");
    expect(result.content).toContain('profile "Prod SSH"');
  });

  it("surfaces failed foreground exec output", async () => {
    resolveTerminalToolExecCreateOptsMock.mockReturnValue({
      createOpts: {
        args: ["user@example.com", "sh -lc 'hostname'"],
        shell: "ssh",
        title: "Prod SSH",
      },
      profile: {
        authMode: "password",
        defaultProfile: false,
        hasRemoteCommand: false,
        hasStoredPassword: false,
        id: "ssh-prod",
        kind: "ssh",
        name: "Prod SSH",
        source: "user",
        target: "root@example.com",
      },
    });
    executeShellCommandMock.mockResolvedValue({
      args: ["user@example.com", "sh -lc 'hostname'"],
      command: "hostname",
      cwd: undefined,
      executable: "ssh",
      exitCode: null,
      output: "Permission denied",
      shellType: "external",
      signal: null,
      stderr: "Permission denied",
      stdout: "",
      timedOut: true,
      truncated: false,
    });

    const result = await executeTool({
      arguments: {
        action: "exec",
        command: "hostname",
        profile_id: "ssh-prod",
      },
      id: "terminal-exec-2",
      name: "Terminal",
    });

    expect(result.isError).toBe(true);
    expect(result.content).toContain("profile=Prod SSH");
    expect(result.content).toContain("timed_out=true");
    expect(result.content).toContain("Permission denied");
  });

  it("marks foreground exec timeouts as errors", async () => {
    resolveTerminalToolExecCreateOptsMock.mockReturnValue({
      createOpts: {
        args: ["user@example.com", "sh -lc 'npm install'"],
        shell: "ssh",
        title: "Prod SSH",
      },
      profile: {
        authMode: "publicKey",
        defaultProfile: false,
        hasRemoteCommand: false,
        hasStoredPassword: false,
        id: "ssh-prod",
        kind: "ssh",
        name: "Prod SSH",
        source: "user",
        target: "root@example.com",
      },
    });
    executeShellCommandMock.mockResolvedValue({
      args: ["user@example.com", "sh -lc 'npm install'"],
      command: "npm install",
      cwd: undefined,
      executable: "ssh",
      exitCode: null,
      output: "Downloading packages...",
      shellType: "external",
      signal: null,
      stderr: "",
      stdout: "Downloading packages...",
      timedOut: true,
      truncated: false,
    });

    const result = await executeTool({
      arguments: {
        action: "exec",
        command: "npm install",
        profile_id: "ssh-prod",
        timeout_ms: 1000,
      },
      id: "terminal-exec-timeout-1",
      name: "Terminal",
    });

    expect(result.isError).toBe(true);
    expect(result.content).toContain("timed_out=true");
    expect(result.content).toContain("Downloading packages...");
  });
});

describe("executeTool Fetch", () => {
  beforeEach(() => {
    httpsRequestMock.mockImplementation((_url, _options, callback) => {
      const res = new EventEmitter() as any;
      res.statusCode = 200;
      res.statusMessage = "OK";
      res.headers = { "content-type": "application/json" };
      res.destroy = vi.fn();

      const req = {
        destroy: vi.fn(),
        end: vi.fn(),
        on: vi.fn(),
        write: vi.fn(),
      };

      process.nextTick(() => {
        const cb = callback as (res: any) => void;
        cb(res);
        res.emit("data", Buffer.from('{"test": true}'));
        res.emit("end");
      });

      return req;
    });
  });

  afterEach(() => {
    httpsRequestMock.mockClear();
  });

  it("returns error when url is missing", async () => {
    const result = await executeTool({
      arguments: {},
      id: "fetch-1",
      name: "Fetch",
    });
    expect(result.isError).toBe(true);
    expect(result.content).toContain("url is required");
  });

  it("returns error for invalid URL", async () => {
    const result = await executeTool({
      arguments: { url: "not-a-url" },
      id: "fetch-2",
      name: "Fetch",
    });
    expect(result.isError).toBe(true);
    expect(result.content).toContain("invalid URL");
  });

  it("returns error for non-HTTP protocols", async () => {
    const result = await executeTool({
      arguments: { url: "ftp://example.com/file.txt" },
      id: "fetch-3",
      name: "Fetch",
    });
    expect(result.isError).toBe(true);
    expect(result.content).toContain("only HTTP and HTTPS URLs are supported");
  });

  it("returns error for unsupported HTTP method", async () => {
    const result = await executeTool({
      arguments: { method: "TRACE", url: "https://example.com" },
      id: "fetch-4",
      name: "Fetch",
    });
    expect(result.isError).toBe(true);
    expect(result.content).toContain("unsupported HTTP method");
  });

  it("successfully fetches a public HTTPS endpoint", async () => {
    const result = await executeTool({
      arguments: { url: "https://httpbin.org/get" },
      id: "fetch-5",
      name: "Fetch",
    });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("HTTP 200");
    expect(result.content).toContain("Body:");
  });

  it("successfully sends a POST with body and headers", async () => {
    const result = await executeTool({
      arguments: {
        body: JSON.stringify({ test: true }),
        headers: {
          "Content-Type": "application/json",
          "X-Test-Header": "hello",
        },
        method: "POST",
        url: "https://httpbin.org/post",
      },
      id: "fetch-6",
      name: "Fetch",
    });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("HTTP 200");
    expect(result.content).toContain('"test": true');
  });
});

describe("executeTool Terminal run", () => {
  it("can start a local one-shot command in the background", async () => {
    startOneShotCommandSessionMock.mockReturnValue({
      alive: true,
      bufferBytes: 0,
      cols: 120,
      createdAt: Date.now(),
      cwd: process.cwd(),
      id: "term-run-bg-1",
      rows: 30,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      title: "(one-shot) npm install",
    });

    const result = await executeTool(
      {
        arguments: {
          action: "run",
          command: "npm install",
          run_in_background: true,
        },
        id: "terminal-run-bg-1",
        name: "Terminal",
      },
      undefined,
      { workspaceRoot: process.cwd() }
    );

    expect(startOneShotCommandSessionMock).toHaveBeenCalledWith({
      cols: undefined,
      command: "npm install",
      cwd: process.cwd(),
      rows: undefined,
      shell: undefined,
    });
    expect(result.isError).toBe(false);
    expect(result.content).toContain("session_id=term-run-bg-1");
    expect(result.content).toContain("Started background terminal command.");
  });

  it("marks foreground run timeouts as errors", async () => {
    executeShellCommandMock.mockResolvedValue({
      args: ["-lc", "npm install"],
      command: "npm install",
      cwd: process.cwd(),
      executable: "bash",
      exitCode: null,
      output: "Downloading packages...",
      shellType: "bash",
      signal: null,
      stderr: "",
      stdout: "Downloading packages...",
      timedOut: true,
      truncated: false,
    });

    const result = await executeTool(
      {
        arguments: {
          action: "run",
          command: "npm install",
          timeout_ms: 1000,
        },
        id: "terminal-run-timeout-1",
        name: "Terminal",
      },
      undefined,
      { workspaceRoot: process.cwd() }
    );

    expect(executeShellCommandMock).toHaveBeenCalledWith("npm install", {
      cwd: process.cwd(),
      shell: undefined,
      signal: undefined,
      timeoutMs: 1000,
    });
    expect(result.isError).toBe(true);
    expect(result.content).toContain("timed_out=true");
    expect(result.content).toContain("Downloading packages...");
  });
});
