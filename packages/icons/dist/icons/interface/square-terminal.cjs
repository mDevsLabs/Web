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
var square_terminal_exports = {};
__export(square_terminal_exports, {
  SquareTerminalIcon: () => SquareTerminalIcon
});
module.exports = __toCommonJS(square_terminal_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareTerminalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareTerminalIcon", [["path", { "d": "m7 11 2-2-2-2" }], ["path", { "d": "M11 13h4" }], ["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2", "ry": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareTerminalIcon
});
