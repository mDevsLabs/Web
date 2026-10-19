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
var empty_state_exports = {};
__export(empty_state_exports, {
  EmptyState: () => EmptyState
});
module.exports = __toCommonJS(empty_state_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function EmptyState({ heading, description, action, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-empty", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-empty-mark", "aria-hidden": "true", children: "\u25C7" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: heading }),
    description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-muted", children: description }),
    action
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EmptyState
});
