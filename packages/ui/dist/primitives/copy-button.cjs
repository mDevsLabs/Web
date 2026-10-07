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
var copy_button_exports = {};
__export(copy_button_exports, {
  CopyButton: () => CopyButton
});
module.exports = __toCommonJS(copy_button_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function CopyButton({ value, onCopied, onError, children = "Copier", className, ...props }) {
  const [copied, setCopied] = (0, import_react.useState)(false);
  const timer = (0, import_react.useRef)(void 0);
  (0, import_react.useEffect)(() => () => clearTimeout(timer.current), []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { ...props, type: "button", className: (0, import_utils.cx)("md-button md-button-soft", className), onClick: async (e) => {
    props.onClick?.(e);
    if (e.defaultPrevented)
      return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      onError?.(error);
    }
  }, children: [
    copied ? "Copi\xE9" : children,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-sr-only", role: "status", children: copied ? "Copi\xE9 dans le presse-papiers." : "" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CopyButton
});
