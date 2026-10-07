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
var stone_exports = {};
__export(stone_exports, {
  StoneIcon: () => StoneIcon
});
module.exports = __toCommonJS(stone_exports);
var import_create_icon = require("../../create-icon.cjs");
const StoneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StoneIcon", [["path", { "d": "M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z" }], ["path", { "d": "M11.99 22 14 12l7.822 3.184" }], ["path", { "d": "M14 12 8.47 2.302" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StoneIcon
});
