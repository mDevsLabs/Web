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
var joystick_exports = {};
__export(joystick_exports, {
  JoystickIcon: () => JoystickIcon
});
module.exports = __toCommonJS(joystick_exports);
var import_create_icon = require("../../create-icon.cjs");
const JoystickIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("JoystickIcon", [["path", { "d": "M21 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2Z" }], ["path", { "d": "M6 15v-2" }], ["path", { "d": "M12 15V9" }], ["circle", { "cx": "12", "cy": "6", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JoystickIcon
});
