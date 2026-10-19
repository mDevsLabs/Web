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
var avatar_exports = {};
__export(avatar_exports, {
  Avatar: () => Avatar
});
module.exports = __toCommonJS(avatar_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function Avatar({ src, name, size = 40, style, className, ...props }) {
  const [failed, setFailed] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => setFailed(false), [src]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ...props, role: "img", "aria-label": name, className: (0, import_utils.cx)("md-avatar", className), style: { width: size, height: size, ...style }, children: src && !failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src, alt: "", onError: () => setFailed(true) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Avatar
});
