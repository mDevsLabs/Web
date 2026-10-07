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
var lamp_floor_exports = {};
__export(lamp_floor_exports, {
  LampFloorIcon: () => LampFloorIcon
});
module.exports = __toCommonJS(lamp_floor_exports);
var import_create_icon = require("../../create-icon.cjs");
const LampFloorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LampFloorIcon", [["path", { "d": "M12 10v12" }], ["path", { "d": "M17.929 7.629A1 1 0 0 1 17 9H7a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 9 2h6a1 1 0 0 1 .928.629z" }], ["path", { "d": "M9 22h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LampFloorIcon
});
