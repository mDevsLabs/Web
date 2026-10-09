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
var progress_exports = {};
__export(progress_exports, {
  Progress: () => Progress
});
module.exports = __toCommonJS(progress_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Progress({ value, max = 100, label, className, ...props }) {
  const bound = Math.max(1, max);
  const current = value === void 0 ? void 0 : Math.max(0, Math.min(bound, value));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": bound, "aria-valuenow": current, className: (0, import_utils.cx)("md-progress", className), "data-indeterminate": current === void 0 || void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: current === void 0 ? "40%" : `${current / bound * 100}%` } }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Progress
});
