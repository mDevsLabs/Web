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
var cog_exports = {};
__export(cog_exports, {
  CogIcon: () => CogIcon
});
module.exports = __toCommonJS(cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const CogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CogIcon", [["path", { "d": "M11 10.27 7 3.34" }], ["path", { "d": "m11 13.73-4 6.93" }], ["path", { "d": "M12 22v-2" }], ["path", { "d": "M12 2v2" }], ["path", { "d": "M14 12h8" }], ["path", { "d": "m17 20.66-1-1.73" }], ["path", { "d": "m17 3.34-1 1.73" }], ["path", { "d": "M2 12h2" }], ["path", { "d": "m20.66 17-1.73-1" }], ["path", { "d": "m20.66 7-1.73 1" }], ["path", { "d": "m3.34 17 1.73-1" }], ["path", { "d": "m3.34 7 1.73 1" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }], ["circle", { "cx": "12", "cy": "12", "r": "8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CogIcon
});
