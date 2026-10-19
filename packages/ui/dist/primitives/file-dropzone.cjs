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
var file_dropzone_exports = {};
__export(file_dropzone_exports, {
  FileDropzone: () => FileDropzone
});
module.exports = __toCommonJS(file_dropzone_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function FileDropzone({ label, onFiles, onRejected, accept, multiple = false, maxBytes = 10 * 1024 * 1024, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  const [dragging, setDragging] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const select = (files) => {
    if (disabled)
      return;
    const candidate = multiple ? files : files.slice(0, 1);
    const rejected = candidate.filter((file) => file.size > maxBytes);
    const valid = candidate.filter((file) => file.size <= maxBytes);
    setError(rejected.length ? `${rejected.length} fichier(s) d\xE9passe(nt) la taille autoris\xE9e.` : "");
    if (rejected.length)
      onRejected?.(rejected);
    if (valid.length)
      onFiles(valid);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-dropzone", className), "data-dragging": dragging || void 0, onDragOver: (event) => {
    event.preventDefault();
    if (!disabled)
      setDragging(true);
  }, onDragLeave: (event) => {
    if (!event.currentTarget.contains(event.relatedTarget))
      setDragging(false);
  }, onDrop: (event) => {
    event.preventDefault();
    setDragging(false);
    select(Array.from(event.dataTransfer.files));
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-muted", children: "D\xE9posez ici ou utilisez le s\xE9lecteur de fichiers." }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id, type: "file", accept, multiple, disabled, "aria-describedby": error ? `${id}-error` : void 0, onChange: (event) => {
      select(Array.from(event.target.files ?? []));
      event.target.value = "";
    } }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${id}-error`, role: "alert", className: "md-field-error", children: error })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileDropzone
});
