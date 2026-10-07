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
var bulldozer_exports = {};
__export(bulldozer_exports, {
  BulldozerIcon: () => BulldozerIcon
});
module.exports = __toCommonJS(bulldozer_exports);
var import_create_icon = require("../../create-icon.cjs");
const BulldozerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BulldozerIcon", [["path", { "d": "M2 17a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M12 17a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M19 13v4a2 2 0 0 0 2 2h1" }], ["path", { "d": "M14 19h-10" }], ["path", { "d": "M4 15h10" }], ["path", { "d": "M9 11v-5h2a3 3 0 0 1 3 3v6" }], ["path", { "d": "M5 15v-3a1 1 0 0 1 1 -1h8" }], ["path", { "d": "M19 17h-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BulldozerIcon
});
