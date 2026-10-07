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
var vector_square_exports = {};
__export(vector_square_exports, {
  VectorSquareIcon: () => VectorSquareIcon
});
module.exports = __toCommonJS(vector_square_exports);
var import_create_icon = require("../../create-icon.cjs");
const VectorSquareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VectorSquareIcon", [["path", { "d": "M17.055 4.533a24 24 0 00-10.11 0" }], ["path", { "d": "M19.467 17.055a24 24 0 000-10.11" }], ["path", { "d": "M4.533 6.945a24 24 0 000 10.11" }], ["path", { "d": "M6.945 19.467a24 24 0 0010.11 0" }], ["circle", { "cx": "19", "cy": "19", "r": "2" }], ["circle", { "cx": "19", "cy": "5", "r": "2" }], ["circle", { "cx": "5", "cy": "19", "r": "2" }], ["circle", { "cx": "5", "cy": "5", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VectorSquareIcon
});
