import type { SVGProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function extOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

export function isRasterImageFileName(fileName: string): boolean {
  return [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "ico",
    "bmp",
    "avif",
    "heic",
    "tiff",
    "tif",
  ].includes(extOf(fileName));
}

export function isRasterImageRelPath(relPath: string): boolean {
  const name = relPath.replace(/\\/g, "/").split("/").pop() || relPath;
  return isRasterImageFileName(name);
}

/** 资源管理器：文件夹与按扩展名区分的文件图标（高辨识度、暗色主题友好） */
export function FileTypeIcon({
  fileName,
  isDirectory,
  className,
}: {
  fileName: string;
  isDirectory: boolean;
  className?: string;
}) {
  if (isDirectory) {
    return <IconFolder className={className} />;
  }

  const ext = extOf(fileName);

  if (ext === "py" || ext === "pyw" || ext === "pyi") {
    return <IconPython className={className} />;
  }

  if (ext === "svg" || ext === "svgz") {
    return <IconSvgImage className={className} />;
  }

  if (isRasterImageFileName(fileName)) {
    return <IconRasterImage className={className} ext={ext} />;
  }

  if (ext === "json" || ext === "jsonc") {
    return <IconJson className={className} />;
  }

  if (ext === "sql") {
    return <IconSql className={className} />;
  }

  if (["ts", "tsx"].includes(ext)) {
    return <IconTs className={className} />;
  }

  if (["js", "jsx", "mjs", "cjs"].includes(ext)) {
    return <IconJs className={className} />;
  }

  if (["md", "mdx"].includes(ext)) {
    return <IconMd className={className} />;
  }

  if (["css", "scss", "less"].includes(ext)) {
    return <IconCss className={className} />;
  }

  if (["html", "htm"].includes(ext)) {
    return <IconHtml className={className} />;
  }

  if (["yml", "yaml"].includes(ext)) {
    return <IconYaml className={className} />;
  }

  if (
    ["rs", "go", "java", "kt", "swift", "c", "h", "cpp", "hpp", "cs"].includes(
      ext
    )
  ) {
    return <IconCode className={className} color="#a78bfa" />;
  }

  if (["ttf", "woff", "woff2", "otf"].includes(ext)) {
    return <IconFont className={className} />;
  }

  if (ext === "txt" || ext === "log") {
    return <IconText className={className} />;
  }

  return <IconFile className={className} />;
}

function basenameFromRelPath(relPath: string): string {
  const n = relPath.replace(/\\/g, "/");
  return n.split("/").pop() || n;
}

/**
 * 与 {@link FileTypeIcon}、@ 菜单一致：用于 contenteditable 内 chip 等纯 DOM（避免仅用 CSS 扩展名色块与菜单图标不一致）。
 */
export function fileTypeIconHtmlForRelPath(
  relPath: string,
  isDirectory = false
): string {
  const fileName = basenameFromRelPath(relPath);
  return renderToStaticMarkup(
    <FileTypeIcon
      className="ref-inline-file-chip-svg"
      fileName={fileName}
      isDirectory={isDirectory}
    />
  );
}

/** 近似 PSF 双色蛇形：蓝 / 黄椭圆交错 + 眼睛，避免渐变 id 冲突用实色 + 轻微透明度叠层 */
function IconPython({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <ellipse
        cx="9.2"
        cy="10.5"
        fill="#306998"
        rx="5.4"
        ry="6.8"
        transform="rotate(-52 9.2 10.5)"
      />
      <ellipse
        cx="14.8"
        cy="13.5"
        fill="#ffd43b"
        rx="5.4"
        ry="6.8"
        transform="rotate(-52 14.8 13.5)"
      />
      <circle cx="6.9" cy="8.4" fill="#f8fafc" r="1" />
      <circle cx="17.1" cy="15.6" fill="#1e293b" r="1" />
    </svg>
  );
}

/** 照片：画框 + 天蓝到紫的叠色 + 太阳 + 山影；GIF 左下角小绿标 */
function IconRasterImage({ className, ext }: IconProps & { ext: string }) {
  const isGif = ext === "gif";
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill="#38bdf8"
        height="15"
        rx="2.5"
        stroke="#cbd5e1"
        strokeWidth="1"
        width="17"
        x="3.5"
        y="4.5"
      />
      <rect
        fill="#6366f1"
        fillOpacity="0.45"
        height="15"
        rx="2.5"
        width="17"
        x="3.5"
        y="4.5"
      />
      <circle
        cx="17.2"
        cy="8.3"
        fill="#fef08a"
        r="2.3"
        stroke="#facc15"
        strokeWidth="0.35"
      />
      <path
        d="M3.5 17.8L8.2 12.5l3.1 3.2 3.6-4.1 6.2 6.2H3.5z"
        fill="#0f172a"
        fillOpacity="0.33"
      />
      {isGif ? (
        <circle
          cx="6.2"
          cy="17.2"
          fill="#22c55e"
          r="2"
          stroke="#14532d"
          strokeWidth="0.5"
        />
      ) : null}
    </svg>
  );
}

/** 矢量：W3C SVG 系橙色 + 曲线与节点点 */
function IconSvgImage({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill="#fff7ed"
        height="18"
        rx="3"
        stroke="#ea580c"
        strokeWidth="1"
        width="18"
        x="3"
        y="3"
      />
      <path
        d="M7 16.5c2-4 3.5-6 5.5-6s3.5 2 5.5 6"
        fill="none"
        stroke="#ea580c"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
      <circle cx="8" cy="9" fill="#ea580c" r="1.1" />
      <circle cx="12" cy="7.5" fill="#ea580c" r="1.1" />
      <circle cx="16" cy="9" fill="#ea580c" r="1.1" />
    </svg>
  );
}

function IconFolder({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M4 7.5a2 2 0 012-2h3.2l1.6 1.6H18a2 2 0 012 2V17a2 2 0 01-2 2H6a2 2 0 01-2-2V7.5z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeLinejoin="round"
        strokeWidth="0.9"
      />
      <path
        d="M4 9.5h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z"
        fill="#fbbf24"
        fillOpacity="0.5"
      />
    </svg>
  );
}

function IconJson({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill="#1e293b"
        height="18"
        rx="2.5"
        stroke="#475569"
        strokeWidth="1"
        width="16"
        x="4"
        y="3"
      />
      <path
        d="M8 8c-1 0-1.5.5-1.5 1.5v1c0 .8-.3 1.2-1 1.2v1.6c.7 0 1 .4 1 1.2v1c0 1 .5 1.5 1.5 1.5M16 8c1 0 1.5.5 1.5 1.5v1c0 .8.3 1.2 1 1.2v1.6c-.7 0-1 .4-1 1.2v1c0 1-.5 1.5-1.5 1.5"
        stroke="#fbbf24"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function IconSql({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <ellipse cx="12" cy="6" fill="#3b82f6" opacity="0.95" rx="7" ry="3" />
      <path
        d="M5 6v6c0 1.5 3 3 7 3s7-1.5 7-3V6"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="1"
      />
      <path
        d="M5 12v4c0 1.5 3 3 7 3s7-1.5 7-3v-4"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="1"
      />
    </svg>
  );
}

function IconTs({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect fill="#3178c6" height="24" rx="4" width="24" />
      <text
        fill="#fff"
        fontFamily="system-ui, Segoe UI, sans-serif"
        fontSize="10"
        fontWeight="800"
        textAnchor="middle"
        x="12"
        y="16.5"
      >
        TS
      </text>
    </svg>
  );
}

function IconJs({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect fill="#f7df1e" height="24" rx="4" width="24" />
      <text
        fill="#323330"
        fontFamily="system-ui, Segoe UI, sans-serif"
        fontSize="10"
        fontWeight="800"
        textAnchor="middle"
        x="12"
        y="16.5"
      >
        JS
      </text>
    </svg>
  );
}

function IconMd({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill="#334155"
        height="18"
        rx="2.5"
        stroke="#64748b"
        strokeWidth="1"
        width="16"
        x="4"
        y="3"
      />
      <path
        d="M8 9v6l2-2 2 2V9M16 9h2v6h-2M16 12h2"
        stroke="#e2e8f0"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function IconCss({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect fill="#264de4" height="24" rx="4" width="24" />
      <text
        fill="#fff"
        fontFamily="system-ui, sans-serif"
        fontSize="7.5"
        fontWeight="800"
        textAnchor="middle"
        x="12"
        y="15.5"
      >
        CSS
      </text>
    </svg>
  );
}

function IconHtml({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect fill="#e34f26" height="24" rx="4" width="24" />
      <text
        fill="#fff"
        fontFamily="system-ui, sans-serif"
        fontSize="6.5"
        fontWeight="800"
        textAnchor="middle"
        x="12"
        y="15"
      >
        HTML
      </text>
    </svg>
  );
}

function IconYaml({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill="#27272a"
        height="18"
        rx="2.5"
        stroke="#52525b"
        strokeWidth="1"
        width="16"
        x="4"
        y="3"
      />
      <text
        fill="#eab308"
        fontFamily="ui-monospace, monospace"
        fontSize="6.5"
        fontWeight="800"
        textAnchor="middle"
        x="12"
        y="14.5"
      >
        YML
      </text>
    </svg>
  );
}

function IconCode({ className, color }: IconProps & { color: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill={color}
        fillOpacity="0.22"
        height="16"
        rx="2.5"
        stroke={color}
        strokeWidth="1"
        width="16"
        x="4"
        y="4"
      />
      <path
        d="M9 9l-3 3 3 3M15 9l3 3-3 3"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconFont({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        fill="#44403c"
        height="18"
        rx="2.5"
        stroke="#78716c"
        strokeWidth="1"
        width="16"
        x="4"
        y="3"
      />
      <text
        fill="#e7e5e4"
        fontFamily="Georgia, serif"
        fontSize="9"
        fontWeight="700"
        textAnchor="middle"
        x="12"
        y="15.5"
      >
        Aa
      </text>
    </svg>
  );
}

function IconText({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M7 4h10v2.2H12V20h-2V6.2H7V4z" fill="#94a3b8" />
    </svg>
  );
}

function IconFile({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M14 2H7.5A2.5 2.5 0 005 4.5v15A2.5 2.5 0 007.5 22h9a2.5 2.5 0 002.5-2.5V8L14 2z"
        fill="#3f3f46"
        stroke="#71717a"
        strokeLinejoin="round"
        strokeWidth="1"
      />
      <path
        d="M14 2v5.5a1 1 0 001 1H21"
        fill="none"
        stroke="#71717a"
        strokeWidth="1"
      />
      <path
        d="M14.5 2.5L20.5 8"
        opacity="0.6"
        stroke="#52525b"
        strokeWidth="0.75"
      />
    </svg>
  );
}

export function languageFromFilePath(relPath: string): string {
  const ext = extOf(relPath.split("/").pop() ?? relPath);
  const map: Record<string, string> = {
    c: "c",
    cjs: "javascript",
    cpp: "cpp",
    cs: "csharp",
    css: "css",
    go: "go",
    h: "c",
    hpp: "cpp",
    htm: "html",
    html: "html",
    java: "java",
    js: "javascript",
    json: "json",
    jsonc: "json",
    jsx: "javascript",
    kt: "kotlin",
    less: "less",
    md: "markdown",
    mdx: "markdown",
    mjs: "javascript",
    ps1: "powershell",
    py: "python",
    rs: "rust",
    scss: "scss",
    sh: "shell",
    sql: "sql",
    swift: "swift",
    ts: "typescript",
    tsx: "typescript",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
  };
  return map[ext] ?? "plaintext";
}
