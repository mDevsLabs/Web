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
var upload_progress_exports = {};
__export(upload_progress_exports, {
  UploadProgress: () => UploadProgress
});
module.exports = __toCommonJS(upload_progress_exports);
var import_jsx_runtime = require("react/jsx-runtime");
function UploadProgress({ name, progress, status = "uploading", onCancel }) {
  const value = Math.max(0, Math.min(100, progress));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-glass md-upload-progress", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-domain-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: status === "error" ? "\xC9chec" : status === "complete" ? "Termin\xE9" : `${Math.round(value)} %` })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { role: "progressbar", "aria-label": name, "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": 100, className: "md-progress", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${value}%` } }) }),
    onCancel && status === "uploading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", onClick: onCancel, children: "Annuler" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UploadProgress
});
