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
var snowflake_exports = {};
__export(snowflake_exports, {
  SnowflakeIcon: () => SnowflakeIcon
});
module.exports = __toCommonJS(snowflake_exports);
var import_create_icon = require("../../create-icon.cjs");
const SnowflakeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SnowflakeIcon", [["path", { "d": "m10 20-1.25-2.5L6 18" }], ["path", { "d": "M10 4 8.75 6.5 6 6" }], ["path", { "d": "m14 20 1.25-2.5L18 18" }], ["path", { "d": "m14 4 1.25 2.5L18 6" }], ["path", { "d": "m17 21-3-6h-4" }], ["path", { "d": "m17 3-3 6 1.5 3" }], ["path", { "d": "M2 12h6.5L10 9" }], ["path", { "d": "m20 10-1.5 2 1.5 2" }], ["path", { "d": "M22 12h-6.5L14 15" }], ["path", { "d": "m4 10 1.5 2L4 14" }], ["path", { "d": "m7 21 3-6-1.5-3" }], ["path", { "d": "m7 3 3 6h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SnowflakeIcon
});
