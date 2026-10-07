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
var brick_wall_exports = {};
__export(brick_wall_exports, {
  BrickWallIcon: () => BrickWallIcon
});
module.exports = __toCommonJS(brick_wall_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrickWallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrickWallIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M12 9v6" }], ["path", { "d": "M16 15v6" }], ["path", { "d": "M16 3v6" }], ["path", { "d": "M3 15h18" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M8 15v6" }], ["path", { "d": "M8 3v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrickWallIcon
});
