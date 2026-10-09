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
var file_upload_exports = {};
__export(file_upload_exports, {
  FileUpload: () => FileUpload
});
module.exports = __toCommonJS(file_upload_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function FileUpload({ label, onFilesChange, id, className, ...props }) {
  const generated = (0, import_react.useId)();
  const [names, setNames] = (0, import_react.useState)([]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: (0, import_utils.cx)("md-upload md-glass", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id ?? generated, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, id: id ?? generated, type: "file", onChange: (e) => {
      const files = Array.from(e.target.files ?? []);
      setNames(files.map((f) => f.name));
      onFilesChange?.(files);
    } }),
    names.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: names.map((name, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: name }, `${name}-${i}`)) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileUpload
});
