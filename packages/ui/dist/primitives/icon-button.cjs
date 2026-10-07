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
var icon_button_exports = {};
__export(icon_button_exports, {
  IconButton: () => IconButton
});
module.exports = __toCommonJS(icon_button_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
const IconButton = (0, import_react.forwardRef)(function IconButton2({ label, className, type = "button", ...props }, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ...props, ref, type, "aria-label": label, className: (0, import_utils.cx)("md-button md-button-ghost md-icon-button", className) });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IconButton
});
