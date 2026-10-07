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
var mars_stroke_exports = {};
__export(mars_stroke_exports, {
  MarsStrokeIcon: () => MarsStrokeIcon
});
module.exports = __toCommonJS(mars_stroke_exports);
var import_create_icon = require("../../create-icon.cjs");
const MarsStrokeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MarsStrokeIcon", [["path", { "d": "m14 6 4 4" }], ["path", { "d": "M17 3h4v4" }], ["path", { "d": "m21 3-7.75 7.75" }], ["circle", { "cx": "9", "cy": "15", "r": "6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MarsStrokeIcon
});
