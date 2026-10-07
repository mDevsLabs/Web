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
var layers_arrow_down_exports = {};
__export(layers_arrow_down_exports, {
  LayersArrowDownIcon: () => LayersArrowDownIcon
});
module.exports = __toCommonJS(layers_arrow_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayersArrowDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayersArrowDownIcon", [["path", { "d": "M12 7v15" }], ["path", { "d": "M2 12a1 1 0 00.58.91l5.093 2.316" }], ["path", { "d": "M22 12a1 1 0 01-.59.92l-5.077 2.308" }], ["path", { "d": "M8 10.37 2.6 7.91a1 1 0 010-1.831l8.57-3.9a2 2 0 011.66.001l8.59 3.91a1 1 0 010 1.831l-5.392 2.45" }], ["path", { "d": "m9 19 3 3 3-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayersArrowDownIcon
});
