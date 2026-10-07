/**
 * Agent 工具定义。
 * 每个工具包含名称、描述和 JSON Schema 参数，供 OpenAI / Anthropic / Gemini 的 tool calling 使用。
 */

import type {
  AnthropicToolResultContent,
  AnthropicToolSchema,
} from "../llm/anthropicBeta.js";
import {
  buildAnthropicToolSchemas,
  buildOpenAIToolSchemas,
} from "./toolSchemaCache.js";

export type AgentToolDef = {
  name: string;
  description: string;
  shouldDefer?: boolean;
  alwaysLoad?: boolean;
  maxResultSizeChars?: number;
  strict?: boolean;
  eagerInputStreaming?: boolean;
  isMcp?: boolean;
  schemaCacheKey?: string;
  parameters: {
    type: "object";
    properties: Record<string, Record<string, unknown>>;
    required: string[];
  };
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolResult = {
  toolCallId: string;
  name: string;
  content: string;
  structuredContent?: AnthropicToolResultContent;
  isError: boolean;
};

/** 只读工具：可安全并发执行，不修改文件系统或运行副作用命令（含 MCP 资源工具） */
export const READ_ONLY_AGENT_TOOL_NAMES = [
  "Read",
  "view_image",
  "Glob",
  "Grep",
  "LSP",
  "ListMcpResourcesTool",
  "ReadMcpResourceTool",
  "ToolSearch",
  "WebSearch",
  "Fetch",
  "TaskList",
  "TaskGet",
  "TaskOutput",
] as const;

export function isReadOnlyAgentTool(name: string): boolean {
  return (READ_ONLY_AGENT_TOOL_NAMES as readonly string[]).includes(name);
}

export function agentToolsForComposerMode(
  mode: "agent" | "plan" | "team",
  all: AgentToolDef[] = AGENT_TOOLS
): AgentToolDef[] {
  if (mode === "plan") {
    return all.filter(
      (d) =>
        (isReadOnlyAgentTool(d.name) && d.name !== "ToolSearch") ||
        d.name === "ask_plan_question" ||
        d.name === "request_user_input" ||
        d.name === "plan_submit_draft"
    );
  }
  return all;
}

export const AGENT_TOOLS: AgentToolDef[] = [
  {
    description:
      "Read a text file under the workspace or the active Skill/plugin read-only resource roots. Returns content with line numbers (padded line number, pipe, then line). Prefer this over shell cat/type/Get-Content. **file_path** may be absolute if it stays inside the workspace or active Skill/plugin roots, or relative to the workspace root; when a relative path is not found in the workspace, active Skill/plugin roots are tried. By default reads up to 2000 lines starting at line **offset** (1-based); use **limit** for a smaller window or paginate with **offset** on huge files.",
    name: "Read",
    parameters: {
      properties: {
        file_path: {
          description:
            "Path to the file: workspace-relative, Skill/plugin-root-relative, or absolute if under the workspace or active Skill/plugin roots.",
          type: "string",
        },
        limit: {
          description:
            "Maximum number of lines to return. If omitted, reads up to 2000 lines from offset. Capped at 2000 per call.",
          type: "number",
        },
        offset: {
          description: "1-based starting line to read. Default 1.",
          type: "number",
        },
      },
      required: ["file_path"],
      type: "object",
    },
  },
  {
    description:
      "Load a local image file from the workspace or active Skill/plugin read-only resource roots for model inspection. Prefer this over **Browser** when the target is an existing local PNG/JPG/JPEG/GIF/WEBP file rather than a webpage. Accepts a workspace-relative or Skill/plugin-root-relative path, or an absolute path if it stays inside an allowed root.",
    name: "view_image",
    parameters: {
      properties: {
        detail: {
          description:
            "Optional detail override. The only supported value is `original`; omit it for default behavior.",
          type: "string",
        },
        path: {
          description:
            "Path to the image file: workspace-relative, Skill/plugin-root-relative, or absolute if under the workspace or active Skill/plugin roots.",
          type: "string",
        },
      },
      required: ["path"],
      type: "object",
    },
  },
  {
    description:
      "Create a new file or completely overwrite an existing file. This tool writes through Async's encoding-safe file path: existing text file encodings/BOMs are preserved when possible, and new files default to UTF-8. For streaming UI, emit the **file_path** argument first, before **content**, so the editor can show the file card title before code starts arriving. For small targeted edits on existing files, prefer **Edit**. When asked to persist Async/Cursor-style project rules as `.mdc` files, use `.mai/rules/` under the workspace unless the user specifies another path.",
    name: "Write",
    parameters: {
      properties: {
        content: { description: "Full file contents to write", type: "string" },
        file_path: {
          description:
            "Path to the file: workspace-relative, or absolute if under the workspace root.",
          type: "string",
        },
      },
      required: ["file_path", "content"],
      type: "object",
    },
  },
  {
    description:
      "Edit a file by replacing **old_string** with **new_string**. This tool preserves the existing text file encoding/BOM when possible. For streaming UI, emit the **file_path** argument first, before **old_string** and **new_string**, so the editor can show the file card title before code starts arriving. When **replace_all** is false (default), **old_string** must match exactly once. When **replace_all** is true, every occurrence is replaced. If the match is not unique, read more context with **Read** and retry with a longer snippet.",
    name: "Edit",
    parameters: {
      properties: {
        file_path: {
          description:
            "Path to the file: workspace-relative, or absolute if under the workspace root.",
          type: "string",
        },
        new_string: {
          description: "Replacement text (may be empty to delete).",
          type: "string",
        },
        old_string: {
          description:
            "Exact text to find (including whitespace and line breaks).",
          type: "string",
        },
        replace_all: {
          description:
            "If true, replace every occurrence of old_string; if false, require a single match.",
          type: "boolean",
        },
      },
      required: ["file_path", "old_string", "new_string"],
      type: "object",
    },
  },
  {
    description:
      "Find files by glob pattern under the workspace or an active Skill/plugin read-only resource root (e.g. `**/*.ts`, `src/**/*.tsx`). Returns workspace-relative paths for workspace results and absolute paths for Skill/plugin results, sorted, up to 100 matches. Does not search file contents — use **Grep** for that.",
    name: "Glob",
    parameters: {
      properties: {
        path: {
          description:
            "Optional subdirectory under the workspace or active Skill/plugin roots to search in; omit to search from the workspace root.",
          type: "string",
        },
        pattern: {
          description:
            "Glob pattern (minimatch syntax), relative to the selected search root.",
          type: "string",
        },
      },
      required: ["pattern"],
      type: "object",
    },
  },
  {
    description:
      'A powerful search tool built on ripgrep.\n\nUsage:\n- ALWAYS use Grep for search tasks. NEVER invoke `grep` or `rg` via Bash; this tool is wired for workspace-safe search.\n- Supports full regex (e.g. "log.*Error", "function\\s+\\w+").\n- Filter files with **glob** (e.g. "*.js", "*.{ts,tsx}") or **type** (e.g. "js", "py", "rust").\n- **output_mode**: "content" shows matching lines (with optional context via -A/-B/-C/context), "files_with_matches" lists paths only (default), "count" shows per-file match counts.\n- Use the **Agent** tool for open-ended searches that need many rounds.\n- Pattern syntax follows ripgrep (not GNU grep): brace literals may need escaping.\n- For patterns spanning lines, set **multiline** to true.\n- Optional **symbol**: when true, search exported symbol names (substring) via the workspace symbol index instead of grepping file contents.\n- **path** may target the workspace or an active Skill/plugin read-only root. Skill/plugin results are returned as absolute paths so they can be passed back to Read.',
    name: "Grep",
    parameters: {
      properties: {
        "-A": {
          description:
            'Lines of context after each match (ripgrep -A). Only for output_mode "content".',
          type: "number",
        },
        "-B": {
          description:
            'Lines of context before each match (ripgrep -B). Only for output_mode "content".',
          type: "number",
        },
        "-C": {
          description:
            'Lines of context before and after each match (ripgrep -C). Only for output_mode "content".',
          type: "number",
        },
        "-i": {
          description: "Case-insensitive search (ripgrep -i).",
          type: "boolean",
        },
        "-n": {
          description:
            'Include line numbers in content output (ripgrep -n). Default true for output_mode "content".',
          type: "boolean",
        },
        context: {
          description:
            'Same as -C when set (takes precedence over -B/-A pairing). Only for output_mode "content".',
          type: "number",
        },
        glob: {
          description:
            'Glob pattern(s) to filter files (e.g. "*.js", "*.{ts,tsx}"). Space-separated; comma-separated allowed when not using brace expansion.',
          type: "string",
        },
        head_limit: {
          description:
            "Cap output lines or entries (per mode). Default 250; pass 0 for unlimited (use sparingly).",
          type: "number",
        },
        multiline: {
          description:
            "Multiline mode: . matches newlines (ripgrep -U --multiline-dotall). Default false.",
          type: "boolean",
        },
        offset: {
          description:
            "Skip this many lines/entries before applying head_limit (pagination). Default 0.",
          type: "number",
        },
        output_mode: {
          description:
            '"content" shows matching lines (supports context and line numbers), "files_with_matches" lists file paths only (default), "count" shows per-file match counts.',
          enum: ["content", "files_with_matches", "count"],
          type: "string",
        },
        path: {
          description:
            "Optional path relative to workspace root or active Skill/plugin roots: file or directory to search in. Omit to search from the workspace root.",
          type: "string",
        },
        pattern: {
          description:
            "Regular expression to search for in file contents (unless symbol is true)",
          type: "string",
        },
        symbol: {
          description:
            "If true, search exported symbol names (substring match) via the symbol index instead of grepping file contents.",
          type: "boolean",
        },
        type: {
          description:
            "File type filter (ripgrep --type), e.g. js, py, rust, go, java.",
          type: "string",
        },
      },
      required: ["pattern"],
      type: "object",
    },
  },
  {
    description:
      "Run a shell command in the workspace directory. Use Unix shell syntax (POSIX bash) — on Windows the runtime prefers a validated Git Bash/MSYS/Cygwin bash and only accepts WSL if it can successfully run a probe command. Use for tests, builds, installs, git status/log/diff, and other command execution. Do not use Bash for reading or discovering source files when **Read**, **Glob**, or **Grep** can do the job. Do not use Bash to run `grep` or `rg` for codebase search — use **Grep**. Do not use Bash to create, edit, delete, copy, move, or overwrite files; use **Write**/**Edit** so file encodings are controlled by the app. Shell redirection to files, `tee`, `sed -i`, `perl -pi`, and PowerShell file-writing cmdlets are blocked. Default timeout is 120 seconds; set **timeout_ms** for slower installs/downloads.",
    name: "Bash",
    parameters: {
      properties: {
        command: { description: "The command line to execute", type: "string" },
        timeout_ms: {
          description:
            "Optional max milliseconds to wait for the command to finish. Default 120000, max 600000.",
          type: "number",
        },
      },
      required: ["command"],
      type: "object",
    },
  },
  {
    description:
      "Interact with the app's shared Universal Terminal sessions. Sessions are persistent pty processes (the user's real shell) that survive even when no terminal window is open. Use this when you need an interactive session, want to drive a long-running or REPL-style command, or need to keep terminal state (cwd, env, background processes) across calls. For one-shot commands, prefer **Bash** unless you specifically need a saved Universal Terminal profile. You can also enumerate saved Universal Terminal profiles, then open one in the background by profile id or name. This is the supported way to reuse saved SSH profiles without opening the terminal window.\n\nActions: **open** (spawn a new session, optionally from a saved profile, returns id), **write** (send keystrokes/data; include \\r or \\n to submit a line), **read** (return the tail of the output buffer), **list** (enumerate active sessions), **list_profiles** (enumerate saved terminal profiles, including SSH), **resize** (change cols/rows), **close** (kill session), **run** (one-shot convenience for local/non-interactive shells), **exec** (execute a one-shot command through a saved SSH profile with no visible terminal window). For **run**/**exec**, set **run_in_background** to return immediately with a session id; if a foreground wait times out, the session is kept so you can continue with **read**/**close**.",
    name: "Terminal",
    parameters: {
      properties: {
        action: {
          description: "Which terminal operation to perform.",
          enum: [
            "open",
            "write",
            "read",
            "list",
            "list_profiles",
            "resize",
            "close",
            "run",
            "exec",
          ],
          type: "string",
        },
        cols: {
          description: "For open/resize: column count. Defaults to 120.",
          type: "number",
        },
        command: {
          description:
            "For run/exec: the command line to execute in a one-shot session.",
          type: "string",
        },
        cwd: {
          description:
            "For open/run without profile_id: initial working directory. Workspace-relative or absolute inside the workspace. Defaults to the workspace root.",
          type: "string",
        },
        data: {
          description:
            "For write: raw bytes to send to the pty. Include \\r or \\n to submit a command. Control chars like \\x03 (Ctrl-C) are allowed.",
          type: "string",
        },
        max_bytes: {
          description:
            "For read: maximum bytes to return from the tail of the session buffer. Default 16384, max 262144.",
          type: "number",
        },
        profile_id: {
          description:
            "For open: optional saved terminal profile id or exact profile name. For exec: required saved SSH profile id or exact profile name. Use list_profiles first to discover SSH/local profiles. When set, the profile decides shell/args/env/auth behavior and no terminal window is shown.",
          type: "string",
        },
        rows: {
          description: "For open/resize: row count. Defaults to 30.",
          type: "number",
        },
        run_in_background: {
          description:
            "For run/exec: if true, start the command and return immediately with a session id. Use read/list/close to monitor it later.",
          type: "boolean",
        },
        session_id: {
          description:
            "Session id returned by open/list. Required for write/read/resize/close.",
          type: "string",
        },
        shell: {
          description:
            "For open/run without profile_id: shell executable path. Defaults to the platform shell (cmd.exe on Windows, $SHELL on Unix).",
          type: "string",
        },
        timeout_ms: {
          description:
            "For run/exec: max milliseconds to wait for the command to exit before killing it. Default 120000, max 600000.",
          type: "number",
        },
        title: {
          description:
            "For open: human-readable title shown in the terminal window tab.",
          type: "string",
        },
      },
      required: ["action"],
      type: "object",
    },
  },
  {
    description:
      "Control the app's dedicated browser window for the current Async session. Use this to open or steer pages, read visible page content, capture webpage screenshots, click or fill page elements, wait for selectors to appear, and inspect/update browser networking settings (User-Agent, Accept-Language, extra request headers, proxy) plus optional in-page fingerprint spoofing (navigator/screen/WebGL/Canvas/WebRTC) via `set_config.fingerprint`.",
    name: "Browser",
    parameters: {
      properties: {
        acceptLanguage: {
          description:
            "For set_config: override Accept-Language. Pass an empty string to clear it.",
          type: "string",
        },
        action: {
          description: "Browser action to perform.",
          enum: [
            "get_config",
            "get_state",
            "navigate",
            "read_page",
            "screenshot_page",
            "click_element",
            "input_text",
            "wait_for_selector",
            "close_sidebar",
            "reload",
            "stop",
            "go_back",
            "go_forward",
            "close_tab",
            "set_config",
            "reset_config",
          ],
          type: "string",
        },
        blockTrackers: {
          description:
            "For set_config: enable or disable blocking of common ad and tracking domains. Default true.",
          type: "boolean",
        },
        extraHeadersText: {
          description:
            "For set_config: extra request headers as plain text, one `Header-Name: value` per line. Pass an empty string to clear all custom headers.",
          type: "string",
        },
        file_path: {
          description:
            "For screenshot_page: optional output path. Workspace-relative or absolute inside the workspace. If omitted, the app saves to `.mai/browser-captures/` when a workspace is open, otherwise to a temp folder.",
          type: "string",
        },
        fingerprint: {
          description:
            "For set_config: optional partial fingerprint overrides injected on each top-level navigation (`dom-ready`). Omit to leave fingerprint unchanged. Pass `{}` to clear all overrides. Unset sub-fields keep their previous values; use empty string on string fields to drop that override.",
          properties: {
            audioNoiseSeed: {
              description:
                "Positive integer seed; enables subtle AudioContext oscillator path noise.",
              type: "number",
            },
            availHeightOffset: {
              description:
                "Pixels subtracted from screenHeight for screen.availHeight (taskbar). Default 40 in the injected script.",
              type: "number",
            },
            canvasNoiseSeed: {
              description:
                "Positive integer seed; enables subtle 2D canvas noise on toDataURL/toBlob for fingerprint diversity.",
              type: "number",
            },
            colorDepth: {
              description: "screen.colorDepth / pixelDepth.",
              type: "number",
            },
            deviceMemory: {
              description: "navigator.deviceMemory in GB (integer).",
              type: "number",
            },
            devicePixelRatio: {
              description: "window.devicePixelRatio (0.5–4).",
              type: "number",
            },
            hardwareConcurrency: {
              description: "navigator.hardwareConcurrency (integer).",
              type: "number",
            },
            languages: {
              description:
                'Comma-separated navigator.languages list, e.g. "en-US, en".',
              type: "string",
            },
            maskWebdriver: {
              description:
                "Force navigator.webdriver to false when true; set false to opt out while keeping other overrides.",
              type: "boolean",
            },
            platform: {
              description:
                "navigator.platform, e.g. Win32, MacIntel, Linux x86_64",
              type: "string",
            },
            screenHeight: {
              description:
                "screen.height; availHeight uses height minus offset.",
              type: "number",
            },
            screenWidth: {
              description: "screen.width / availWidth when height is set.",
              type: "number",
            },
            timezone: {
              description:
                "IANA timezone name for Intl.DateTimeFormat resolvedOptions spoofing.",
              type: "string",
            },
            timezoneOffsetMinutes: {
              description:
                "Value returned by Date.getTimezoneOffset() (minutes from UTC).",
              type: "number",
            },
            webglRenderer: {
              description:
                "UNMASKED_RENDERER_WEBGL string from WebGL getParameter.",
              type: "string",
            },
            webglVendor: {
              description:
                "UNMASKED_VENDOR_WEBGL string from WebGL getParameter.",
              type: "string",
            },
            webrtcPolicy: {
              description:
                "`block` disables RTCPeerConnection in the page; `default` leaves WebRTC unchanged.",
              enum: ["default", "block"],
              type: "string",
            },
          },
          type: "object",
        },
        include_html: {
          description:
            "For read_page: include truncated HTML for the selected root element in addition to visible text.",
          type: "boolean",
        },
        max_chars: {
          description:
            "For read_page: maximum visible text characters to return. Default about 12000, capped by the app.",
          type: "number",
        },
        new_tab: {
          description:
            "For navigate: open the target in a new tab instead of reusing the active tab.",
          type: "boolean",
        },
        press_enter: {
          description:
            "For input_text: after filling the value, dispatch Enter key events and submit the nearest form when possible.",
          type: "boolean",
        },
        proxyBypassRules: {
          description:
            "For set_config: optional Electron proxyBypassRules string.",
          type: "string",
        },
        proxyMode: {
          description:
            "For set_config: choose system proxy, no proxy, or custom proxy rules.",
          enum: ["system", "direct", "custom"],
          type: "string",
        },
        proxyRules: {
          description:
            "For set_config: Electron proxyRules string. Required when the resulting proxyMode is custom.",
          type: "string",
        },
        selector: {
          description:
            "For read_page: optional CSS selector to extract from instead of the whole page body. For click_element, input_text, and wait_for_selector: required CSS selector to target.",
          type: "string",
        },
        tab_id: {
          description:
            "Optional tab id for reload/stop/go_back/go_forward/close_tab/read_page/screenshot_page/click_element/input_text/wait_for_selector. Omit to target the active tab.",
          type: "string",
        },
        text: {
          description:
            "For input_text: the text value to place into the matched element. This replaces the current value or text content.",
          type: "string",
        },
        timeout_ms: {
          description:
            "For read_page, screenshot_page, wait_for_selector, click_element, and input_text: optional timeout for the browser-side operation.",
          type: "number",
        },
        url: {
          description:
            "For navigate: a URL or plain search text. Search text is opened as a Bing search, matching the browser UI behavior.",
          type: "string",
        },
        userAgent: {
          description:
            "For set_config: override User-Agent. Pass an empty string to clear it.",
          type: "string",
        },
        visible: {
          description:
            "For wait_for_selector: if true, require the matched element to be visible with non-zero size.",
          type: "boolean",
        },
        wait_for_load: {
          description:
            "For read_page, screenshot_page, click_element, input_text, and wait_for_selector: wait for the current page load to settle before operating. Default true.",
          type: "boolean",
        },
      },
      required: ["action"],
      type: "object",
    },
  },
  {
    description:
      "Capture HTTP traffic from Async's built-in browser for the current app session. Typical flow: start capture, use the Browser tool to navigate and interact, then list captured requests and inspect a specific request in detail.",
    name: "BrowserCapture",
    parameters: {
      properties: {
        action: {
          description: "Browser capture action to perform.",
          enum: [
            "get_state",
            "start",
            "stop",
            "clear",
            "list_requests",
            "get_request",
          ],
          type: "string",
        },
        clear_existing: {
          description:
            "For start: clear previously captured requests before arming capture. Default true.",
          type: "boolean",
        },
        limit: {
          description:
            "For list_requests: maximum number of items to return. Default 50, capped at 200.",
          type: "number",
        },
        offset: {
          description:
            "For list_requests: number of matching items to skip before returning results. Default 0.",
          type: "number",
        },
        query: {
          description:
            "For list_requests: optional case-insensitive substring filter applied to method, URL, content type, and error text.",
          type: "string",
        },
        request_id: {
          description:
            "For get_request: stable captured request id, as returned by list_requests. Takes precedence over seq.",
          type: "string",
        },
        seq: {
          description:
            "For get_request: captured request sequence number, as returned by list_requests.",
          type: "number",
        },
        status: {
          description:
            "For list_requests: optional exact HTTP status code filter.",
          type: "number",
        },
        tab_id: {
          description:
            "For list_requests: optional browser tab id to filter captured requests.",
          type: "string",
        },
      },
      required: ["action"],
      type: "object",
    },
  },
  {
    description:
      "AI-driven browser automation against the app's built-in browser via Playwright over CDP. Use this for **frontend automation testing**: navigating, interacting with elements, asserting outcomes, and capturing evidence. Each interaction is animated with a humanized cursor overlay (eased motion, hover delays, click ripples) so the user can see what the AI is doing.\n\n**When to use:** the user explicitly asks to test/verify a frontend feature in the browser, validate a UI flow, or reproduce a bug visually. Do NOT use for plain code reading, refactoring, or unit-testing tasks.\n\n**Locating elements (preferred order):** `role`+`role_name` (most robust) → `test_id` → `label` → `placeholder` → `text` → `selector` (CSS, last resort). Pass exactly one. Use `nth` to pick among matches.\n\n**Typical test flow:** `navigate` → `wait_for` (page ready) → `snapshot` (read accessibility tree) → `click`/`fill`/`press_key` → `assert` (verify outcome) → `screenshot` (evidence).",
    name: "Playwright",
    parameters: {
      properties: {
        action: {
          description: "Playwright action to perform.",
          enum: [
            "status",
            "navigate",
            "click",
            "hover",
            "fill",
            "press_key",
            "scroll",
            "wait_for",
            "evaluate",
            "snapshot",
            "screenshot",
            "assert",
          ],
          type: "string",
        },
        clear_first: {
          description:
            "For fill: select-all + delete before typing. Default true.",
          type: "boolean",
        },
        delta_y: {
          description:
            "For scroll: vertical pixels to scroll. Positive = down.",
          type: "number",
        },
        expect: {
          description:
            "For assert: which assertion to perform. Default visible.",
          enum: [
            "visible",
            "hidden",
            "has_text",
            "has_value",
            "has_count",
            "url_matches",
          ],
          type: "string",
        },
        expected_count: {
          description: "For assert with has_count: required match count.",
          type: "number",
        },
        expected_text: {
          description:
            "For assert with has_text/has_value/url_matches: expected substring or regex.",
          type: "string",
        },
        expression: {
          description:
            "For evaluate: JavaScript body executed in the page (async). Return a JSON-serializable value. Wrapped in `(async () => { ... })()`.",
          type: "string",
        },
        file_path: {
          description:
            "For screenshot: optional output path. If omitted, saves to `.mai/pw-captures/` under the workspace.",
          type: "string",
        },
        full_page: {
          description:
            "For screenshot: capture full scrollable page instead of viewport. Default false.",
          type: "boolean",
        },
        key: {
          description:
            'For press_key: e.g. "Enter", "Escape", "Tab", "Control+A".',
          type: "string",
        },
        label: {
          description:
            "For element actions: locate form control by associated <label>.",
          type: "string",
        },
        label_text: {
          description:
            'Optional: short text shown next to the animated cursor while the action runs (e.g. "点击登录"). Helps the user follow what the AI is doing.',
          type: "string",
        },
        max_chars: {
          description:
            "For snapshot: maximum characters of accessibility tree to return. Default 8000.",
          type: "number",
        },
        max_per_char_ms: {
          description:
            "For fill: maximum delay between characters in ms. Default 160.",
          type: "number",
        },
        min_per_char_ms: {
          description:
            "For fill: minimum delay between characters in ms. Default 60.",
          type: "number",
        },
        nth: {
          description:
            "For element actions: 0-based index when the locator matches multiple elements.",
          type: "number",
        },
        placeholder: {
          description: "For element actions: locate input by placeholder text.",
          type: "string",
        },
        role: {
          description:
            "For element actions: ARIA role (button, link, textbox, checkbox, heading, etc). Most robust locator.",
          type: "string",
        },
        role_exact: {
          description:
            "For role+name: require exact name match instead of substring.",
          type: "boolean",
        },
        role_name: {
          description:
            "For element actions with role: accessible name to disambiguate. Often the visible label.",
          type: "string",
        },
        selector: {
          description:
            "For element actions: CSS selector. Use only when accessible locators are insufficient.",
          type: "string",
        },
        state: {
          description:
            "For wait_for: target visibility state. Default visible. Omit locator args to wait for page load instead.",
          enum: ["attached", "detached", "visible", "hidden"],
          type: "string",
        },
        step_delay_ms: {
          description: "For scroll: delay between wheel steps. Default 30.",
          type: "number",
        },
        step_px: {
          description:
            "For scroll: pixels per wheel step. Default 120 (smoother = lower).",
          type: "number",
        },
        tab_id: {
          description:
            "Optional: target a specific browser tab. Omit for the active tab.",
          type: "string",
        },
        test_id: {
          description: "For element actions: locate by data-testid attribute.",
          type: "string",
        },
        text: {
          description: "For element actions: locate by visible text content.",
          type: "string",
        },
        text_exact: {
          description: "For text locator: require exact match. Default false.",
          type: "boolean",
        },
        timeout_ms: {
          description:
            "For wait_for/navigate/assert: per-operation timeout in ms.",
          type: "number",
        },
        url: {
          description:
            "For navigate: target URL (absolute, including protocol).",
          type: "string",
        },
        value: {
          description: "For fill: text value to type into the located element.",
          type: "string",
        },
        wait_until: {
          description:
            "For navigate: when to consider navigation complete. Default load.",
          enum: ["load", "domcontentloaded", "networkidle", "commit"],
          type: "string",
        },
      },
      required: ["action"],
      type: "object",
    },
  },
  {
    description:
      "Language-server intelligence for the workspace, routed by **file extension** to LSP servers declared in plugin dirs under `<maiData>/plugins/<name>/` or `<workspace>/.mai/plugins/<name>/` with **`.lsp.json`** or **`plugin.json` → `lspServers`** (each server: **command**, optional **args**, required **extensionToLanguage** map). Legacy **`lsp.servers`** in settings.json is still merged. TS/JS additionally works if **typescript-language-server** is discoverable under the app or workspace `node_modules` (optional).\n\nOperations: goToDefinition, findReferences, hover, documentSymbol, workspaceSymbol, goToImplementation, prepareCallHierarchy, incomingCalls, outgoingCalls, getDiagnostics. Use **filePath** plus 1-based **line**/**character** except **getDiagnostics**/**workspaceSymbol** (optional line/char).\n\nIf nothing matches the file extension, add a plugin or legacy server entry. If an LSP method fails, fall back to **Read** / **Grep** / **Bash**.",
    name: "LSP",
    parameters: {
      properties: {
        character: {
          description:
            "1-based character offset on the line (required for cursor-based operations).",
          type: "number",
        },
        filePath: {
          description:
            "Path to the file: workspace-relative, or absolute if under the workspace root. Required for all operations (including workspaceSymbol, which still anchors context on this file).",
          type: "string",
        },
        line: {
          description:
            "1-based line number (required for cursor-based operations).",
          type: "number",
        },
        operation: {
          description: "Which LSP operation to run.",
          enum: [
            "goToDefinition",
            "findReferences",
            "hover",
            "documentSymbol",
            "workspaceSymbol",
            "goToImplementation",
            "prepareCallHierarchy",
            "incomingCalls",
            "outgoingCalls",
            "getDiagnostics",
          ],
          type: "string",
        },
      },
      required: ["operation", "filePath"],
      type: "object",
    },
  },
  {
    description:
      'Spawn a focused sub-agent. Use for scoped, autonomous work: deep codebase exploration, refactors isolated to a module, or keeping your main context clean. The sub-agent runs a full tool loop and returns its final text. With background fork enabled, omitting subagent_type (or setting run_in_background) lets work continue asynchronously while the tool returns immediately and progress is reflected in the sub-agent card/sidebar. Set subagent_type to "explore" for read-only exploration; use a custom name from user subagent settings for tailored instructions. Set fork_context to true to copy the current visible thread history into the child agent. Nested Agent calls are blocked. Maximum nesting depth is 1.',
    name: "Agent",
    parameters: {
      properties: {
        context: {
          description:
            "Optional paths, constraints, or background for the sub-agent",
          type: "string",
        },
        fork_context: {
          description:
            "If true, copy the current visible conversation history into the spawned agent before adding the new task message.",
          type: "boolean",
        },
        prompt: {
          description: "Instructions for the sub-agent (`prompt`)",
          type: "string",
        },
        run_in_background: {
          description:
            "If true, the sub-agent runs in the background: the tool returns immediately with a short notice, nested activity still streams, and the user gets a completion toast when it finishes.",
          type: "boolean",
        },
        subagent_type: {
          description:
            'Optional: "explore" for read-only exploration; or match a configured subagent name/id for tailored instructions. Omit when using background fork (settings / env) for async execution.',
          type: "string",
        },
      },
      required: ["prompt"],
      type: "object",
    },
  },
  {
    description:
      "Send a follow-up message to an existing sub-agent. Use interrupt=true to stop its current run and handle the new message immediately.",
    name: "send_input",
    parameters: {
      properties: {
        interrupt: {
          description:
            "If true, abort the current run and prioritize this new message.",
          type: "boolean",
        },
        message: {
          description: "Plain text message to deliver to the target sub-agent.",
          type: "string",
        },
        target: {
          description: "Agent id returned or shown for the target sub-agent.",
          type: "string",
        },
      },
      required: ["target", "message"],
      type: "object",
    },
  },
  {
    description:
      "Wait for one or more sub-agents to finish. Returns the final statuses that completed before the timeout.",
    name: "wait_agent",
    parameters: {
      properties: {
        targets: {
          description: "One or more agent ids to wait for.",
          items: { type: "string" },
          type: "array",
        },
        timeout_ms: {
          description: "Optional timeout in milliseconds. Defaults to 30000.",
          type: "number",
        },
      },
      required: ["targets"],
      type: "object",
    },
  },
  {
    description:
      "Resume a paused or previously closed sub-agent when it has stored context and can continue.",
    name: "resume_agent",
    parameters: {
      properties: {
        id: {
          description: "Agent id to resume.",
          type: "string",
        },
      },
      required: ["id"],
      type: "object",
    },
  },
  {
    description:
      "Close a running or resumable sub-agent and any of its descendants.",
    name: "close_agent",
    parameters: {
      properties: {
        target: {
          description: "Agent id to close.",
          type: "string",
        },
      },
      required: ["target"],
      type: "object",
    },
  },
  {
    description:
      'Ask the user for 1-3 short structured answers. Each question must include an id, a short header, the question text, and 2-3 recommended options. The UI automatically adds a freeform "Other" field for each question, and the tool result returns a JSON object mapping question ids to the user\'s final answers.',
    name: "request_user_input",
    parameters: {
      properties: {
        questions: {
          description: "1-3 structured questions to ask the user.",
          items: {
            properties: {
              header: {
                description: "Short header label shown in the UI.",
                type: "string",
              },
              id: {
                description:
                  "Stable snake_case id used in the returned answers object.",
                type: "string",
              },
              options: {
                description:
                  "2-3 recommended options shown before the automatic Other field.",
                items: {
                  properties: {
                    description: {
                      description:
                        "One sentence explaining the tradeoff or impact of selecting it.",
                      type: "string",
                    },
                    label: {
                      description: "Short option label.",
                      type: "string",
                    },
                  },
                  required: ["label", "description"],
                  type: "object",
                },
                type: "array",
              },
              question: {
                description: "Single user-facing question.",
                type: "string",
              },
            },
            required: ["id", "header", "question", "options"],
            type: "object",
          },
          type: "array",
        },
      },
      required: ["questions"],
      type: "object",
    },
  },
  {
    description:
      "List available resources from configured MCP (Model Context Protocol) servers. Each returned resource includes standard MCP resource fields plus a **server** field indicating which configured server it belongs to.\n\nParameters:\n- **server** (optional): id or display name of a specific MCP server; omit to return resources from all connected servers.\n\nRequires MCP servers to be connected (enabled in settings).",
    name: "ListMcpResourcesTool",
    parameters: {
      properties: {
        server: {
          description:
            "Optional. MCP server id or display name; if omitted, resources from every connected server are listed.",
          type: "string",
        },
      },
      required: [],
      type: "object",
    },
  },
  {
    description:
      "Read a specific resource from an MCP server by **server** name and resource **uri**.\n\nParameters:\n- **server** (required): MCP server id or display name as configured.\n- **uri** (required): the resource URI to read.\n\nCall **ListMcpResourcesTool** first when you need to discover URIs.",
    name: "ReadMcpResourceTool",
    parameters: {
      properties: {
        server: {
          description:
            "MCP server id or display name from which to read the resource.",
          type: "string",
        },
        uri: { description: "The resource URI to read.", type: "string" },
      },
      required: ["server", "uri"],
      type: "object",
    },
  },
  {
    description:
      "Search deferred tools that are not currently loaded into the model-visible tool list. Use this when you need an MCP integration but do not yet know the exact `mcp__server__tool` name. Matching tools are loaded for the next assistant turn so you can call them directly after this tool returns.",
    name: "ToolSearch",
    parameters: {
      properties: {
        limit: {
          description:
            "Maximum number of matching tools to load. Default 8, maximum 12.",
          type: "number",
        },
        query: {
          description:
            'Keywords for the capability you need, such as "github issues", "postgres query", or "browser automation".',
          type: "string",
        },
        server: {
          description:
            "Optional MCP server id/name fragment to narrow the search before matching tools.",
          type: "string",
        },
      },
      required: [],
      type: "object",
    },
  },
  {
    description:
      "Mark the boundary between the preflight phase (thinking, exploration, tool calls) and the outcome phase (your final answer / summary / file edits / commands). Call this tool exactly once, immediately before you start producing the final answer for the user. After calling this tool you may proceed to write the summary markdown, perform Edit / Write, or output command fences — all of those will be rendered outside the preflight shell. Do NOT call this tool while you are still exploring or thinking; the very first call wins and cannot be reversed in the same turn. Skip this tool entirely if your reply has no exploration phase (e.g. a one-shot answer with no tools).",
    name: "begin_outcome",
    parameters: {
      properties: {},
      required: [],
      type: "object",
    },
  },
  {
    description:
      "Spawn a sub-agent task that runs asynchronously. Returns immediately with a task id (#N) that you can later inspect via **TaskGet** / **TaskOutput**, drive via **TaskUpdate**, or cancel via **TaskStop**. Use for scoped sub-work you want to fire-and-forget while you keep working: deep exploration, isolated refactors, parallel investigations. Set **subagent_type** to `explore` for read-only, or to a configured custom subagent name. Set **fork_context** to copy the current visible thread history. Do NOT use TaskCreate as a todo list — only spawn one when there is real work for a sub-agent to do.",
    name: "TaskCreate",
    parameters: {
      properties: {
        context: {
          description:
            "Optional paths, constraints, or background to give the sub-agent.",
          type: "string",
        },
        fork_context: {
          description:
            "If true, copy the current visible conversation history into the spawned task before adding the new prompt.",
          type: "boolean",
        },
        prompt: {
          description:
            "Instructions for the sub-agent (the task it should execute).",
          type: "string",
        },
        subagent_type: {
          description:
            'Optional: "explore" for read-only exploration; or match a configured subagent name/id for tailored instructions.',
          type: "string",
        },
      },
      required: ["prompt"],
      type: "object",
    },
  },
  {
    description:
      "List all sub-agent tasks in the current session, with id, status (running / waiting_input / completed / failed / closed), background flag, subagent type, and short title. Optional **status** filter narrows results to a single lifecycle state.",
    name: "TaskList",
    parameters: {
      properties: {
        status: {
          description: "Optional: only list tasks matching this status.",
          enum: ["running", "waiting_input", "completed", "failed", "closed"],
          type: "string",
        },
      },
      required: [],
      type: "object",
    },
  },
  {
    description:
      "Get full metadata (status, title, subagent type, parent/child relationships, timestamps, last result/error summaries) for a single sub-agent task by id. Read-only and non-blocking. Use this to check progress of a task spawned via **TaskCreate** without consuming its full output.",
    name: "TaskGet",
    parameters: {
      properties: {
        taskId: {
          description:
            'The task id (e.g. "agent-3"), as returned by TaskCreate or TaskList.',
          type: "string",
        },
      },
      required: ["taskId"],
      type: "object",
    },
  },
  {
    description:
      "Read the conversation messages produced so far by a sub-agent task. Returns immediately (does NOT wait for the task to finish). Set **last** to limit to the last N messages. Use this to inspect partial output of a long-running TaskCreate, or to retrieve the final result after TaskGet shows status=completed.",
    name: "TaskOutput",
    parameters: {
      properties: {
        last: {
          description: "Optional: only return the last N messages.",
          type: "number",
        },
        taskId: { description: "The task id.", type: "string" },
      },
      required: ["taskId"],
      type: "object",
    },
  },
  {
    description:
      "Send a follow-up message to an existing sub-agent task. Use **interrupt: true** to stop the task's current run and prioritize this new message. Use this to clarify, redirect, or supply missing input to a running task — equivalent to typing a follow-up message in the sub-agent's thread.",
    name: "TaskUpdate",
    parameters: {
      properties: {
        interrupt: {
          description:
            "If true, abort the current run and prioritize this new message.",
          type: "boolean",
        },
        message: {
          description: "Plain text message to deliver to the task.",
          type: "string",
        },
        taskId: { description: "The target task id.", type: "string" },
      },
      required: ["taskId", "message"],
      type: "object",
    },
  },
  {
    description:
      "Stop a running or resumable sub-agent task and release its resources. The task ends in `closed` status and any nested children are also stopped. Use only when you no longer need the task's output.",
    name: "TaskStop",
    parameters: {
      properties: {
        taskId: { description: "The task id to stop.", type: "string" },
      },
      required: ["taskId"],
      type: "object",
    },
  },
  {
    description:
      "Clarification tool: ask the user ONE multiple-choice clarification whenever you need missing information before proceeding. Provide exactly 4 options total, where the first 3 are concrete recommendations and the 4th is an Other/custom option for free text. The app shows a picker and custom input; your next turn receives the user answer as this tool's result text. Call at most one per assistant turn; wait for the result before asking another question or continuing. Do not duplicate the same question in markdown.",
    name: "ask_plan_question",
    parameters: {
      properties: {
        options: {
          description:
            "Exactly 4 options: the first 3 are concrete answer choices, and the 4th must be Other/custom so the user can type their own answer. Each item may be a string label, or an object { id, label }.",
          items: {
            oneOf: [
              { type: "string" },
              {
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                },
                required: ["label"],
                type: "object",
              },
            ],
          },
          type: "array",
        },
        question: {
          description:
            "Single concrete question (1–2 short sentences), same language as the user.",
          type: "string",
        },
      },
      required: ["question", "options"],
      type: "object",
    },
  },
  {
    description:
      "Submit the structured plan draft for Plan mode. Must be called exactly once when the plan is ready.",
    name: "plan_submit_draft",
    parameters: {
      properties: {
        executionOverview: {
          description: "High-level sequencing or milestone bullets.",
          items: { type: "string" },
          type: "array",
        },
        filesToChange: {
          description: "Planned file changes.",
          items: {
            properties: {
              action: { enum: ["Edit", "New", "Delete"], type: "string" },
              description: { type: "string" },
              path: { type: "string" },
            },
            required: ["path", "action", "description"],
            type: "object",
          },
          type: "array",
        },
        goal: {
          description: "One or two sentence goal summary.",
          type: "string",
        },
        implementationSteps: {
          description: "Ordered implementation steps.",
          items: {
            properties: {
              description: { type: "string" },
              title: { type: "string" },
            },
            required: ["title", "description"],
            type: "object",
          },
          type: "array",
        },
        openQuestions: {
          description: "Outstanding open questions.",
          items: { type: "string" },
          type: "array",
        },
        risksAndEdgeCases: {
          description: "Important risks and edge cases.",
          items: { type: "string" },
          type: "array",
        },
        scopeContext: {
          description: "Key scope or context bullets.",
          items: { type: "string" },
          type: "array",
        },
        title: { description: "Concise plan title.", type: "string" },
        todos: {
          description: "Checklist items for the plan.",
          items: {
            properties: {
              content: { type: "string" },
              id: { type: "string" },
              status: { enum: ["pending", "completed"], type: "string" },
            },
            required: ["content"],
            type: "object",
          },
          type: "array",
        },
      },
      required: ["title", "goal", "implementationSteps", "todos"],
      type: "object",
    },
  },
  {
    description:
      "Search the web for up-to-date information that is not available in the workspace. Use this for current documentation, API references, news, or facts that may have changed after the training cutoff. The tool opens a search engine and returns the visible text from the results page, including result titles, URLs, and snippets. Keep queries concise and specific.",
    name: "WebSearch",
    parameters: {
      properties: {
        query: {
          description:
            "Search query text. Be specific; include key terms, version numbers, or error messages when applicable.",
          type: "string",
        },
      },
      required: ["query"],
      type: "object",
    },
  },
  {
    description:
      "Send an HTTP request to a URL and return the response. Use this for API calls, webhooks, fetching JSON or HTML, or any scenario where you need data from a remote endpoint without opening a browser. Supports GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS. Only HTTP and HTTPS URLs are allowed.",
    name: "Fetch",
    parameters: {
      properties: {
        body: {
          description:
            "Optional request body as a raw string. For JSON payloads, pass the serialized JSON here and set Content-Type header accordingly.",
          type: "string",
        },
        headers: {
          description:
            'Optional request headers as a flat object of string values (e.g. {"Content-Type": "application/json"}).',
          type: "object",
        },
        method: {
          description: "HTTP method. Defaults to GET.",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
          type: "string",
        },
        url: {
          description: "Target URL. Must start with http:// or https://.",
          type: "string",
        },
      },
      required: ["url"],
      type: "object",
    },
  },
];

export function toOpenAITools(defs: AgentToolDef[]) {
  return buildOpenAIToolSchemas(defs);
}

export function toAnthropicTools(
  defs: AgentToolDef[],
  options?: {
    deferToolNames?: Iterable<string>;
    includeExperimentalBetaFields?: boolean;
  }
): AnthropicToolSchema[] {
  return buildAnthropicToolSchemas(defs, options);
}
