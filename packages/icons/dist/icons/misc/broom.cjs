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
var broom_exports = {};
__export(broom_exports, {
  BroomIcon: () => BroomIcon
});
module.exports = __toCommonJS(broom_exports);
var import_create_icon = require("../../create-icon.cjs");
const BroomIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BroomIcon", [["path", { "d": "M13.5 10.5 22 2" }], ["path", { "d": "M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z" }], ["path", { "d": "m5 18 2-2" }], ["path", { "d": "m7.699 10.7 5.602 5.601" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BroomIcon
});
