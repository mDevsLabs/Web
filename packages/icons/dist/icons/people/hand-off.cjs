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
var hand_off_exports = {};
__export(hand_off_exports, {
  HandOffIcon: () => HandOffIcon
});
module.exports = __toCommonJS(hand_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandOffIcon", [["path", { "d": "M3 3l18 18" }], ["path", { "d": "M8 13.5v-5.5m.44 -3.562a1.5 1.5 0 0 1 2.56 1.062v1.5m0 4.008v.992m0 -6.5v-2a1.5 1.5 0 1 1 3 0v6.5m0 -4.5a1.5 1.5 0 0 1 3 0v6.5m0 -4.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2c-2.114 -.292 -3.956 -1.397 -5 -3l-2.7 -5.25a1.7 1.7 0 0 1 2.75 -2l.9 1.75" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandOffIcon
});
