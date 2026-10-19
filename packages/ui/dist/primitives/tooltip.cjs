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
var stdin_exports = {};
__export(stdin_exports, {
  Tooltip: () => Tooltip
});
module.exports = __toCommonJS(stdin_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
var import_theme = require("../internal/theme.js");
function Tooltip({ content, children, delayDuration = 350, side = "top" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tooltip.Provider, { delayDuration, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Tooltip.Root, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tooltip.Trigger, { asChild: true, children }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tooltip.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_theme.PortalScope, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Tooltip.Content, { className: "md-tooltip", side, sideOffset: 8, children: [
      content,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tooltip.Arrow, { className: "md-tooltip-arrow" })
    ] }) }) })
  ] }) });
}
