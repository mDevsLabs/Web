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
var undo_notice_exports = {};
__export(undo_notice_exports, {
  UndoNotice: () => UndoNotice
});
module.exports = __toCommonJS(undo_notice_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function UndoNotice({ message, onUndo, onDismiss, pending = false, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-undo-notice md-glass", className), "aria-busy": pending || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "status", children: message }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-cluster", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-soft", disabled: pending, onClick: onUndo, children: "Annuler l\u2019action" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", disabled: pending, "aria-label": "Fermer la confirmation", onClick: onDismiss, children: "Fermer" })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UndoNotice
});
