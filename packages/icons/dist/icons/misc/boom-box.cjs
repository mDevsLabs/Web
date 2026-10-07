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
var boom_box_exports = {};
__export(boom_box_exports, {
  BoomBoxIcon: () => BoomBoxIcon
});
module.exports = __toCommonJS(boom_box_exports);
var import_create_icon = require("../../create-icon.cjs");
const BoomBoxIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BoomBoxIcon", [["path", { "d": "M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" }], ["path", { "d": "M8 8v1" }], ["path", { "d": "M12 8v1" }], ["path", { "d": "M16 8v1" }], ["rect", { "width": "20", "height": "12", "x": "2", "y": "9", "rx": "2" }], ["circle", { "cx": "8", "cy": "15", "r": "2" }], ["circle", { "cx": "16", "cy": "15", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BoomBoxIcon
});
