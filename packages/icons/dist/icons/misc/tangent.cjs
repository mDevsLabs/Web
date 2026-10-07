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
var tangent_exports = {};
__export(tangent_exports, {
  TangentIcon: () => TangentIcon
});
module.exports = __toCommonJS(tangent_exports);
var import_create_icon = require("../../create-icon.cjs");
const TangentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TangentIcon", [["circle", { "cx": "17", "cy": "4", "r": "2" }], ["path", { "d": "M15.59 5.41 5.41 15.59" }], ["circle", { "cx": "4", "cy": "17", "r": "2" }], ["path", { "d": "M12 22s-4-9-1.5-11.5S22 12 22 12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TangentIcon
});
