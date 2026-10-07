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
var cone_exports = {};
__export(cone_exports, {
  ConeIcon: () => ConeIcon
});
module.exports = __toCommonJS(cone_exports);
var import_create_icon = require("../../create-icon.cjs");
const ConeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ConeIcon", [["path", { "d": "m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98" }], ["ellipse", { "cx": "12", "cy": "19", "rx": "9", "ry": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConeIcon
});
