"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cx } from "../internal/utils.js";
function CodeBlock({ code, language = "text", label = "Exemple de code", copyLabel = "Copier le code", onCopied, onCopyError, className, ...props }) {
  const [message, setMessage] = useState("");
  return /* @__PURE__ */ jsxs("figure", { ...props, className: cx("md-code-block", className), children: [
    /* @__PURE__ */ jsxs("figcaption", { children: [
      label,
      /* @__PURE__ */ jsx("span", { className: "md-badge", children: language }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", onClick: async () => {
        try {
          await navigator.clipboard.writeText(code);
          setMessage("Code copi\xE9.");
          onCopied?.();
        } catch (error) {
          setMessage("Copie impossible. S\xE9lectionnez le texte.");
          onCopyError?.(error);
        }
      }, children: copyLabel })
    ] }),
    /* @__PURE__ */ jsx("pre", { tabIndex: 0, "aria-label": label, children: /* @__PURE__ */ jsx("code", { children: code }) }),
    /* @__PURE__ */ jsx("p", { role: "status", className: "md-muted", children: message })
  ] });
}
export {
  CodeBlock
};
