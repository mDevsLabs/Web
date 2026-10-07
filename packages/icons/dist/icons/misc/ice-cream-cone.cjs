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
var ice_cream_cone_exports = {};
__export(ice_cream_cone_exports, {
  IceCreamConeIcon: () => IceCreamConeIcon
});
module.exports = __toCommonJS(ice_cream_cone_exports);
var import_create_icon = require("../../create-icon.cjs");
const IceCreamConeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IceCreamConeIcon", [["path", { "d": "m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11" }], ["path", { "d": "M17 7A5 5 0 0 0 7 7" }], ["path", { "d": "M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IceCreamConeIcon
});
