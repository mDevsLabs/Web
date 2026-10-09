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
var switch_exports = {};
__export(switch_exports, {
  Switch: () => Switch
});
module.exports = __toCommonJS(switch_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_radix_ui = require("radix-ui");
var import_utils = require("../internal/utils.cjs");
function Switch({ label, id, className, ...props }) {
  const generated = (0, import_react.useId)();
  const inputId = id ?? generated;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-check-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Switch.Root, { ...props, id: inputId, className: (0, import_utils.cx)("md-switch", className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Switch.Thumb, { className: "md-switch-thumb" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: inputId, children: label })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Switch
});
