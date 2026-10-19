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
var popover_exports = {};
__export(popover_exports, {
  Popover: () => Popover
});
module.exports = __toCommonJS(popover_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
var import_theme = require("../internal/theme.cjs");
function Popover({ trigger, children, label, side = "bottom", ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Popover.Root, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Popover.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Popover.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_theme.PortalScope, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Popover.Content, { side, sideOffset: 8, className: "md-glass md-popover", "aria-label": label, children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Popover.Arrow, { className: "md-popover-arrow" })
    ] }) }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Popover
});
