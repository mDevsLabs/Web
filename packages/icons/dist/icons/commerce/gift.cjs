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
var gift_exports = {};
__export(gift_exports, {
  GiftIcon: () => GiftIcon
});
module.exports = __toCommonJS(gift_exports);
var import_create_icon = require("../../create-icon.cjs");
const GiftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GiftIcon", [["path", { "d": "M12 7v14" }], ["path", { "d": "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }], ["path", { "d": "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" }], ["rect", { "x": "3", "y": "7", "width": "18", "height": "4", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GiftIcon
});
