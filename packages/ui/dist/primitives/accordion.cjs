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
var accordion_exports = {};
__export(accordion_exports, {
  Accordion: () => Accordion
});
module.exports = __toCommonJS(accordion_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
function Accordion({ items, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Accordion.Root, { type: "single", collapsible: true, ...props, className: "md-accordion", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Accordion.Item, { value: item.id, disabled: item.disabled, className: "md-accordion-item", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Accordion.Header, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Accordion.Trigger, { className: "md-accordion-trigger", children: [
      item.title,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "\u2304" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Accordion.Content, { className: "md-accordion-content", children: item.content })
  ] }, item.id)) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Accordion
});
