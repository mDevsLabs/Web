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
var layers_minus_exports = {};
__export(layers_minus_exports, {
  LayersMinusIcon: () => LayersMinusIcon
});
module.exports = __toCommonJS(layers_minus_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayersMinusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayersMinusIcon", [["path", { "d": "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 .83.18 2 2 0 0 0 .83-.18l8.58-3.9a1 1 0 0 0 0-1.832z" }], ["path", { "d": "M16 17h6" }], ["path", { "d": "M2.003 11.995a1 1 0 0 0 .597.915l8.58 3.91a2 2 0 0 0 .83.18" }], ["path", { "d": "M2.003 16.995a1 1 0 0 0 .597.915l8.58 3.91a2 2 0 0 0 .83.18 2 2 0 0 0 .83-.18l2.11-.96" }], ["path", { "d": "M22.018 12.004a1 1 0 0 1-.598.916l-.177.08" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayersMinusIcon
});
