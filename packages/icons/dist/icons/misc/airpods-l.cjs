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
var airpods_l_exports = {};
__export(airpods_l_exports, {
  AirpodsLIcon: () => AirpodsLIcon
});
module.exports = __toCommonJS(airpods_l_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirpodsLIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirpodsLIcon", [["path", { "d": "M6 4a4 4 0 0 1 4 3.8v10.7a1.5 1.5 0 1 1 -3 0v-6.5h-1a4 4 0 0 1 -4 -3.8v-.2a4 4 0 0 1 4 -4" }], ["path", { "d": "M15 8v8h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirpodsLIcon
});
