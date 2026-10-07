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
var layers_arrow_up_exports = {};
__export(layers_arrow_up_exports, {
  LayersArrowUpIcon: () => LayersArrowUpIcon
});
module.exports = __toCommonJS(layers_arrow_up_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayersArrowUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayersArrowUpIcon", [["path", { "d": "M12 12V2" }], ["path", { "d": "M2 17.002a1 1 0 00.58.91l8.6 3.91a2 2 0 001.65 0l8.58-3.9a1 1 0 00.59-.92" }], ["path", { "d": "M7.674 8.774 2.58 11.09a1 1 0 000 1.822l8.6 3.91a2 2 0 001.65 0l8.58-3.9a1 1 0 00.59-.92 1 1 0 00-.59-.922l-5.078-2.308" }], ["path", { "d": "m9 5 3-3 3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayersArrowUpIcon
});
