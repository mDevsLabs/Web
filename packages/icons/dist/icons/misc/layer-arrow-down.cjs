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
var layer_arrow_down_exports = {};
__export(layer_arrow_down_exports, {
  LayerArrowDownIcon: () => LayerArrowDownIcon
});
module.exports = __toCommonJS(layer_arrow_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayerArrowDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayerArrowDownIcon", [["path", { "d": "M12 10v10" }], ["path", { "d": "M22 10a1 1 0 01-.59.92l-5.077 2.308" }], ["path", { "d": "M22.017 10.005a1 1 0 00-.597-.916l-8.59-3.91a2 2 0 00-1.66.001L2.6 9.08a1 1 0 00-.02 1.831l5.093 2.316" }], ["path", { "d": "m9 17 3 3 3-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayerArrowDownIcon
});
