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
var vector_polygon_exports = {};
__export(vector_polygon_exports, {
  VectorPolygonIcon: () => VectorPolygonIcon
});
module.exports = __toCommonJS(vector_polygon_exports);
var import_create_icon = require("../../create-icon.cjs");
const VectorPolygonIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VectorPolygonIcon", [["path", { "d": "m12.828 4.813 5.344 2.375" }], ["path", { "d": "m15.769 18.153 3.461-8.306" }], ["path", { "d": "m5.687 14.074 7.625 4.852" }], ["path", { "d": "M9.772 5.579 5.228 11.42" }], ["circle", { "cx": "11", "cy": "4", "r": "2" }], ["circle", { "cx": "15", "cy": "20", "r": "2" }], ["circle", { "cx": "20", "cy": "8", "r": "2" }], ["circle", { "cx": "4", "cy": "13", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VectorPolygonIcon
});
