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
var sport_shoe_exports = {};
__export(sport_shoe_exports, {
  SportShoeIcon: () => SportShoeIcon
});
module.exports = __toCommonJS(sport_shoe_exports);
var import_create_icon = require("../../create-icon.cjs");
const SportShoeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SportShoeIcon", [["path", { "d": "m15 10.42 4.8-5.07" }], ["path", { "d": "M19 18h3" }], ["path", { "d": "M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SportShoeIcon
});
