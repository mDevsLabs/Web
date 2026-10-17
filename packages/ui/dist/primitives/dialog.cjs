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
var dialog_exports = {};
__export(dialog_exports, {
  Dialog: () => Dialog
});
module.exports = __toCommonJS(dialog_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_radix_ui = require("radix-ui");
var import_theme = require("../internal/theme.cjs");
function Dialog({ title, description, trigger, children, footer, closeLabel = "Fermer", ...props }) {
  const descriptionId = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Root, { ...props, children: [
    trigger && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_theme.PortalScope, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Content, { className: "md-glass md-dialog", "aria-describedby": description ? descriptionId : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Title, { children: title }),
        description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Description, { id: descriptionId, className: "md-muted", children: description }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children }),
        footer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", { className: "md-card-footer", children: footer }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Close, { className: "md-close", "aria-label": closeLabel, children: "\xD7" })
      ] })
    ] }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dialog
});
