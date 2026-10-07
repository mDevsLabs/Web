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
var gamepad_2_exports = {};
__export(gamepad_2_exports, {
  Gamepad2Icon: () => Gamepad2Icon
});
module.exports = __toCommonJS(gamepad_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Gamepad2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Gamepad2Icon", [["line", { "x1": "6", "x2": "10", "y1": "11", "y2": "11" }], ["line", { "x1": "8", "x2": "8", "y1": "9", "y2": "13" }], ["line", { "x1": "15", "x2": "15.01", "y1": "12", "y2": "12" }], ["line", { "x1": "18", "x2": "18.01", "y1": "10", "y2": "10" }], ["path", { "d": "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Gamepad2Icon
});
