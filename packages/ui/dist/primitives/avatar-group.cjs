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
var avatar_group_exports = {};
__export(avatar_group_exports, {
  AvatarGroup: () => AvatarGroup
});
module.exports = __toCommonJS(avatar_group_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function AvatarGroup({ names, max = 4, className, ...props }) {
  const count = Math.max(1, max);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-avatar-group", className), role: "group", "aria-label": names.join(", "), children: [
    names.slice(0, count).map((name, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-avatar", title: name, "aria-hidden": "true", children: name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() }, `${name}-${i}`)),
    names.length > count && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "md-avatar", children: [
      "+",
      names.length - count
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AvatarGroup
});
