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
var milk_exports = {};
__export(milk_exports, {
  MilkIcon: () => MilkIcon
});
module.exports = __toCommonJS(milk_exports);
var import_create_icon = require("../../create-icon.cjs");
const MilkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MilkIcon", [["path", { "d": "M8 2h8" }], ["path", { "d": "M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" }], ["path", { "d": "M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MilkIcon
});
