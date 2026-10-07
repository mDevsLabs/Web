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
var wind_arrow_down_exports = {};
__export(wind_arrow_down_exports, {
  WindArrowDownIcon: () => WindArrowDownIcon
});
module.exports = __toCommonJS(wind_arrow_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const WindArrowDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WindArrowDownIcon", [["path", { "d": "M10 2v8" }], ["path", { "d": "M12.8 21.6A2 2 0 1 0 14 18H2" }], ["path", { "d": "M17.5 10a2.5 2.5 0 1 1 2 4H2" }], ["path", { "d": "m6 6 4 4 4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WindArrowDownIcon
});
