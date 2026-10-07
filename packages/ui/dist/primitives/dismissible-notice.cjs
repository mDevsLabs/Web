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
var dismissible_notice_exports = {};
__export(dismissible_notice_exports, {
  DismissibleNotice: () => DismissibleNotice
});
module.exports = __toCommonJS(dismissible_notice_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function DismissibleNotice({ heading, children, onDismiss, tone = "neutral", className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, role: tone === "danger" ? "alert" : "status", "aria-labelledby": id, className: (0, import_utils.cx)("md-inline-notice md-glass", className), "data-tone": tone, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { id, children: heading }),
      children && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", "aria-label": `Fermer : ${heading}`, onClick: onDismiss, children: "\xD7" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DismissibleNotice
});
