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
var assembly_off_exports = {};
__export(assembly_off_exports, {
  AssemblyOffIcon: () => AssemblyOffIcon
});
module.exports = __toCommonJS(assembly_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AssemblyOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AssemblyOffIcon", [["path", { "d": "M18.376 18.377l-5.284 3.343a2.27 2.27 0 0 1 -2.184 0l-6.75 -4.27a2.23 2.23 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l1.328 -.783m2.514 -1.487l2.908 -1.71a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033c.7 .398 1.13 1.143 1.125 1.948v7.284c0 .417 -.118 .817 -.33 1.16" }], ["path", { "d": "M14.855 14.855l-2.37 1.519a1 1 0 0 1 -.97 0l-3 -1.922a1 1 0 0 1 -.515 -.876v-3.278c0 -.364 .197 -.7 .514 -.877l.563 -.336m2.437 -1.454a1.03 1.03 0 0 1 1 0l3 1.79h-.014c.312 .181 .503 .516 .5 .877v1.702" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AssemblyOffIcon
});
