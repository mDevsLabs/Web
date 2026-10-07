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
var backhoe_exports = {};
__export(backhoe_exports, {
  BackhoeIcon: () => BackhoeIcon
});
module.exports = __toCommonJS(backhoe_exports);
var import_create_icon = require("../../create-icon.cjs");
const BackhoeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BackhoeIcon", [["path", { "d": "M2 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M11 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M13 19l-9 0" }], ["path", { "d": "M4 15l9 0" }], ["path", { "d": "M8 12v-5h2a3 3 0 0 1 3 3v5" }], ["path", { "d": "M5 15v-2a1 1 0 0 1 1 -1h7" }], ["path", { "d": "M21.12 9.88l-3.12 -4.88l-5 5" }], ["path", { "d": "M21.12 9.88a3 3 0 0 1 -2.12 5.12a3 3 0 0 1 -2.12 -.88l4.24 -4.24" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BackhoeIcon
});
