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
var abc_exports = {};
__export(abc_exports, {
  AbcIcon: () => AbcIcon
});
module.exports = __toCommonJS(abc_exports);
var import_create_icon = require("../../create-icon.cjs");
const AbcIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AbcIcon", [["path", { "d": "M3 16v-6a2 2 0 1 1 4 0v6" }], ["path", { "d": "M3 13h4" }], ["path", { "d": "M10 8v6a2 2 0 1 0 4 0v-1a2 2 0 1 0 -4 0v1" }], ["path", { "d": "M20.732 12a2 2 0 0 0 -3.732 1v1a2 2 0 0 0 3.726 1.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AbcIcon
});
