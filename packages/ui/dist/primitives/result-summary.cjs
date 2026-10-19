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
var result_summary_exports = {};
__export(result_summary_exports, {
  ResultSummary: () => ResultSummary
});
module.exports = __toCommonJS(result_summary_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function ResultSummary({ total, page, pageSize, label = "r\xE9sultats", className, ...props }) {
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(Math.max(1, Math.ceil(count / size)), Math.floor(page))) : 1;
  const start = count ? (current - 1) * size + 1 : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { ...props, role: "status", className: (0, import_utils.cx)("md-muted", className), children: [
    start,
    "\u2013",
    Math.min(count, current * size),
    " sur ",
    count,
    " ",
    label
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ResultSummary
});
