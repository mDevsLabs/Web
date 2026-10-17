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
var mobile_navigation_exports = {};
__export(mobile_navigation_exports, {
  MobileNavigation: () => MobileNavigation
});
module.exports = __toCommonJS(mobile_navigation_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
var import_utils = require("../internal/utils.cjs");
var import_theme = require("../internal/theme.cjs");
function MobileNavigation({ label, items, currentId, open, onOpenChange }) {
  const [visible, setVisible] = (0, import_utils.useControllable)(open, false, onOpenChange);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Root, { open: visible, onOpenChange: setVisible, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Trigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", "aria-label": `Ouvrir : ${label}`, children: "Menu" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_theme.PortalScope, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Content, { className: "md-dialog md-glass", "aria-describedby": void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Title, { className: "md-heading", children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { "aria-label": label, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "md-navigation-links", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Close, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: item.href, "aria-current": currentId === item.id ? "page" : void 0, children: item.label }) }) }, item.id)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Close, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", children: "Fermer le menu" }) })
      ] })
    ] }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MobileNavigation
});
