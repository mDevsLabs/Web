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
var milk_off_exports = {};
__export(milk_off_exports, {
  MilkOffIcon: () => MilkOffIcon
});
module.exports = __toCommonJS(milk_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MilkOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MilkOffIcon", [["path", { "d": "M8 2h8" }], ["path", { "d": "M9 2v1.343M15 2v2.789a4 4 0 0 0 .672 2.219l.656.984a4 4 0 0 1 .672 2.22v1.131M7.8 7.8l-.128.192A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3" }], ["path", { "d": "M7 15a6.47 6.47 0 0 1 5 0 6.472 6.472 0 0 0 3.435.435" }], ["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MilkOffIcon
});
