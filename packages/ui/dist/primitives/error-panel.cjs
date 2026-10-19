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
var error_panel_exports = {};
__export(error_panel_exports, {
  ErrorPanel: () => ErrorPanel
});
module.exports = __toCommonJS(error_panel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function ErrorPanel({ heading, message, details, reference, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, role: "alert", "aria-labelledby": id, className: (0, import_utils.cx)("md-error-panel md-glass md-pad-md", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { id, children: heading }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message }),
    reference && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "md-muted", children: [
      "R\xE9f\xE9rence : ",
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: reference })
    ] }),
    details && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: "D\xE9tails techniques" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: details })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ErrorPanel
});
