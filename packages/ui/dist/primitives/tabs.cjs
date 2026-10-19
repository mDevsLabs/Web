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
var tabs_exports = {};
__export(tabs_exports, {
  Tabs: () => Tabs
});
module.exports = __toCommonJS(tabs_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
function Tabs({ items, label, defaultValue, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Tabs.Root, { defaultValue: defaultValue ?? items[0]?.id, ...props, className: "md-tabs", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tabs.List, { "aria-label": label, className: "md-tab-list", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tabs.Trigger, { value: item.id, disabled: item.disabled, className: "md-tab", children: item.label }, item.id)) }),
    items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Tabs.Content, { value: item.id, className: "md-tab-panel", children: item.content }, item.id))
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Tabs
});
