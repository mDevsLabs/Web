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
var layer_arrow_up_exports = {};
__export(layer_arrow_up_exports, {
  LayerArrowUpIcon: () => LayerArrowUpIcon
});
module.exports = __toCommonJS(layer_arrow_up_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayerArrowUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayerArrowUpIcon", [["path", { "d": "M12 14V4" }], ["path", { "d": "M7.674 10.774 2.58 13.09a1 1 0 000 1.822l8.6 3.91a2 2 0 001.65 0l8.58-3.9a1 1 0 00.59-.92 1 1 0 00-.59-.922l-5.078-2.308" }], ["path", { "d": "m9 7 3-3 3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayerArrowUpIcon
});
