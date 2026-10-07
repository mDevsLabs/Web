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
var hand_click_exports = {};
__export(hand_click_exports, {
  HandClickIcon: () => HandClickIcon
});
module.exports = __toCommonJS(hand_click_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandClickIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandClickIcon", [["path", { "d": "M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" }], ["path", { "d": "M11 11.5v-2a1.5 1.5 0 0 1 3 0v2.5" }], ["path", { "d": "M14 10.5a1.5 1.5 0 0 1 3 0v1.5" }], ["path", { "d": "M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" }], ["path", { "d": "M5 3l-1 -1" }], ["path", { "d": "M4 7h-1" }], ["path", { "d": "M14 3l1 -1" }], ["path", { "d": "M15 6h1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandClickIcon
});
