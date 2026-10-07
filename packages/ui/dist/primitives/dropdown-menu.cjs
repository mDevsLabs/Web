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
var dropdown_menu_exports = {};
__export(dropdown_menu_exports, {
  DropdownMenu: () => DropdownMenu
});
module.exports = __toCommonJS(dropdown_menu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
var import_theme = require("../internal/theme.cjs");
function DropdownMenu({ trigger, items, label }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.DropdownMenu.Root, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_theme.PortalScope, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Content, { className: "md-glass md-menu", sideOffset: 8, "aria-label": label, children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
      item.separatorBefore && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Separator, { className: "md-separator" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Item, { className: "md-menu-item", disabled: item.disabled, "data-danger": item.danger || void 0, onSelect: item.onSelect, children: item.label })
    ] }, item.id)) }) }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DropdownMenu
});
