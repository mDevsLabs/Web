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
var utility_pole_exports = {};
__export(utility_pole_exports, {
  UtilityPoleIcon: () => UtilityPoleIcon
});
module.exports = __toCommonJS(utility_pole_exports);
var import_create_icon = require("../../create-icon.cjs");
const UtilityPoleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UtilityPoleIcon", [["path", { "d": "M12 2v20" }], ["path", { "d": "M2 5h20" }], ["path", { "d": "M3 3v2" }], ["path", { "d": "M7 3v2" }], ["path", { "d": "M17 3v2" }], ["path", { "d": "M21 3v2" }], ["path", { "d": "m19 5-7 7-7-7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UtilityPoleIcon
});
