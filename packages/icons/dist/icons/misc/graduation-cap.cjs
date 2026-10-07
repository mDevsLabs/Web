"use client";
"use strict";
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
var graduation_cap_exports = {};
__export(graduation_cap_exports, {
  GraduationCapIcon: () => GraduationCapIcon
});
module.exports = __toCommonJS(graduation_cap_exports);
var import_create_icon = require("../../create-icon.cjs");
const GraduationCapIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GraduationCapIcon", [["path", { "d": "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" }], ["path", { "d": "M22 10v6" }], ["path", { "d": "M6 12.5V16a6 3 0 0 0 12 0v-3.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GraduationCapIcon
});
