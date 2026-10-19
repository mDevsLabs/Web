"use client";
"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var code_block_exports = {};
__export(code_block_exports, {
  CodeBlock: () => CodeBlock
});
module.exports = __toCommonJS(code_block_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function CodeBlock({ code, language = "text", label = "Exemple de code", copyLabel = "Copier le code", onCopied, onCopyError, className, ...props }) {
  const [message, setMessage] = (0, import_react.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { ...props, className: (0, import_utils.cx)("md-code-block", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", { children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-badge", children: language }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", onClick: async () => {
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { tabIndex: 0, "aria-label": label, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "status", className: "md-muted", children: message })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CodeBlock
});
