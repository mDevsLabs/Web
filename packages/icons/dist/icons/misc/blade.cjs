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
var blade_exports = {};
__export(blade_exports, {
  BladeIcon: () => BladeIcon
});
module.exports = __toCommonJS(blade_exports);
var import_create_icon = require("../../create-icon.cjs");
const BladeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BladeIcon", [["path", { "d": "M17.707 3.707l2.586 2.586a1 1 0 0 1 0 1.414l-.586 .586a1 1 0 0 0 0 1.414l.586 .586a1 1 0 0 1 0 1.414l-8.586 8.586a1 1 0 0 1 -1.414 0l-.586 -.586a1 1 0 0 0 -1.414 0l-.586 .586a1 1 0 0 1 -1.414 0l-2.586 -2.586a1 1 0 0 1 0 -1.414l.586 -.586a1 1 0 0 0 0 -1.414l-.586 -.586a1 1 0 0 1 0 -1.414l8.586 -8.586a1 1 0 0 1 1.414 0l.586 .586a1 1 0 0 0 1.414 0l.586 -.586a1 1 0 0 1 1.414 0" }], ["path", { "d": "M8 16l3.2 -3.2" }], ["path", { "d": "M12.8 11.2l3.2 -3.2" }], ["path", { "d": "M14 8l2 2" }], ["path", { "d": "M8 14l2 2" }], ["path", { "d": "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BladeIcon
});
