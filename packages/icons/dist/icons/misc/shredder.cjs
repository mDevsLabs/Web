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
var shredder_exports = {};
__export(shredder_exports, {
  ShredderIcon: () => ShredderIcon
});
module.exports = __toCommonJS(shredder_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShredderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShredderIcon", [["path", { "d": "M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5" }], ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "M10 22v-5" }], ["path", { "d": "M14 19v-2" }], ["path", { "d": "M18 20v-3" }], ["path", { "d": "M2 13h20" }], ["path", { "d": "M6 20v-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShredderIcon
});
