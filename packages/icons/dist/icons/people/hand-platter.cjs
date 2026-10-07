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
var hand_platter_exports = {};
__export(hand_platter_exports, {
  HandPlatterIcon: () => HandPlatterIcon
});
module.exports = __toCommonJS(hand_platter_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandPlatterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandPlatterIcon", [["path", { "d": "M12 3V2" }], ["path", { "d": "m15.4 17.4 3.2-2.8a2 2 0 1 1 2.8 2.9l-3.6 3.3c-.7.8-1.7 1.2-2.8 1.2h-4c-1.1 0-2.1-.4-2.8-1.2l-1.302-1.464A1 1 0 0 0 6.151 19H5" }], ["path", { "d": "M2 14h12a2 2 0 0 1 0 4h-2" }], ["path", { "d": "M4 10h16" }], ["path", { "d": "M5 10a7 7 0 0 1 14 0" }], ["path", { "d": "M5 14v6a1 1 0 0 1-1 1H2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandPlatterIcon
});
