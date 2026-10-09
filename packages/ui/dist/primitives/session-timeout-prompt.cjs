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
var session_timeout_prompt_exports = {};
__export(session_timeout_prompt_exports, {
  SessionTimeoutPrompt: () => SessionTimeoutPrompt
});
module.exports = __toCommonJS(session_timeout_prompt_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_radix_ui = require("radix-ui");
var import_theme = require("../internal/theme.cjs");
function SessionTimeoutPrompt({ open, onOpenChange, secondsRemaining, onContinue, onSignOut, pending = false, onReturnFocus }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Root, { open, onOpenChange, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_theme.PortalScope, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Overlay, { className: "md-overlay" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Content, { className: "md-dialog md-glass", onCloseAutoFocus: (event) => {
      if (onReturnFocus) {
        event.preventDefault();
        onReturnFocus();
      }
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Dialog.Title, { className: "md-heading", children: "Votre session va expirer" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.Dialog.Description, { children: [
        "Temps restant : ",
        Math.max(0, Math.floor(secondsRemaining)),
        " secondes. Souhaitez-vous poursuivre ?"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-cluster", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button", disabled: pending, onClick: onContinue, children: "Continuer la session" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", disabled: pending, onClick: onSignOut, children: "Se d\xE9connecter" })
      ] })
    ] })
  ] }) }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SessionTimeoutPrompt
});
