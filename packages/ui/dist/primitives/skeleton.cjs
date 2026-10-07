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
var skeleton_exports = {};
__export(skeleton_exports, {
  Skeleton: () => Skeleton
});
module.exports = __toCommonJS(skeleton_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Skeleton({ width = "100%", height = "1rem", style, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ...props, "aria-hidden": "true", className: (0, import_utils.cx)("md-skeleton", className), style: { width, height, ...style } });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Skeleton
});
