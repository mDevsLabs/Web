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
var pointer_exports = {};
__export(pointer_exports, {
  PointerIcon: () => PointerIcon
});
module.exports = __toCommonJS(pointer_exports);
var import_create_icon = require("../../create-icon.cjs");
const PointerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PointerIcon", [["path", { "d": "M22 14a8 8 0 0 1-8 8" }], ["path", { "d": "M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }], ["path", { "d": "M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" }], ["path", { "d": "M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" }], ["path", { "d": "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PointerIcon
});
