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
var command_palette_exports = {};
__export(command_palette_exports, {
  CommandPalette: () => CommandPalette
});
module.exports = __toCommonJS(command_palette_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_radix_ui = require("radix-ui");
var import_theme = require("../internal/theme.cjs");
function CommandPalette({ items, open, onOpenChange, trigger, title = "Rechercher une action" }) {
  const [query, setQuery] = (0, import_react.useState)("");
  const inputId = (0, import_react.useId)();
  const filtered = items.filter((item) => `${item.label} ${item.keywords ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Root, { open, onOpenChange: (value) => {
    if (!value)
      setQuery("");
    onOpenChange?.(value);
  }, children: [
    trigger && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_theme.PortalScope, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Content, { className: "md-glass md-dialog", "aria-describedby": void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Title, { children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: inputId, className: "md-sr-only", children: "Rechercher une action" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: inputId, autoFocus: true, className: "md-input", type: "search", value: query, onChange: (e) => setQuery(e.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "md-command-list", children: filtered.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Close, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-list-action", onClick: item.onSelect, children: item.label }) }) }, item.id)) }),
        filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "status", children: "Aucun r\xE9sultat." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Close, { className: "md-close", "aria-label": "Fermer", children: "\xD7" })
      ] })
    ] }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CommandPalette
});
