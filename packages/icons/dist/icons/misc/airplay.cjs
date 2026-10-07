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
var airplay_exports = {};
__export(airplay_exports, {
  AirplayIcon: () => AirplayIcon
});
module.exports = __toCommonJS(airplay_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirplayIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirplayIcon", [["path", { "d": "M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" }], ["path", { "d": "m12 15 5 6H7Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirplayIcon
});
